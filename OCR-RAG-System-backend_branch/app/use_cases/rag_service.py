"""
RAG (Retrieval-Augmented Generation) Service
Combines vector search with Gemini LLM for intelligent Q&A
"""

from typing import List, Dict, Tuple, Optional

from langchain_groq import ChatGroq
from app.infrastructure.embeddings.embedding_service import get_embedding_service
from app.infrastructure.vector_db.faiss_service import get_faiss_service
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage
import os
import re
from app.infrastructure.parser.gemini_rate_limiter import get_rate_limiter, APIProvider
import logging

from dotenv import load_dotenv

logger = logging.getLogger(__name__)


class RAGService:
    """Service for Retrieval-Augmented Generation"""
    
    def __init__(self):
        """Initialize RAG service"""
        load_dotenv(override=True) # Force reload from .env
        self.embedding_service = get_embedding_service()
        self.vector_db = get_faiss_service()
        
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY not found in environment variables")

        # Initialize Groq (llama-3.3-70b-versatile)
        # llama-3.1-8b-instant
        self.llm = ChatGroq(
            model="llama-3.1-8b-instant",
            groq_api_key=api_key,
            temperature=0
        )
        
        # Initialize Rate Limiter (Separate from Parser)
        # We use a unique name 'groq_chat' to have a separate token bucket
        self.rate_limiter = get_rate_limiter(name="groq_chat", provider=APIProvider.GROQ)
    
    def analyze_query_type(self, query: str) -> Tuple[str, bool]:
        """
        Analyze query to determine if it's an aggregation query
        
        Args:
            query: User query
            
        Returns:
            Tuple of (query_type, is_aggregation)
        """
        query_lower = query.lower()
        
        # Keywords that indicate aggregation or broad summary queries
        aggregation_keywords = [
            'total', 'all', 'sum', 'calculate', 'how much',
            'how many', 'count', 'average', 'mean',
            'summary', 'each', 'list', 'describe all'
        ]
        
        is_aggregation = any(keyword in query_lower for keyword in aggregation_keywords)
        
        query_type = "aggregation" if is_aggregation else "specific"
        
        return query_type, is_aggregation
    
    def retrieve_context(
        self,
        query: str,
        user_id: str,
        company_id: str,
        is_aggregation: bool = False,
        top_k: int = 100
    ) -> List[Tuple[str, float, Dict]]:
        """
        Retrieve relevant documents from vector database for a specific user and company

        Args:
            query: User query
            user_id: User ID to filter documents (ensures data isolation)
            company_id: Company ID to filter documents (ensures multi-tenant isolation)
            is_aggregation: Whether this is an aggregation query
            top_k: Number of documents to retrieve (for specific queries)

        Returns:
            List of (document_key, score, metadata) tuples
        """
        # Check for "all documents" intent explicitly
        query_lower = query.lower()
        all_docs_keywords = ['all', 'each', 'every', 'summary of documents', 'list documents']
        want_all_docs = any(k in query_lower for k in all_docs_keywords)

        if want_all_docs and is_aggregation:
            # Retrieve ALL documents directly, bypassing vector search
            all_docs = self.vector_db.get_all_documents()
            # Filter by user_id AND company_id
            user_docs = [
                (key, meta) for key, meta in all_docs
                if meta.get('user_id') == user_id and meta.get('company_id') == company_id
            ]
            # Format as (key, score, metadata) with dummy score
            results = [(key, 1.0, meta) for key, meta in user_docs]
            # Sort by date if possible, or just return all
            return results

        # Generate query embedding
        query_embedding = self.embedding_service.generate_embedding(query)

        if is_aggregation:
            # For aggregation/summary queries, retrieve a larger set of documents
            # We use a high top_k to approximate "all" relevant docs
            results = self.vector_db.search(
                query_embedding,
                top_k=100,  # Increased limit for "all documents" queries
                user_id=user_id,  # Filter by user
                company_id=company_id  # Filter by company
            )
        else:
            # For specific queries, retrieve top-k
            results = self.vector_db.search(
                query_embedding,
                top_k=top_k,
                user_id=user_id,  # Filter by user
                company_id=company_id  # Filter by company
            )

        return results
    
    def build_context_string(self, documents: List[Tuple[str, float, Dict]]) -> str:
        """
        Build context string from retrieved documents
        
        Args:
            documents: List of (document_key, score, metadata) tuples
            
        Returns:
            Formatted context string
        """
        if not documents:
            return "No relevant documents found in the knowledge base."
        
        context_parts = []
        
        for i, (doc_key, score, metadata) in enumerate(documents, 1):
            # Create a clean copy of metadata for context
            context_data = metadata.copy()
            
            # Remove internal/large fields that might confuse the LLM or waste tokens
            if 'text_summary' in context_data:
                del context_data['text_summary']
            if 'embedding' in context_data:
                del context_data['embedding']
            
            # Convert to a readable string format (YAML-like is often good for LLMs)
            import json
            doc_str = f"Document {i} (ID: {doc_key}):\n{json.dumps(context_data, indent=2)}"
            context_parts.append(doc_str)
        
        return "\n\n".join(context_parts)
    
    def build_prompt(self, query: str, context: str, is_aggregation: bool) -> List:
        """
        Build prompt for Gemini
        
        Args:
            query: User query
            context: Retrieved context
            is_aggregation: Whether this is an aggregation query
            
        Returns:
            List of messages for Gemini
        """
        # Unified system prompt for natural, comprehensive responses
        system_prompt = """You are an expert financial assistant specializing in document analysis. You help users understand their financial records including receipts, invoices, bank statements, bills, tax documents, and other financial data.

## Your Core Responsibilities

**GROUND EVERY ANSWER IN THE PROVIDED DOCUMENTS**
- Base all responses strictly on the context provided to you
- Never fabricate, infer, or assume information not explicitly present
- If something isn't in the documents, say so clearly and confidently
- When uncertain, acknowledge it rather than guessing

**CITE SOURCES PRECISELY**
- Always reference specific document IDs when making statements
- Use format: "According to **Document [ID]**..." or "**Document [ID]** shows..."
- For aggregations, list all contributing documents
- Make it effortless for users to verify your answers

**ENSURE NUMERICAL ACCURACY**
- Copy all numbers, dates, amounts, and codes exactly as they appear
- Show your work for calculations: "($450.00 + $397.83 + $400.00 = $1,247.83)"
- Double-check arithmetic before providing totals
- Preserve formatting (e.g., "$1,234.56" not "1234.56 dollars")
- Flag any discrepancies or unusual patterns you notice

## How to Handle Different Questions

**Direct Lookups**: "What did I spend at [vendor]?"
→ Find the exact transaction, cite the document, provide the amount and date

**Aggregations**: "What's my total spending?"
→ List each relevant document with its amount, then show the calculation clearly

**Comparisons**: "Which month had higher expenses?"
→ Break down by period, cite documents for each, compare with clear reasoning

**Summaries**: "List all my invoices"
→ Include every single matching document with key details (vendor, amount, date)
→ Never skip documents - if asked for "all", provide ALL

**Pattern Analysis**: "Do I have duplicate charges?"
→ Identify patterns proactively, cite specific documents, explain what you found

**Missing Information**: "What's my account balance?"
→ If not in documents: "Your account balance is not available in the provided documents."
→ Don't apologize excessively - just state the fact

## Response Quality Standards

**Clarity**
- Write naturally as a knowledgeable financial advisor would
- Use clear paragraphs, not walls of text
- Bold document IDs like **Document INV042** for scannability
- Use bullet points (- ) for lists when appropriate
- Add line breaks between distinct sections or document groups

**Completeness**
- Answer the question fully - don't leave users wondering
- Provide relevant context that helps understanding
- When listing documents, include: ID, vendor/source, amount, date at minimum
- For complex queries, structure your answer logically (overview → details → summary)

**Intelligence**
- Notice and mention anomalies: duplicate payments, unusual amounts, missing data
- Provide useful insights: "I notice 3 large payments to the same vendor..."
- Think step-by-step for complex calculations or multi-part questions
- Anticipate follow-up questions and address them proactively when natural

**Professionalism**
- Treat all financial data as sensitive and confidential
- Use precise financial terminology when appropriate
- Maintain a helpful, trustworthy tone
- Be confident in your answers when the data supports them

## Special Cases

**Ambiguous Questions**: Ask for clarification
- "I see several transactions that could match. Are you asking about [A] or [B]?"

**Conflicting Data**: Point it out explicitly
- "**Document STM013** shows $450, but **Document RCP008** shows $455 for the same transaction."

**Incomplete Documents**: Work with what you have
- "**Document INV042** contains the amount ($350) but no date is listed in this document."

**Multiple Interpretations**: Provide both, then ask
- "This could mean [interpretation A] or [interpretation B]. Which would be most helpful?"

## Critical: Handling Duplicates

**NEVER simply list document summaries back to the user**
- If asked "what documents do I have" or "list all documents", DON'T just repeat the summaries
- Instead, provide an ANALYTICAL response that adds value

**Identify and consolidate duplicates intelligently**
- If multiple documents have identical or near-identical content, group them together
- Format: "You have a receipt from Test Store for $123.45 on 2023-10-27 (appears in **Document [ID1]** and **Document [ID2]** - likely duplicates)"
- Always flag duplicates explicitly: "Note: These appear to be duplicate records of the same transaction"

**For listing requests, provide organized summaries**
- Group by type: "You have 5 bank statements, 3 receipts, and 2 invoices"
- Then provide details by category with unique transactions only
- Merge duplicates and note them: "Test Store receipt $123.45 (2023-10-27) - duplicated in 2 documents"

**Example of GOOD response**:
"You have 10 documents in total:

**Bank Statements (4 unique, 1 duplicate)**
- FIRST BANK OF WIKI statement for John Jones (Oct-Nov 2003) - appears in **STM010** and **STM011** (duplicate)
- CITIZENS BANK statement for John Smith with $591,800 closing balance - **STM012**
- Statement with opening balance of $280,692.25 - **STM013**
- First Secure Bank statement for Jane Doe (July 2023) - **STM014**

**Receipts (2 unique, 1 duplicate)**
- Test Store receipt for $123.45 (2023-10-27) - appears in **test_doc_verification_20251121215018** and **test_doc_verification_20251121215422** (duplicate)
- Pan Dorothy receipt for KRW 4,500 (2016-08-08) - appears in **RCT008** and **RCT009** (duplicate)

**Invoices (1)**
- Invoice to Sacha Dubois for $300.00 dated Jan 2030 - **INV006**"

## Output Format Guidelines

Standard answer structure:
1. Direct answer to the question (1-2 sentences)
2. Supporting details with document citations
3. Calculation or reasoning if applicable
4. Additional insights if relevant (keep brief)

For individual transactions:
**Document [ID]**: [Vendor/Source] - $[Amount] ([Date])

For calculations:
Total: $[Result]
= **Document [ID1]** ($[Amount1])
+ **Document [ID2]** ($[Amount2])
+ **Document [ID3]** ($[Amount3])

## What Makes You Excellent

- **Trustworthy**: Users can verify every claim by checking your cited sources
- **Accurate**: Your numerical data and calculations are always precise
- **Thorough**: You don't miss documents or overlook important details
- **Insightful**: You notice patterns and provide valuable context
- **Clear**: Your answers are well-organized and easy to understand
- **Honest**: You acknowledge limitations and don't pretend to know what you don't

Remember: You are the user's trusted financial analyst. Your accuracy and reliability are paramount. When in doubt, be transparent about uncertainty rather than making unfounded claims."""
        
        user_prompt = f"""Context from knowledge base:
{context}

User Question: {query}

Answer:"""
        
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt)
        ]
        
        return messages
    
    def generate_response(self, messages: List) -> str:
        """
        Generate response using Gemini
        
        Args:
            messages: List of messages
            
        Returns:
            Generated response
        """
        try:
            response = self.llm.invoke(messages)
            return response.content
        except Exception as e:
            return f"Error generating response: {str(e)}"
    
    async def generate_response_async(self, messages: List) -> str:
        """
        Generate response using Gemini (async version) - High Priority
        """
        try:
            # Use High Priority (0) 
            response = await self.rate_limiter.execute_with_retry(
                self.llm.ainvoke,
                messages,
                priority=0
            )
            return response.content
        except Exception as e:
            return f"Error generating response: {str(e)}"
    
    def chat(self, query: str, user_id: str, company_id: str) -> Dict:
        """
        Main entry point for RAG chat with user and company-specific data isolation

        Args:
            query: User query
            user_id: User ID for filtering documents (ensures data isolation)
            company_id: Company ID for filtering documents (ensures multi-tenant isolation)

        Returns:
            Dictionary with response and metadata
        """
        # Analyze query type
        query_type, is_aggregation = self.analyze_query_type(query)

        # Determine top_k based on query type
        # If it's an aggregation/summary query, we want many more docs
        k = 100 if is_aggregation else 5

        # Retrieve relevant documents (filtered by user_id AND company_id)
        documents = self.retrieve_context(
            query,
            user_id=user_id,
            company_id=company_id,
            is_aggregation=is_aggregation,
            top_k=k
        )

        # Build context
        context = self.build_context_string(documents)

        # Build prompt
        messages = self.build_prompt(query, context, is_aggregation)

        # Generate response
        response = self.generate_response(messages)

        # Return result
        return {
            "response": response,
            "query_type": query_type,
            "documents_retrieved": len(documents),
            "sources": [
                {
                    "document_key": doc_key,
                    "store_name": metadata.get('store_name', 'Unknown'),
                    "date": metadata.get('date', 'Unknown'),
                    "total_amount": metadata.get('total_amount', '0.00')
                }
                for doc_key, score, metadata in documents  # Return all retrieved sources
            ]
        }
    
    async def chat_async(self, query: str, user_id: str, company_id: str) -> Dict:
        """
        Main entry point for RAG chat (async version) with user and company-specific data isolation

        Args:
            query: User query
            user_id: User ID for filtering documents (ensures data isolation)
            company_id: Company ID for filtering documents (ensures multi-tenant isolation)

        Returns:
            Dictionary with response and metadata
        """
        # Analyze query type
        query_type, is_aggregation = self.analyze_query_type(query)

        # Determine top_k based on query type
        # If it's an aggregation/summary query, we want many more docs
        k = 100 if is_aggregation else 5

        # Retrieve relevant documents (filtered by user_id AND company_id)
        documents = self.retrieve_context(
            query,
            user_id=user_id,
            company_id=company_id,
            is_aggregation=is_aggregation,
            top_k=k
        )

        # Build context
        context = self.build_context_string(documents)

        # Build prompt
        messages = self.build_prompt(query, context, is_aggregation)

        # Generate response asynchronously
        response = await self.generate_response_async(messages)

        # Return result
        return {
            "response": response,
            "query_type": query_type,
            "documents_retrieved": len(documents),
            "sources": [
                {
                    "document_key": doc_key,
                    "store_name": metadata.get('store_name', 'Unknown'),
                    "date": metadata.get('date', 'Unknown'),
                    "total_amount": metadata.get('total_amount', '0.00')
                }
                for doc_key, score, metadata in documents  # Return all retrieved sources
            ]
        }


# Singleton instance
_rag_service = None


def get_rag_service() -> RAGService:
    """Get or create the singleton RAG service instance"""
    global _rag_service
    if _rag_service is None:
        _rag_service = RAGService()
    return _rag_service
