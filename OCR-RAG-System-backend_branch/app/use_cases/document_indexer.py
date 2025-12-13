"""
Document Indexing Service
Generates structured summaries and indexes documents in vector DB
"""
from typing import Dict, List
from app.infrastructure.embeddings.embedding_service import get_embedding_service
from app.infrastructure.vector_db.faiss_service import get_faiss_service


class DocumentIndexer:
    """Service for indexing documents in the vector database"""
    
    def __init__(self):
        """Initialize document indexer"""
        self.embedding_service = get_embedding_service()
        self.vector_db = get_faiss_service()
    
    def generate_structured_summary(self, parsed_data: Dict) -> str:
        """
        Generate structured summary from parsed OCR data
        
        Args:
            parsed_data: Parsed document data
            
        Returns:
            Structured summary string (JSON representation)
        """
        import json
        
        # Create a copy to avoid modifying the original
        data_to_embed = parsed_data.copy()
        
        # Remove non-semantic fields to save tokens
        if 'image_url' in data_to_embed:
            del data_to_embed['image_url']
        if 'document_key' in data_to_embed:
            del data_to_embed['document_key']
            
        # Convert to JSON string
        summary = json.dumps(data_to_embed, indent=2)
        
        return summary
    
    async def index_document_async(self, document_key: str, parsed_data: Dict) -> bool:
        """
        Index a document in the vector database (async version)

        Args:
            document_key: Unique document identifier
            parsed_data: Parsed document data

        Returns:
            True if successful, False otherwise
        """
        try:
            import asyncio

            # Validate that user_id is present (critical for data isolation)
            if 'user_id' not in parsed_data or not parsed_data['user_id']:
                raise ValueError(f"user_id is required for document indexing (document: {document_key})")

            # Validate that company_id is present (critical for multi-tenant isolation)
            if 'company_id' not in parsed_data or not parsed_data['company_id']:
                raise ValueError(f"company_id is required for document indexing (document: {document_key})")

            # Generate structured summary (full JSON)
            summary = self.generate_structured_summary(parsed_data)

            # Generate embedding asynchronously
            embedding = await self.embedding_service.generate_embedding_async(summary)

            # Prepare metadata - use full parsed data
            metadata = parsed_data.copy()

            # Add/Ensure system fields
            metadata['document_key'] = document_key
            metadata['text_summary'] = summary
            metadata['deleted'] = False

            if 'created_at' not in metadata:
                from datetime import datetime
                metadata['created_at'] = datetime.utcnow().isoformat()

            # Add to vector database (run in executor for file I/O)
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(
                None,
                self.vector_db.add_document,
                document_key,
                embedding,
                metadata
            )

            print(f"✅ Indexed document: {document_key} (user: {metadata['user_id']}, company: {metadata['company_id']})")
            return True

        except Exception as e:
            print(f"❌ Error indexing document {document_key}: {e}")
            return False
    
# Singleton instance
_document_indexer = None


def get_document_indexer() -> DocumentIndexer:
    """Get or create the singleton document indexer instance"""
    global _document_indexer
    if _document_indexer is None:
        _document_indexer = DocumentIndexer()
    return _document_indexer
