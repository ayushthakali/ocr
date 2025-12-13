"""
Gemini API Rate Limiter
Implements optimized token bucket algorithm to respect API quota limits
"""
import asyncio
import time
from typing import Callable, Any, Optional
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)


@dataclass
class RateLimitStats:
    """Statistics for monitoring rate limiter performance"""
    tokens_acquired: int = 0
    tokens_waited: int = 0
    total_wait_time: float = 0.0
    rate_limit_hits: int = 0
    successful_calls: int = 0


class GeminiRateLimiter:
    """
    Optimized token bucket rate limiter for Gemini API calls
    
    Conservative settings for Gemini free tier:
    - 2 requests per minute (safer than 10/min to avoid quota issues)
    - Automatic cooldown after rate limit hits
    """
    
    def __init__(
        self, 
        max_tokens: int = 2,  # More conservative for free tier
        refill_rate: float = 2/60,  # 2 per minute = 0.0333/sec
        min_wait_interval: float = 0.1,
        cooldown_after_429: float = 30.0  # Wait 30s after hitting rate limit
    ):
        """
        Initialize rate limiter
        
        Args:
            max_tokens: Maximum number of tokens (requests) available
            refill_rate: Tokens added per second
            min_wait_interval: Minimum wait interval in seconds
            cooldown_after_429: Cooldown period after hitting rate limit
        """
        self.max_tokens = float(max_tokens)
        self.tokens = float(max_tokens)
        self.refill_rate = refill_rate
        self.last_refill = time.monotonic()
        self.lock = asyncio.Lock()
        self.queue_depth = 0
        self.min_wait_interval = min_wait_interval
        self.cooldown_after_429 = cooldown_after_429
        self.last_429_time = None
        self.stats = RateLimitStats()
        
        logger.info(
            f"🔧 Rate limiter initialized: {max_tokens} tokens, "
            f"{refill_rate:.4f} tokens/sec, ~{60/max_tokens:.1f}s between requests"
        )
    
    def _refill_tokens(self) -> None:
        """Refill tokens based on elapsed time (non-async for efficiency)"""
        now = time.monotonic()
        elapsed = now - self.last_refill
        
        if elapsed > 0:
            # Calculate tokens to add
            tokens_to_add = elapsed * self.refill_rate
            old_tokens = self.tokens
            self.tokens = min(self.max_tokens, self.tokens + tokens_to_add)
            self.last_refill = now
            
            if self.tokens > old_tokens:
                logger.debug(f"🔄 Refilled {tokens_to_add:.3f} tokens ({old_tokens:.2f} → {self.tokens:.2f})")
    
    def _is_in_cooldown(self) -> bool:
        """Check if we're in cooldown period after a 429 error"""
        if self.last_429_time is None:
            return False
        
        elapsed = time.monotonic() - self.last_429_time
        return elapsed < self.cooldown_after_429
    
    def _get_cooldown_remaining(self) -> float:
        """Get remaining cooldown time in seconds"""
        if not self._is_in_cooldown():
            return 0.0
        
        elapsed = time.monotonic() - self.last_429_time
        return self.cooldown_after_429 - elapsed
    
    async def acquire(self, tokens: float = 1.0) -> None:
        """
        Acquire token(s), waiting if necessary
        
        Args:
            tokens: Number of tokens to acquire (default 1.0)
        
        This method will block until sufficient tokens are available
        """
        if tokens > self.max_tokens:
            raise ValueError(f"Cannot acquire {tokens} tokens (max: {self.max_tokens})")
        
        wait_start = None
        
        async with self.lock:
            self.queue_depth += 1
            
            try:
                while True:
                    # Check cooldown first
                    if self._is_in_cooldown():
                        cooldown_remaining = self._get_cooldown_remaining()
                        logger.warning(
                            f"🧊 In cooldown period after rate limit. "
                            f"Waiting {cooldown_remaining:.1f}s more..."
                        )
                        self.lock.release()
                        try:
                            await asyncio.sleep(min(cooldown_remaining + 1, 5))
                        finally:
                            await self.lock.acquire()
                        continue
                    
                    self._refill_tokens()
                    
                    if self.tokens >= tokens:
                        self.tokens -= tokens
                        self.stats.tokens_acquired += 1
                        
                        if wait_start:
                            wait_duration = time.monotonic() - wait_start
                            self.stats.total_wait_time += wait_duration
                            self.stats.tokens_waited += 1
                        
                        logger.info(
                            f"✅ Acquired {tokens} token(s) "
                            f"(remaining: {self.tokens:.2f}, queue: {self.queue_depth - 1})"
                        )
                        return
                    
                    if wait_start is None:
                        wait_start = time.monotonic()
                    
                    # Calculate precise wait time for required tokens
                    tokens_needed = tokens - self.tokens
                    wait_time = tokens_needed / self.refill_rate
                    
                    # Use smaller intervals for better responsiveness
                    wait_time = max(self.min_wait_interval, min(wait_time, 2.0))
                    
                    logger.info(
                        f"⏳ Waiting {wait_time:.1f}s for {tokens_needed:.2f} tokens "
                        f"(current: {self.tokens:.2f}, queue: {self.queue_depth})"
                    )
                    
                    # Release lock while waiting to reduce contention
                    self.lock.release()
                    try:
                        await asyncio.sleep(wait_time)
                    finally:
                        await self.lock.acquire()
            finally:
                self.queue_depth -= 1
    
    async def try_acquire(self, tokens: float = 1.0) -> bool:
        """
        Try to acquire token(s) without waiting
        
        Args:
            tokens: Number of tokens to acquire
            
        Returns:
            True if tokens were acquired, False otherwise
        """
        async with self.lock:
            # Don't allow acquisition during cooldown
            if self._is_in_cooldown():
                logger.debug(f"❌ In cooldown period, cannot acquire tokens")
                return False
            
            self._refill_tokens()
            
            if self.tokens >= tokens:
                self.tokens -= tokens
                self.stats.tokens_acquired += 1
                logger.debug(f"✅ Acquired {tokens} token(s) immediately (remaining: {self.tokens:.2f})")
                return True
            
            logger.debug(f"❌ Insufficient tokens ({self.tokens:.2f} < {tokens})")
            return False
    
    async def _mark_429_error(self) -> None:
        """Mark that a 429 error occurred and enter cooldown"""
        async with self.lock:
            self.last_429_time = time.monotonic()
            self.stats.rate_limit_hits += 1
            # Reset tokens to 0 to prevent immediate retries
            self.tokens = 0
            logger.warning(
                f"🚨 Rate limit hit! Entering {self.cooldown_after_429}s cooldown. "
                f"Total 429 errors: {self.stats.rate_limit_hits}"
            )
    
    async def execute_with_retry(
        self, 
        func: Callable, 
        *args, 
        max_retries: int = 5,
        initial_backoff: float = 5.0,  # Increased from 2.0
        max_backoff: float = 120.0,  # Increased from 60.0
        tokens: float = 1.0,
        **kwargs
    ) -> Any:
        """
        Execute a function with rate limiting and exponential backoff retry
        
        Args:
            func: Async function to execute
            *args: Positional arguments for func
            max_retries: Maximum number of retry attempts
            initial_backoff: Initial backoff time in seconds
            max_backoff: Maximum backoff time in seconds
            tokens: Number of tokens to acquire per attempt
            **kwargs: Keyword arguments for func
            
        Returns:
            Result from func
            
        Raises:
            Exception: If all retries are exhausted
        """
        backoff = initial_backoff
        last_exception = None
        
        for attempt in range(max_retries + 1):
            try:
                # Acquire token(s) before making request
                await self.acquire(tokens)
                
                # Add a small delay after acquiring token to spread requests
                if attempt > 0:
                    await asyncio.sleep(1.0)
                
                # Execute the function
                logger.info(f"🚀 Executing API call (attempt {attempt + 1}/{max_retries + 1})")
                result = await func(*args, **kwargs)
                
                # Success! Mark it
                self.stats.successful_calls += 1
                
                # If we had a 429 error before but now succeeded, clear cooldown
                if self.last_429_time is not None:
                    async with self.lock:
                        logger.info("✅ API call succeeded, clearing cooldown")
                        self.last_429_time = None
                
                return result
                
            except Exception as e:
                last_exception = e
                error_msg = str(e)
                error_type = type(e).__name__
                
                # Check if it's a rate limit error
                is_rate_limit = (
                    "429" in error_msg or 
                    "ResourceExhausted" in error_type or
                    "quota" in error_msg.lower() or
                    "rate limit" in error_msg.lower() or
                    "RESOURCE_EXHAUSTED" in error_msg
                )
                
                if is_rate_limit:
                    await self._mark_429_error()
                    
                    if attempt < max_retries:
                        wait_time = backoff + self.cooldown_after_429
                        logger.warning(
                            f"⚠️ Rate limit hit ({error_type}), waiting {wait_time:.1f}s "
                            f"(attempt {attempt + 1}/{max_retries + 1})"
                        )
                        await asyncio.sleep(backoff)
                        backoff = min(backoff * 2, max_backoff)
                        continue
                    else:
                        logger.error(
                            f"❌ Max retries exceeded for rate limit error. "
                            f"Total 429 hits: {self.stats.rate_limit_hits}"
                        )
                        raise Exception(
                            f"Gemini API rate limit exceeded after {max_retries} retries. "
                            f"Free tier limits are very restrictive (2 RPM for some models). "
                            f"Consider: 1) Reducing request frequency, 2) Using paid tier, "
                            f"3) Batching requests. Total 429 errors: {self.stats.rate_limit_hits}"
                        ) from e
                else:
                    # Non-rate-limit error, raise immediately
                    logger.error(f"❌ API call failed with error: {error_msg}")
                    raise
        
        raise last_exception
    
    def get_stats(self) -> RateLimitStats:
        """Get rate limiter statistics"""
        return self.stats
    
    def reset_stats(self) -> None:
        """Reset statistics"""
        self.stats = RateLimitStats()
    
    async def get_available_tokens(self) -> float:
        """Get current number of available tokens"""
        async with self.lock:
            self._refill_tokens()
            return self.tokens
    
    def get_time_until_tokens(self, tokens: float = 1.0) -> float:
        """
        Calculate time until specified tokens will be available
        
        Args:
            tokens: Number of tokens needed
            
        Returns:
            Time in seconds (0 if tokens already available)
        """
        # Factor in cooldown
        if self._is_in_cooldown():
            cooldown = self._get_cooldown_remaining()
        else:
            cooldown = 0.0
        
        self._refill_tokens()
        
        if self.tokens >= tokens:
            return cooldown
        
        tokens_needed = tokens - self.tokens
        return cooldown + (tokens_needed / self.refill_rate)


# Singleton instance
_rate_limiter: Optional[GeminiRateLimiter] = None


def get_rate_limiter(
    max_tokens: int = 2,  # Conservative default
    refill_rate: float = 2/60
) -> GeminiRateLimiter:
    """
    Get or create the singleton rate limiter instance
    
    Args:
        max_tokens: Maximum tokens (only used on first call)
        refill_rate: Refill rate (only used on first call)
        
    Returns:
        GeminiRateLimiter instance
    """
    global _rate_limiter
    if _rate_limiter is None:
        _rate_limiter = GeminiRateLimiter(max_tokens, refill_rate)
    return _rate_limiter


def reset_rate_limiter() -> None:
    """Reset the singleton rate limiter (useful for testing)"""
    global _rate_limiter
    _rate_limiter = None