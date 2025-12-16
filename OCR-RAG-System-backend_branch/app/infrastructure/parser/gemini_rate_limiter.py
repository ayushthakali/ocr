"""
API Rate Limiter with Token Bucket Algorithm and Priority Queue
Implements thread-safe rate limiting with automatic retry, backoff, and prioritization.
Supports both Gemini and Groq APIs with configurable limits.
"""

import asyncio
import time
import re
from typing import Callable, Any, Optional, Dict
from dataclasses import dataclass, field
from enum import Enum
import logging
import heapq

logger = logging.getLogger(__name__)


class APIProvider(Enum):
    """Supported API providers with their default rate limits"""
    GEMINI_FREE = "gemini_free"
    GEMINI_PAID = "gemini_paid"
    GROQ = "groq"
    CUSTOM = "custom"


@dataclass
class RateLimitConfig:
    """Configuration for different API providers"""
    max_tokens: int
    refill_rate: float  # tokens per second
    cooldown_after_429: float
    max_retries: int
    initial_backoff: float
    max_backoff: float
    
    @staticmethod
    def get_preset(provider: APIProvider) -> 'RateLimitConfig':
        """Get preset configuration for known API providers"""
        presets = {
            APIProvider.GEMINI_FREE: RateLimitConfig(
                max_tokens=10,
                refill_rate=10/60,  # 10 requests per minute (Standard for Flash Free Tier)
                cooldown_after_429=60.0,
                max_retries=2,
                initial_backoff=5.0,
                max_backoff=60.0
            ),
            APIProvider.GEMINI_PAID: RateLimitConfig(
                max_tokens=10,
                refill_rate=10/60,  # 10 requests per minute
                cooldown_after_429=60.0,
                max_retries=3,
                initial_backoff=2.0,
                max_backoff=60.0
            ),
            APIProvider.GROQ: RateLimitConfig(
                max_tokens=25,  # Conservative: 25 of 30 RPM
                refill_rate=25/60,  # 25 requests per minute
                cooldown_after_429=15.0,  # Default cooldown (will be overridden by smart parsing)
                max_retries=3,
                initial_backoff=2.0,
                max_backoff=30.0
            )
        }
        return presets.get(provider, presets[APIProvider.GEMINI_FREE])


@dataclass
class RateLimitStats:
    """Statistics for monitoring rate limiter performance"""
    tokens_acquired: int = 0
    tokens_waited: int = 0
    total_wait_time: float = 0.0
    rate_limit_hits: int = 0
    successful_calls: int = 0
    failed_calls: int = 0
    total_calls: int = 0
    average_wait_time: float = 0.0
    last_reset_time: float = field(default_factory=time.monotonic)
    
    def update_average_wait(self) -> None:
        """Update average wait time"""
        if self.tokens_waited > 0:
            self.average_wait_time = self.total_wait_time / self.tokens_waited
    
    def get_success_rate(self) -> float:
        """Get success rate percentage"""
        if self.total_calls == 0:
            return 0.0
        return (self.successful_calls / self.total_calls) * 100


@dataclass(order=True)
class PriorityRequest:
    """Request object for priority queue"""
    priority: int
    timestamp: float
    tokens: float = field(compare=False)
    future: asyncio.Future = field(compare=False)


