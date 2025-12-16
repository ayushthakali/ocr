from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
import json, re, os
from dotenv import load_dotenv
from app.infrastructure.parser.gemini_rate_limiter import get_rate_limiter, APIProvider
import asyncio


load_dotenv()


class GeminiParserService():

    def __init__(self, model_name: str = "llama-3.3-70b-versatile"):
        """
        Initialize Parser Service
        
        Args:
            model_name: Model to use (e.g., "gemini-2.0-flash-exp" or "llama-3.3-70b-versatile")
                        Defaults to Gemini 2.0 Flash as requested.
        """
        self.model_name = model_name
        
        # Determine provider based on model name
        if "llama" in model_name.lower() or "mixtral" in model_name.lower():
            # Use Groq
            api_key = os.getenv("GROQ_API_KEY")
            if not api_key:
                raise ValueError("GROQ_API_KEY not found")
                
            self.llm = ChatGroq(
                model=model_name,
                groq_api_key=api_key,
                temperature=0,
                max_tokens=None,
                timeout=120.0,
                max_retries=2,
            )
            self.rate_limiter = get_rate_limiter(provider=APIProvider.GROQ, name="groq_processing")
            print(f"✅ Parser initialized with Groq model: {model_name}")
            
        else:
            # Default to Gemini (Google)
            # Prioritize GEMINI_API_KEY, fallback to GOOGLE_API_KEY
            api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
            if not api_key:
                raise ValueError("GEMINI_API_KEY or GOOGLE_API_KEY not found")
                
            self.llm = ChatGoogleGenerativeAI(
                model=model_name,
                google_api_key=api_key,
                temperature=0,
                convert_system_message_to_human=True,
                max_retries=2,
            )
            self.rate_limiter = get_rate_limiter(provider=APIProvider.GEMINI_FREE, name="gemini_processing")
            print(f"✅ Parser initialized with Gemini model: {model_name}")

        # Legacy LLMs (for backward compatibility if needed)
        self.classifier_llm = self.llm
        self.extractor_llm = self.llm

        # API timeout setting
        self.api_timeout = 120.0  # 120 seconds max wait for API response

    def _normalize_doc_type(self, doc_type: str) -> str:
        """Normalize document type to standard categories"""
        doc_type = doc_type.strip().lower()
        if doc_type == "statement":
            return "bank statement"
        return doc_type
    
    async def parse_async(self, text: str, image_url: str = None) -> dict:
        """
        Parse document with SINGLE API call (optimized approach)
        
        This combines classification and extraction into one call,
        reducing API usage by 50%
        
        Args:
            text: OCR extracted text
            image_url: Optional image URL to include in result
            
        Returns:
            Parsed document data with document_type and extracted fields
        """
        # Create combined prompt that does BOTH classification and extraction
        prompt = ChatPromptTemplate.from_messages([
            ("system",
             """
             You are a document analysis assistant. Analyze the provided document text and extract all relevant information.
             
             STEP 1: Classify the document into one of these categories:
             - invoice
             - receipt
             - bank statement
             - bill
             - other
             
             STEP 2: Extract all relevant data based on the document type.
             
             You MUST return a JSON object with these REQUIRED top-level fields:
             
             1. "document_type": The classified category (invoice, receipt, bank statement, bill, or other)
             2. "total_amount": The final total amount (number, not string). Look for: total, grand total, amount due, balance due, etc.
             3. "date": The transaction/invoice/receipt date in YYYY-MM-DD format
             
             4. For INVOICES, include:
                - "customer_name": The name of the customer/client being invoiced (REQUIRED)
                - "vendor_name": The name of the company/business issuing the invoice (REQUIRED)
                - "line_items" or "items": A list of line items/products (HIGHLY RECOMMENDED). Each item should have:
                    - "description" or "item" or "name": Item description
                    - "quantity" or "qty": Quantity (number)
                    - "price" or "unit_price" or "rate": Unit price (number)
                    - "total" or "amount": Line total (number)

             5. For RECEIPTS, include:
                - "vendor_name": The name of the store/merchant/vendor (REQUIRED)
                - "items" or "line_items": A list of purchased items (HIGHLY RECOMMENDED). Each item should have:
                    - "description" or "item" or "name": Item description
                    - "quantity" or "qty": Quantity (number)
                    - "price" or "unit_price": Unit price (number)
                    - "total" or "amount": Line total (number)

             6. For BANK STATEMENTS, include:
                - "account_number": The bank account number (REQUIRED)
                - "transactions": A list of objects, where each object represents a transaction row and contains:
                    - "date": Transaction date (YYYY-MM-DD)
                    - "description": The FULL description text for the row (include all details)
                    - "debit": The debit/withdrawal amount (number). If missing, use 0.
                    - "credit": The credit/deposit amount (number). If missing, use 0.
             
             You may also include additional nested objects for detailed information:
             - customer_info, supplier_info, store_info (with nested fields like address, email, phone)
             - summary, totals, payment_info
             - transaction_info

             IMPORTANT: For invoices and receipts, ALWAYS extract line_items/items as a TOP-LEVEL array field, not nested inside other objects.

             But the REQUIRED top-level fields (document_type, total_amount, date, and customer_name OR vendor_name OR account_number) MUST always be present at the root level.
             
             Example for Invoice:
             {{{{
               "document_type": "invoice",
               "customer_name": "John Doe",
               "vendor_name": "ABC Company Ltd",
               "total_amount": 1500.00,
               "date": "2025-11-22",
               "line_items": [
                 {{"description": "Product A", "quantity": 2, "price": 500.00, "total": 1000.00}},
                 {{"description": "Product B", "quantity": 1, "price": 500.00, "total": 500.00}}
               ],
               "customer_info": {{"email": "john@example.com", ... }},
               "vendor_info": {{"address": "123 Business St", "phone": "+1-555-1234", ... }}
             }}}}
             
             Example for Receipt:
             {{{{
               "document_type": "receipt",
               "vendor_name": "Starbucks",
               "total_amount": 45.50,
               "date": "2025-11-22",
               "items": [
                 {{"description": "Latte", "quantity": 2, "price": 15.00, "total": 30.00}},
                 {{"description": "Muffin", "quantity": 1, "price": 15.50, "total": 15.50}}
               ],
               "store_info": {{"address": "123 Main St", ... }}
             }}}}

             Example for Bank Statement:
             {{{{
               "document_type": "bank statement",
               "account_number": "1234567890",
               "total_amount": 0,
               "date": "2025-11-27",
               "transactions": [
                  {{"date": "2025-11-01", "description": "Opening Balance", "debit": 0, "credit": 1000.00 }},
                  {{"date": "2025-11-05", "description": "Payment to Vendor X", "debit": 500.00, "credit": 0 }}
               ]
             }}}}
             
             Output ONLY the JSON object, no additional text or formatting.
             """),
            ("human", "{context}")
        ])
        
        chain = prompt | self.llm

        # Execute with rate limiting, retry logic, AND timeout
        try:
            print(f"⏱️ Calling {self.model_name} API with {self.api_timeout}s timeout...")
            result = await self.rate_limiter.execute_with_retry(
                chain.ainvoke,
                {"context": text},
                priority=10)

            print(f"✅ {self.model_name} API call completed successfully")
        except asyncio.TimeoutError:
            print(f"❌ {self.model_name} API call timed out after {self.api_timeout}s")
            raise Exception(
                f"{self.model_name} API call timed out after {self.api_timeout} seconds. "
                "The API may be slow or unresponsive. Please try again."
            )
        except Exception as e:
            print(f"❌ Groq API call failed: {type(e).__name__}: {str(e)}")
            raise

        # Extract JSON from response
        parsed_json = self._extract_json(result.content)
        
        # Normalize document type
        if "document_type" in parsed_json:
            parsed_json["document_type"] = self._normalize_doc_type(parsed_json["document_type"])
        
        # Add image URL if provided
        if image_url:
            parsed_json["image_url"] = str(image_url)

        return parsed_json
    

    def _extract_json(self, output: str) -> dict:
        """Extract JSON from LLM output"""
        # Try to find JSON object in the output
        match = re.search(r"\{.*\}", output, re.DOTALL)
        if not match:
            return {"error": "No JSON found", "raw": output}
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            return {"error": "Invalid JSON", "raw": match.group(0)}


            