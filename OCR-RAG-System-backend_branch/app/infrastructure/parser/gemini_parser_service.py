from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
import json, re ,os
from dotenv import load_dotenv
from app.infrastructure.parser.gemini_rate_limiter import get_rate_limiter


load_dotenv()


class GeminiParserService():

    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        # Single LLM for combined classification + extraction
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=api_key,

            temperature=0,
            max_tokens=None,
        )
        
        # Rate limiter for API calls
        self.rate_limiter = get_rate_limiter()
        
        # Legacy LLMs (for backward compatibility if needed)
        self.classifier_llm = self.llm
        self.extractor_llm = self.llm

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

             5. For RECEIPTS, include:
                - "vendor_name": The name of the store/merchant/vendor (REQUIRED)

             6. For BANK STATEMENTS, include:
                - "account_number": The bank account number (REQUIRED)
                - "transactions": A list of objects, where each object represents a transaction row and contains:
                    - "date": Transaction date (YYYY-MM-DD)
                    - "description": The FULL description text for the row (include all details)
                    - "debit": The debit/withdrawal amount (number). If missing, use 0.
                    - "credit": The credit/deposit amount (number). If missing, use 0.
             
             You may also include additional nested objects for detailed information:
             - customer_info, supplier_info, store_info (with nested fields like address, email, phone)
             - invoice_details, line_items, summary, totals, payment_info
             - transaction_info
             
             But the REQUIRED top-level fields (document_type, total_amount, date, and customer_name OR vendor_name OR account_number) MUST always be present at the root level.
             
             Example for Invoice:
             {{
               "document_type": "invoice",
               "customer_name": "John Doe",
               "vendor_name": "ABC Company Ltd",
               "total_amount": 1500.00,
               "date": "2025-11-22",
               "customer_info": {{ "email": "john@example.com", ... },
               "vendor_info": { "address": "123 Business St", "phone": "+1-555-1234", ... }},
               "invoice_details": {{ ... }}
             }}
             
             Example for Receipt:
             {{
               "document_type": "receipt",
               "vendor_name": "Starbucks",
               "total_amount": 45.50,
               "date": "2025-11-22",
               "store_info": {{ "address": "123 Main St", ... }},
               "items": [...]
             }}

             Example for Bank Statement:
             {{
               "document_type": "bank statement",
               "account_number": "1234567890",
               "total_amount": 0,
               "date": "2025-11-27",
               "transactions": [
                  {{ "date": "2025-11-01", "description": "Opening Balance", "debit": 0, "credit": 1000.00 }},
                  {{ "date": "2025-11-05", "description": "Payment to Vendor X", "debit": 500.00, "credit": 0 }}
               ]
             }}
             
             Output ONLY the JSON object, no additional text or formatting.
             """),
            ("human", "{context}")
        ])
        
        chain = prompt | self.llm
        
        # Execute with rate limiting and retry logic
        result = await self.rate_limiter.execute_with_retry(
            chain.ainvoke,
            {"context": text}
        )
        
        # Extract JSON from response
        parsed_json = self._extract_json(result.content)
        
        # Normalize document type
        if "document_type" in parsed_json:
            parsed_json["document_type"] = self._normalize_doc_type(parsed_json["document_type"])
        
        # Add image URL if provided
        if image_url:
            parsed_json["image_url"] = str(image_url)

        return parsed_json
    
    # ========== LEGACY METHODS (Deprecated, kept for backward compatibility) ==========
    
    async def classify_document_async(self, text: str) -> str:
        """
        [DEPRECATED] First LLM: Extract only document type (async version)
        
        This method is kept for backward compatibility but is no longer used.
        Use parse_async() instead for better efficiency.
        """
        prompt = ChatPromptTemplate.from_messages([
            ("system", "Classify the document into one of these categories: invoice, receipt, bank statement, bill, or other. Reply with ONLY the category name, nothing else."),
            ("human", "{context}")
        ])
        chain = prompt | self.classifier_llm
        
        # Use rate limiter
        result = await self.rate_limiter.execute_with_retry(
            chain.ainvoke,
            {"context": text}
        )
        
        return self._normalize_doc_type(result.content)
    
    async def extract_data_async(self, text: str, doc_type: str) -> dict:
        """
        [DEPRECATED] Second LLM: Extract all data including document type in JSON format (async version)
        
        This method is kept for backward compatibility but is no longer used.
        Use parse_async() instead for better efficiency.
        """
        prompt = ChatPromptTemplate.from_messages([
            ("system",
             """
             You are a data extraction assistant. Extract all relevant information from the provided document text.
             The document has been classified as: {doc_type}
             
             CRITICAL: You MUST return a JSON object with these REQUIRED top-level fields:
             
             1. "document_type": "{doc_type}"
             2. "total_amount": The final total amount (number, not string). Look for: total, grand total, amount due, balance due, etc.
             3. "date": The transaction/invoice/receipt date in YYYY-MM-DD format
             
             4. For INVOICES, include:
                - "customer_name": The name of the customer/client being invoiced (REQUIRED)
                - "vendor_name": The name of the company/business issuing the invoice (REQUIRED)

             5. For RECEIPTS, include:
                - "vendor_name": The name of the store/merchant/vendor (REQUIRED)

             6. For BANK STATEMENTS, include:
                - "account_number": The bank account number (REQUIRED)
                - "transactions": A list of objects, where each object represents a transaction row and contains:
                    - "date": Transaction date (YYYY-MM-DD)
                    - "description": The FULL description text for the row (include all details)
                    - "debit": The debit/withdrawal amount (number). If missing, use 0.
                    - "credit": The credit/deposit amount (number). If missing, use 0.
             
             You may also include additional nested objects for detailed information:
             - customer_info, supplier_info, store_info (with nested fields like address, email, phone)
             - invoice_details, line_items, summary, totals, payment_info
             - transaction_info
             
             But the 4 REQUIRED top-level fields (document_type, total_amount, date, and customer_name OR vendor_name OR account_number) MUST always be present at the root level.
             
             Example for Invoice:
             {{
               "document_type": "invoice",
               "customer_name": "John Doe",
               "vendor_name": "ABC Company Ltd",
               "total_amount": 1500.00,
               "date": "2025-11-22",
               "customer_info": {{ "email": "john@example.com", ... },
               "vendor_info": { "address": "123 Business St", "phone": "+1-555-1234", ... }},
               "invoice_details": {{ ... }}
             }}
             
             Example for Receipt:
             {{
               "document_type": "receipt",
               "vendor_name": "Starbucks",
               "total_amount": 45.50,
               "date": "2025-11-22",
               "store_info": {{ "address": "123 Main St", ... }},
               "items": [...]
             }}

             Example for Bank Statement:
             {{
               "document_type": "bank statement",
               "account_number": "1234567890",
               "total_amount": 0,
               "date": "2025-11-27",
               "transactions": [
                  {{ "date": "2025-11-01", "description": "Opening Balance", "debit": 0, "credit": 1000.00 }},
                  {{ "date": "2025-11-05", "description": "Payment to Vendor X", "debit": 500.00, "credit": 0 }}
               ]
             }}
             
             Output ONLY the JSON object, no additional text or formatting.
             """),
            ("human", "{context}")
        ])
        chain = prompt | self.extractor_llm
        
        # Use rate limiter
        result = await self.rate_limiter.execute_with_retry(
            chain.ainvoke,
            {"context": text, "doc_type": doc_type}
        )
        
        return self._extract_json(result.content)

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