class RateLimiter:
    """
    Thread-safe token bucket rate limiter for API calls
    
    Features:
    - Token bucket algorithm for smooth rate limiting
    - Automatic cooldown after rate limit hits
    - Smart cooldown parsing ("try again in X seconds")
    - Priority Queue (lower number = higher priority)
    - Exponential backoff retry logic
    """
    
    def __init__(
        self,
        provider: APIProvider = APIProvider.GEMINI_FREE,
        config: Optional[RateLimitConfig] = None,
        min_wait_interval: float = 0.1
    ):
        """
        Initialize rate limiter
        """
        self.provider = provider
        self.config = config or RateLimitConfig.get_preset(provider)
        
        self.max_tokens = float(self.config.max_tokens)
        self.tokens = float(self.config.max_tokens)
        self.refill_rate = self.config.refill_rate
        self.last_refill = time.monotonic()
        
        # We process waiters using a priority queue logic
        self.waiters: list[PriorityRequest] = []
        self.processing_task: Optional[asyncio.Task] = None
        self.lock = asyncio.Lock()  # Protects shared state (tokens, waiters heap)
        
        self.queue_depth = 0
        self.min_wait_interval = min_wait_interval
        
        self.last_429_time: Optional[float] = None
        self.current_cooldown: float = self.config.cooldown_after_429
        self.stats = RateLimitStats()
        
        logger.info(
            f"🔧 Rate limiter initialized for {provider.value}: "
            f"{self.config.max_tokens} tokens, "
            f"{self.config.refill_rate:.4f} tokens/sec "
            f"(~{60/self.config.max_tokens:.1f}s between requests)"
        )

    def _refill_tokens(self) -> None:
        """Refill tokens based on elapsed time"""
        now = time.monotonic()
        elapsed = now - self.last_refill
        
        if elapsed > 0:
            tokens_to_add = elapsed * self.refill_rate
            old_tokens = self.tokens
            self.tokens = min(self.max_tokens, self.tokens + tokens_to_add)
            self.last_refill = now
            
            if self.tokens > old_tokens:
               # logger.debug(f"🔄 Refilled {tokens_to_add:.3f} tokens")
               pass

    def _is_in_cooldown(self) -> bool:
        """Check if we're in cooldown period"""
        if self.last_429_time is None:
            return False
        
        elapsed = time.monotonic() - self.last_429_time
        return elapsed < self.current_cooldown
    
    def _get_cooldown_remaining(self) -> float:
        """Get remaining cooldown time in seconds"""
        if not self._is_in_cooldown():
            return 0.0
        
        elapsed = time.monotonic() - self.last_429_time
        return max(0.0, self.current_cooldown - elapsed)

    def _parse_retry_after(self, error_msg: str) -> Optional[float]:
        """Parse 'try again in X' from error message"""
        # Patterns for Groq/Gemini messages
        # "Please try again in 9m21.6s"
        # "Please try again in 20s"
        try:
            # Look for minutes and seconds
            mins_match = re.search(r'(\d+(?:\.\d+)?)m', error_msg)
            secs_match = re.search(r'(\d+(?:\.\d+)?)s', error_msg)
            
            wait_seconds = 0.0
            found = False
            
            if mins_match:
                wait_seconds += float(mins_match.group(1)) * 60
                found = True
            
            if secs_match:
                # Be careful not to double count if the string is like "9m21s" vs just "21s"
                # If we matched minutes, we might overlap. 
                # Groq format usually: "9m21.6s"
                wait_seconds += float(secs_match.group(1))
                found = True
                
            if found:
                return wait_seconds + 1.0  # Add small buffer
                
            return None
        except Exception:
            return None

    async def _process_waiters(self):
        """Background task to wake up waiters when tokens allow"""
        while True:
            try:
                async with self.lock:
                    if not self.waiters:
                        self.processing_task = None
                        return  # Exit if no waiters
                    
                    # Check cooldown
                    if self._is_in_cooldown():
                        remaining = self._get_cooldown_remaining()
                        # Wait out the cooldown
                        # We release lock to wait
                        pass 
                    else:
                        remaining = 0.0
                
                if remaining > 0:
                    await asyncio.sleep(min(remaining, 1.0))
                    continue

                async with self.lock:
                    self._refill_tokens()
                    
                    # Peek highest priority waiter
                    if not self.waiters:
                        continue
                        
                    request = self.waiters[0]
                    tokens_needed = request.tokens
                    
                    if self.tokens >= tokens_needed:
                        # We can serve this request!
                        heapq.heappop(self.waiters)
                        self.tokens -= tokens_needed
                        self.stats.tokens_acquired += 1
                        
                        if not request.future.done():
                            request.future.set_result(True)
                            logger.debug(f"✅ Served priority {request.priority} request (remaining: {self.tokens:.2f})")
                        
                        continue # Check next waiter immediately
                    
                    # Not enough tokens yet
                    # Calculate wait time
                    needed = tokens_needed - self.tokens
                    wait_time = needed / self.refill_rate
                    wait_time = max(self.min_wait_interval, min(wait_time, 1.0))
                
                await asyncio.sleep(wait_time)
                
            except Exception as e:
                logger.error(f"Error in waiter processing: {e}")
                await asyncio.sleep(1.0)

    def _ensure_processing_started(self):
        """Start background processor if needed"""
        if self.processing_task is None or self.processing_task.done():
            self.processing_task = asyncio.create_task(self._process_waiters())

    async def acquire(self, tokens: float = 1.0, priority: int = 10) -> None:
        """
        Acquire token(s) with priority
        
        Args:
            tokens: Number of tokens
            priority: 0=High (Chat), 10=Low (Processing)
        """
        if tokens > self.max_tokens:
            raise ValueError(f"Cannot acquire {tokens} tokens (max: {self.max_tokens})")
        
        wait_start = None
        
        async with self.lock:
            # Check if we can acquire immediately (if no higher priority waiters)
            # Higher priority = lower number
            has_higher_priority = any(w.priority < priority for w in self.waiters)
            
            self._refill_tokens()
            
            if not self._is_in_cooldown() and not has_higher_priority and self.tokens >= tokens:
                self.tokens -= tokens
                self.stats.tokens_acquired += 1
                return # Acquired immediately
            
            # Must wait
            wait_start = time.monotonic()
            future = asyncio.get_running_loop().create_future()
            request = PriorityRequest(priority=priority, timestamp=wait_start, tokens=tokens, future=future)
            
            heapq.heappush(self.waiters, request)
            self.queue_depth = len(self.waiters)
            self._ensure_processing_started()
            
            if priority == 0:
                logger.info(f"⚡ High priority request queued (pos: 1/{len(self.waiters)})")
            else:
                logger.info(f"⏳ Low priority request queued (pos: {len(self.waiters)})")

        # Wait for the future
        await future
        
        # Stats update
        if wait_start:
            duration = time.monotonic() - wait_start
            self.stats.total_wait_time += duration
            self.stats.tokens_waited += 1
            self.stats.update_average_wait()

    async def _mark_429_error(self, error_msg: str = "") -> None:
        """Mark 429 error and set smart cooldown"""
        async with self.lock:
            self.last_429_time = time.monotonic()
            self.stats.rate_limit_hits += 1
            self.tokens = 0
            
            # Try parse numeric wait time
            parsed_wait = self._parse_retry_after(error_msg)
            if parsed_wait:
                self.current_cooldown = parsed_wait
                logger.warning(f"🚨 Rate limit hit! Smart cooldown: {parsed_wait:.1f}s")
            else:
                self.current_cooldown = self.config.cooldown_after_429
                logger.warning(f"🚨 Rate limit hit! Default cooldown: {self.current_cooldown:.1f}s")

    async def _clear_cooldown(self) -> None:
        async with self.lock:
            if self.last_429_time is not None:
                self.last_429_time = None
                logger.info("✅ API call succeeded, clearing cooldown")

    def _is_rate_limit_error(self, exception: Exception) -> bool:
        """Check if exception is a rate limit error"""
        error_msg = str(exception).lower()
        error_type = type(exception).__name__
        
        rate_limit_indicators = [
            "429", "resourceexhausted", "quota", "rate limit", 
            "rate_limit", "too many requests", "resource_exhausted"
        ]
        
        return any(indicator in error_msg for indicator in rate_limit_indicators) or \
               "ResourceExhausted" in error_type

    async def execute_with_retry(
        self, 
        func: Callable, 
        *args,
        tokens: float = 1.0,
        priority: int = 10,  # Default to low priority
        max_retries: Optional[int] = None,
        initial_backoff: Optional[float] = None,
        max_backoff: Optional[float] = None,
        **kwargs
    ) -> Any:
        """
        Execute with retry and priority
        """
        max_retries = max_retries or self.config.max_retries
        backoff = initial_backoff or self.config.initial_backoff
        max_backoff_time = max_backoff or self.config.max_backoff
        
        last_exception = None
        self.stats.total_calls += 1
        
        for attempt in range(max_retries + 1):
            try:
                # Acquire with priority
                await self.acquire(tokens, priority)
                
                # Small delay to spread requests
                if attempt > 0:
                    await asyncio.sleep(0.5)
                
                logger.info(f"🚀 Executing API call (P{priority}, attempt {attempt + 1})")
                result = await func(*args, **kwargs)
                
                self.stats.successful_calls += 1
                if self.last_429_time is not None:
                    await self._clear_cooldown()
                
                return result
                
            except Exception as e:
                last_exception = e
                error_msg = str(e)
                error_type = type(e).__name__
                
                if self._is_rate_limit_error(e):
                    # Smart cooldown handling
                    await self._mark_429_error(error_msg)
                    
                    if attempt < max_retries:
                        # If we have a smart cooldown, wait that instead of backoff
                        # But acquire() will enforce cooldown anyway. 
                        # We just sleep a bit to yield.
                        wait_time = max(backoff, 1.0)
                        logger.warning(
                            f"⚠️ Rate limit hit ({error_type}). "
                            f"Retrying in {wait_time:.1f}s (global cooldown active)..."
                        )
                        await asyncio.sleep(wait_time)
                        backoff = min(backoff * 2, max_backoff_time)
                        continue
                    else:
                        self.stats.failed_calls += 1
                        raise Exception(
                            f"API rate limit exceeded after {max_retries} retries. "
                            f"Provider: {self.provider.value}. "
                            f"Stats: {self.stats.rate_limit_hits} total 429 errors."
                        ) from e
                else:
                    self.stats.failed_calls += 1
                    logger.error(f"❌ API call failed: {error_type}: {error_msg}")
                    raise
        
        self.stats.failed_calls += 1
        raise last_exception

    def get_status(self) -> Dict[str, Any]:
        """Get status info"""
        return {
            "provider": self.provider.value,
            "queue_depth": len(self.waiters),
            "in_cooldown": self._is_in_cooldown(),
            "cooldown_remaining": self._get_cooldown_remaining(),
            "available_tokens": self.tokens
        }

# Global registry
_rate_limiters: Dict[str, RateLimiter] = {}

def get_rate_limiter(
    name: str = "default",
    provider: APIProvider = APIProvider.GEMINI_FREE,
    config: Optional[RateLimitConfig] = None
) -> RateLimiter:
    if name not in _rate_limiters:
        _rate_limiters[name] = RateLimiter(provider, config)
    return _rate_limiters[name]

def reset_rate_limiter(name: str = "default") -> None:
    if name in _rate_limiters:
        del _rate_limiters[name]

def reset_all_rate_limiters() -> None:
    _rate_limiters.clear()