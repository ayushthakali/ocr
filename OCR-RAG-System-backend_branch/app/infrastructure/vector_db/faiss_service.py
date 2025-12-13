"""
FAISS Vector Database Service
Manages document embeddings and similarity search using FAISS
"""
import faiss
import numpy as np
import json
import pickle
from pathlib import Path
from typing import List, Dict, Tuple, Optional
from datetime import datetime


class FAISSService:
    """Service for managing FAISS vector database"""
    
    def __init__(self, vector_db_path: str = "data/vector_db"):
        """
        Initialize FAISS service
        
        Args:
            vector_db_path: Path to store FAISS index and metadata
        """
        self.vector_db_path = Path(vector_db_path)
        self.vector_db_path.mkdir(parents=True, exist_ok=True)
        
        self.index_path = self.vector_db_path / "index.faiss"
        self.pkl_path = self.vector_db_path / "index.pkl"
        
        self.index: Optional[faiss.Index] = None
        self.metadata: Dict[int, Dict] = {}  # FAISS ID -> metadata
        self.id_mapping: Dict[str, int] = {}  # document_key -> FAISS ID
        self.reverse_mapping: Dict[int, str] = {}  # FAISS ID -> document_key
        self.embedding_dim: Optional[int] = None
        self.next_id = 0
        
        # Load existing index if available
        self.load()
    
    def initialize_index(self, embedding_dim: int):
        """
        Initialize a new FAISS index
        
        Args:
            embedding_dim: Dimension of embeddings
        """
        self.embedding_dim = embedding_dim
        # Use IndexFlatL2 for exact nearest neighbor search
        self.index = faiss.IndexFlatL2(embedding_dim)
        print(f"✅ Initialized FAISS index with dimension {embedding_dim}")
    
    def add_document(
        self,
        document_key: str,
        embedding: np.ndarray,
        metadata: Dict
    ) -> int:
        """
        Add a document to the vector database
        
        Args:
            document_key: Unique identifier for the document
            embedding: Document embedding vector
            metadata: Document metadata
            
        Returns:
            FAISS index ID
        """
        # Initialize index if not exists
        if self.index is None:
            self.initialize_index(len(embedding))
        
        # Check if document already exists
        if document_key in self.id_mapping:
            # Update existing document
            return self.update_document(document_key, embedding, metadata)
        
        # Reshape embedding for FAISS
        embedding_array = embedding.reshape(1, -1).astype('float32')
        
        # Add to FAISS index
        self.index.add(embedding_array)
        
        # Store metadata and mappings
        faiss_id = self.next_id
        self.metadata[faiss_id] = metadata
        self.id_mapping[document_key] = faiss_id
        self.reverse_mapping[faiss_id] = document_key
        
        self.next_id += 1
        
        # Save to disk
        self.save()
        
        return faiss_id
    
    def update_document(
        self,
        document_key: str,
        embedding: np.ndarray,
        metadata: Dict
    ) -> int:
        """
        Update an existing document
        
        Args:
            document_key: Document identifier
            embedding: New embedding
            metadata: New metadata
            
        Returns:
            FAISS index ID
        """
        if document_key not in self.id_mapping:
            raise ValueError(f"Document {document_key} not found")
        
        faiss_id = self.id_mapping[document_key]
        
        # FAISS doesn't support in-place updates, so we need to rebuild
        # For now, just update metadata (embedding update requires full rebuild)
        self.metadata[faiss_id] = metadata
        self.save()
        
        return faiss_id
    
    def delete_document(self, document_key: str):
        """
        Delete a document (marks as deleted in metadata)
        
        Args:
            document_key: Document identifier
        """
        if document_key not in self.id_mapping:
            return
        
        faiss_id = self.id_mapping[document_key]
        
        # Mark as deleted in metadata
        if faiss_id in self.metadata:
            self.metadata[faiss_id]['deleted'] = True
        
        self.save()
    
    def search(
        self,
        query_embedding: np.ndarray,
        top_k: int = 5,
        score_threshold: Optional[float] = None,
        user_id: Optional[str] = None,
        company_id: Optional[str] = None
    ) -> List[Tuple[str, float, Dict]]:
        """
        Search for similar documents with optional user and company filtering

        Args:
            query_embedding: Query embedding vector
            top_k: Number of results to return
            score_threshold: Optional score threshold (lower is better for L2)
            user_id: Optional user ID to filter results (for multi-tenant isolation)
            company_id: Optional company ID to filter results (for multi-tenant isolation)

        Returns:
            List of (document_key, score, metadata) tuples
        """
        if self.index is None or self.index.ntotal == 0:
            return []

        # Reshape query for FAISS
        query_array = query_embedding.reshape(1, -1).astype('float32')

        # Search with higher limit if filtering is enabled
        # (we need more results to account for filtering)
        search_limit = min(top_k * 3 if (user_id or company_id) else top_k, self.index.ntotal)
        distances, indices = self.index.search(query_array, search_limit)

        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx == -1:  # FAISS returns -1 for empty slots
                continue

            idx = int(idx)

            # Skip deleted documents
            if self.metadata.get(idx, {}).get('deleted', False):
                continue

            # Apply user filter if specified
            if user_id is not None:
                doc_user_id = self.metadata.get(idx, {}).get('user_id')
                if doc_user_id != user_id:
                    continue

            # Apply company filter if specified
            if company_id is not None:
                doc_company_id = self.metadata.get(idx, {}).get('company_id')
                if doc_company_id != company_id:
                    continue

            # Apply score threshold if specified
            if score_threshold is not None and dist > score_threshold:
                continue

            document_key = self.reverse_mapping.get(idx)
            if document_key:
                metadata = self.metadata.get(idx, {})
                results.append((document_key, float(dist), metadata))

            # Stop if we have enough results
            if len(results) >= top_k:
                break

        return results
    
    def search_all(
        self,
        query_embedding: np.ndarray,
        score_threshold: float = 100.0,
        user_id: Optional[str] = None,
        company_id: Optional[str] = None
    ) -> List[Tuple[str, float, Dict]]:
        """
        Search for all documents within a score threshold with optional user and company filtering

        Args:
            query_embedding: Query embedding vector
            score_threshold: Maximum distance threshold
            user_id: Optional user ID to filter results (for multi-tenant isolation)
            company_id: Optional company ID to filter results (for multi-tenant isolation)

        Returns:
            List of (document_key, score, metadata) tuples
        """
        if self.index is None or self.index.ntotal == 0:
            return []

        # Search with all documents
        return self.search(
            query_embedding,
            top_k=self.index.ntotal,
            score_threshold=score_threshold,
            user_id=user_id,
            company_id=company_id
        )
    
    def get_all_documents(self) -> List[Tuple[str, Dict]]:
        """
        Get all documents in the database
        
        Returns:
            List of (document_key, metadata) tuples
        """
        results = []
        for faiss_id, metadata in self.metadata.items():
            if metadata.get('deleted', False):
                continue
            
            document_key = self.reverse_mapping.get(faiss_id)
            if document_key:
                results.append((document_key, metadata))
        
        return results
    
    def save(self):
        """Save index and metadata to disk"""
        if self.index is not None:
            # Save FAISS index
            faiss.write_index(self.index, str(self.index_path))
        
        # Save metadata and mappings using pickle
        data_to_save = {
            'metadata': self.metadata,
            'id_mapping': self.id_mapping,
            'reverse_mapping': self.reverse_mapping,
            'next_id': self.next_id,
            'embedding_dim': self.embedding_dim
        }
        
        with open(self.pkl_path, 'wb') as f:
            pickle.dump(data_to_save, f)
    
    def load(self):
        """Load index and metadata from disk"""
        try:
            # Load FAISS index
            if self.index_path.exists():
                self.index = faiss.read_index(str(self.index_path))
                print(f"✅ Loaded FAISS index with {self.index.ntotal} documents")
            
            # Load metadata and mappings
            if self.pkl_path.exists():
                with open(self.pkl_path, 'rb') as f:
                    data = pickle.load(f)
                    self.metadata = data.get('metadata', {})
                    self.id_mapping = data.get('id_mapping', {})
                    self.reverse_mapping = data.get('reverse_mapping', {})
                    self.next_id = data.get('next_id', 0)
                    self.embedding_dim = data.get('embedding_dim')
        
        except Exception as e:
            print(f"⚠️ Error loading FAISS index: {e}")
            print("Starting with empty index")
    
    def get_stats(self) -> Dict:
        """Get database statistics"""
        return {
            'total_documents': self.index.ntotal if self.index else 0,
            'active_documents': len([m for m in self.metadata.values() if not m.get('deleted', False)]),
            'embedding_dimension': self.embedding_dim,
            'index_size_mb': self.index_path.stat().st_size / (1024 * 1024) if self.index_path.exists() else 0
        }


# Singleton instance
_faiss_service = None


def get_faiss_service() -> FAISSService:
    """Get or create the singleton FAISS service instance"""
    global _faiss_service
    if _faiss_service is None:
        _faiss_service = FAISSService()
    return _faiss_service
