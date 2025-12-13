"""
Embedding Service using LangChain HuggingFace Embeddings
Generates vector embeddings for text documents
"""
from langchain_huggingface import HuggingFaceEmbeddings
from typing import List
import numpy as np


class EmbeddingService:
    """Service for generating text embeddings using HuggingFace via LangChain"""
    
    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
        """
        Initialize the embedding service
        
        Args:
            model_name: Name of the HuggingFace model
                       Default: sentence-transformers/all-MiniLM-L6-v2 (384 dimensions, fast)
        """
        self.model_name = model_name
        self.embeddings = HuggingFaceEmbeddings(
            model_name=model_name,
            model_kwargs={'device': 'cpu'},
            encode_kwargs={'normalize_embeddings': True}
        )
        self.embedding_dim = 384  # all-MiniLM-L6-v2 dimension
        
    def generate_embedding(self, text: str) -> np.ndarray:
        """
        Generate embedding for a single text
        
        Args:
            text: Input text string
            
        Returns:
            numpy array of embeddings
        """
        if not text or not text.strip():
            # Return zero vector for empty text
            return np.zeros(self.embedding_dim)
            
        embedding = self.embeddings.embed_query(text)
        return np.array(embedding)
    
    def generate_embeddings_batch(self, texts: List[str]) -> np.ndarray:
        """
        Generate embeddings for multiple texts (batch processing)
        
        Args:
            texts: List of text strings
            
        Returns:
            numpy array of embeddings (shape: [num_texts, embedding_dim])
        """
        if not texts:
            return np.array([])
            
        # Filter out empty texts
        valid_texts = [t if t and t.strip() else "" for t in texts]
        
        # Use embed_documents for batch processing
        embeddings = self.embeddings.embed_documents(valid_texts)
        
        return np.array(embeddings)
    
    async def generate_embedding_async(self, text: str) -> np.ndarray:
        """
        Generate embedding for a single text (async version)
        
        Args:
            text: Input text string
            
        Returns:
            numpy array of embeddings
        """
        import asyncio
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self.generate_embedding, text)
    
    def get_embedding_dimension(self) -> int:
        """Get the dimension of the embeddings"""
        return self.embedding_dim


# Singleton instance
_embedding_service = None


def get_embedding_service() -> EmbeddingService:
    """Get or create the singleton embedding service instance"""
    global _embedding_service
    if _embedding_service is None:
        _embedding_service = EmbeddingService()
    return _embedding_service
