# import gspread
# from google.oauth2.service_account import Credentials as ServiceAccountCredentials
# from google.oauth2.credentials import Credentials as OAuthCredentials
# from datetime import datetime
# import os
# from requests.adapters import HTTPAdapter
# from urllib3.util.retry import Retry
# from typing import Optional, Dict, Any

# class GoogleSheetsService:
#     def __init__(self, credentials_file: str = "app/config/google_service_account.json", spreadsheet_id: str = "1aQsdIOl38P8Rr1uUSWAEtbBHrV-EAaja9KNkGL1fPT8", user_oauth_credentials: Optional[Dict[str, Any]] = None):
#         """
#         Initialize Google Sheets service.
        
#         Args:
#             credentials_file: Path to service account JSON (for system-wide sheet)
#             spreadsheet_id: ID of the spreadsheet to use
#             user_oauth_credentials: Dict with OAuth credentials (access_token, refresh_token, client_id, client_secret, token_uri)
#         """
#         self.spreadsheet_id = spreadsheet_id
        
#         # Define default scopes (used for service account only)
#         default_scopes = [
#             "https://www.googleapis.com/auth/spreadsheets",
#             "https://www.googleapis.com/auth/drive.file"
#         ]
        
#         # Authenticate with timeout and retry configuration
#         try:
#             # Use user OAuth credentials if provided, otherwise use service account
#             if user_oauth_credentials:
#                 # Create OAuth credentials with all necessary fields for token refresh
#                 import os
#                 # Use the scopes that were originally granted during OAuth flow
#                 # BUT filter to only include Sheets/Drive scopes (gspread doesn't need userinfo/openid)
#                 all_scopes = user_oauth_credentials.get('scopes', default_scopes)
#                 # Filter to only Sheets and Drive scopes
#                 user_scopes = [
#                     scope for scope in all_scopes 
#                     if 'spreadsheets' in scope or 'drive' in scope
#                 ]
#                 # If no valid scopes found, use defaults
#                 if not user_scopes:
#                     user_scopes = default_scopes
                    
#                 creds = OAuthCredentials(
#                     token=user_oauth_credentials.get('access_token'),
#                     refresh_token=user_oauth_credentials.get('refresh_token'),
#                     token_uri=user_oauth_credentials.get('token_uri') or os.getenv('GOOGLE_OAUTH_TOKEN_URI', 'https://oauth2.googleapis.com/token'),
#                     client_id=user_oauth_credentials.get('client_id') or os.getenv('GOOGLE_OAUTH_CLIENT_ID'),
#                     client_secret=user_oauth_credentials.get('client_secret') or os.getenv('GOOGLE_OAUTH_CLIENT_SECRET'),
#                     scopes=user_scopes  # Use filtered scopes for Sheets/Drive only
#                 )
#                 print(f"🔐 Using user OAuth credentials with filtered scopes: {user_scopes}")
#             else:
#                 creds = ServiceAccountCredentials.from_service_account_file(credentials_file, scopes=default_scopes)
#                 print(f"🔐 Using service account credentials")
            
#             # Configure retry strategy
#             retry_strategy = Retry(
#                 total=10,  # Total number of retries
#                 backoff_factor=1,  # Wait 1s, 2s, 4s between retries
#                 status_forcelist=[429, 500, 502, 503, 504],  # Retry on these HTTP status codes
#                 allowed_methods=["GET", "POST", "PUT"]  # Retry on these methods
#             )
            
#             # Create HTTP adapter with retry strategy
#             adapter = HTTPAdapter(max_retries=retry_strategy)
            
#             # Create gspread client
#             self.client = gspread.authorize(creds)
            
#             # Set timeout on the HTTP client (30 seconds)
#             if hasattr(self.client, 'http_client'):
#                 self.client.http_client.timeout = 30
                
#                 # Apply retry strategy to the HTTP client's session
#                 if hasattr(self.client.http_client, 'session'):
#                     self.client.http_client.session.mount("https://", adapter)
#                     self.client.http_client.session.mount("http://", adapter)
            
#             self.sheet = self.client.open_by_key(self.spreadsheet_id)
#             print(f"✅ Connected to Google Sheet: {self.sheet.title}")
#         except Exception as e:
#             print(f"❌ Failed to connect to Google Sheets: {e}")
#             self.sheet = None


#     def _get_or_create_worksheet(self, title):
#         """Get worksheet by title or create it if it doesn't exist (case-insensitive)"""
#         if not self.sheet:
#             return None
            
#         # Capitalize title for consistency (e.g. "other" -> "Other")
#         target_title = title.capitalize()
        
#         # 1. Try case-insensitive lookup first
#         try:
#             worksheets = self.sheet.worksheets()
#             for ws in worksheets:
#                 if ws.title.lower() == target_title.lower():
#                     return ws
#         except Exception as e:
#             print(f"⚠️ Error listing worksheets: {e}")
        
#         # 2. If not found, try to create it
#         try:
#             print(f"⚠️ Worksheet '{target_title}' not found. Creating it...")
#             worksheet = self.sheet.add_worksheet(title=target_title, rows=1000, cols=10)
#             worksheet.append_row(["Date", "Type", "Description", "Total Amount"])
#             print(f"✅ Created worksheet '{target_title}'")
#             return worksheet
#         except gspread.exceptions.APIError as e:
#             # Sheet already exists (race condition or casing issue)
#             if "already exists" in str(e).lower():
#                 print(f"ℹ️ Sheet '{target_title}' reported as existing. Retrying lookup...")
#                 try:
#                     # Force refresh and try case-insensitive lookup again
#                     self.sheet = self.client.open_by_key(self.spreadsheet_id)
#                     worksheets = self.sheet.worksheets()
#                     for ws in worksheets:
#                         if ws.title.lower() == target_title.lower():
#                             return ws
                    
#                     # If still not found but API says it exists, this is very strange.
#                     # Try exact match as last resort
#                     return self.sheet.worksheet(target_title)
#                 except Exception as retry_error:
#                     print(f"❌ Failed to fetch existing sheet '{target_title}': {retry_error}")
#                     return None
#             else:
#                 print(f"❌ Error creating worksheet '{target_title}': {e}")
#                 return None
#         except Exception as e:
#             if "timeout" in str(e).lower() or "timed out" in str(e).lower():
#                 print(f"❌ Timeout while creating worksheet '{title}'. Please check your internet connection.")
#             else:
#                 print(f"❌ Unexpected error with worksheet '{title}': {e}")
#             return None

#     def sync_document(self, doc_data: dict, user_category: str = None, auto_category: str = None, company_name: str = None):
#         """
#         Sync document data to Google Sheets based on type.
        
#         Args:
#             doc_data: Document data to sync
#             user_category: Manual category selection (deprecated, for backward compatibility)
#             auto_category: Auto-detected category from transaction categorizer
#             company_name: Name of the company for reference
        
#         Priority: auto_category > user_category > document_type
#         Invoice -> Sales
#         Receipt -> Purchase
#         Other -> Other
#         """
#         if not self.sheet:
#             print("❌ No active Google Sheet connection. Skipping sync.")
#             return

#         # Get the actual document type from parsed data (for Type column display)
#         actual_doc_type = doc_data.get("document_type", "other").lower()
        
#         # Debug logging
#         print(f"🔍 Document type detected: '{actual_doc_type}'")
        
#         # Determine target sheet based on priority
#         # Check for bank statement (handle variations: "bank statement", "bank_statement", "bankstatement")
#         is_bank_statement = "bank" in actual_doc_type and "statement" in actual_doc_type
        
#         if is_bank_statement:
#              # Extract account number for sheet naming
#              account_number = doc_data.get("account_number", "Unknown")
#              target_sheet_name = f"Bank Statement ({account_number})"
             
#              print(f"ℹ️ Document type is 'bank statement'. Account: {account_number}")
#              print(f"   Target sheet: '{target_sheet_name}'")
             
#              # Get or create worksheet
#              worksheet = self._get_or_create_worksheet(target_sheet_name)
#              if not worksheet:
#                  return

#              # Check if this is a new sheet (needs headers)
#              # A new sheet will be empty or only have default placeholder content
#              try:
#                  all_values = worksheet.get_all_values()
#                  is_new_sheet = len(all_values) == 0
                 
#                  # Check if existing sheet has wrong headers (old format)
#                  # Headers are in row 1 (index 0), but we need to check if there's an account number row first
#                  if not is_new_sheet and len(all_values) >= 1:
#                      # Find the header row - it could be row 1 or row 2 (if row 1 has account number)
#                      header_row_index = 0
#                      header_row = all_values[0] if len(all_values) > 0 else []
                     
#                      # If first row starts with "Account Number:", headers are in row 2
#                      if header_row and len(header_row) > 0 and 'Account Number' in str(header_row[0]):
#                          header_row_index = 1
#                          header_row = all_values[1] if len(all_values) > 1 else []
                     
#                      # Check if headers are wrong (Type, Total Amount, Document Key)
#                      has_wrong_headers = (
#                          len(header_row) >= 3 and 
#                          any('Type' in str(cell) for cell in header_row) and
#                          (any('Total Amount' in str(cell) for cell in header_row) 
#                         #   and any('Document Key' in str(cell) for cell in header_row))
#                      )
                     
#                      if has_wrong_headers:
#                          print(f"   ⚠️ Detected wrong headers in existing sheet. Fixing...")
#                          # Update the header row with correct headers
#                          row_num = header_row_index + 1  # Convert to 1-indexed
#                          worksheet.update(f'A{row_num}:D{row_num}', [["Date", "Description", "Debit", "Credit"]])
#                          print(f"   ✅ Fixed headers in row {row_num} to: Date, Description, Debit, Credit")
                         
#                          # Delete "Document Key" column if it exists (column E)
#                         #  try:
#                         #      if len(header_row) >= 5 and 'Document Key' in str(header_row[4]):
#                         #          worksheet.delete_columns(5)  # Delete column E (5th column)
#                         #          print(f"   ✅ Deleted 'Document Key' column")
#                         #  except Exception as e:
#                         #      print(f"   ⚠️ Could not delete Document Key column: {e}")
                         
#              except Exception as e:
#                  print(f"⚠️ Could not check sheet contents, assuming new sheet: {e}")
#                  is_new_sheet = True

#              # Extract transactions
#              transactions = doc_data.get("transactions", [])
             
#              # If no transactions found (maybe single row or error), try to construct one from top level
#              if not transactions:
#                  transactions = [{
#                      "date": doc_data.get("date"),
#                      "description": doc_data.get("description", "No description"),
#                      "debit": doc_data.get("debit", 0),
#                      "credit": doc_data.get("credit", 0)
#                  }]

#              # Prepare rows to append
#              rows_to_append = []
             
#              # Add headers ONLY for new sheets (first time this account is uploaded)
#              if is_new_sheet:
#                  rows_to_append.append([f"Account Number: {account_number}"])
#                  rows_to_append.append(["Date", "Description", "Debit", "Credit"])
#                  print(f"   📋 New sheet - adding headers")
#              else:
#                  print(f"   ➕ Existing sheet - appending transactions only")
             
#              # Add transaction rows
#              for tx in transactions:
#                  row = [
#                      tx.get("date", doc_data.get("date")),
#                      tx.get("description", ""),
#                      float(tx.get("debit", 0)), # Ensure numbers for sheets
#                      float(tx.get("credit", 0))
#                  ]
#                  rows_to_append.append(row)
             
#              try:
#                  if rows_to_append:
#                     worksheet.append_rows(rows_to_append)
#                     transaction_count = len(transactions)
#                     print(f"✅ Added {transaction_count} transaction(s) to '{target_sheet_name}' sheet.")
#              except Exception as e:
#                  if "timeout" in str(e).lower() or "timed out" in str(e).lower():
#                      print(f"❌ Timeout while syncing to Google Sheet. Data may not have been saved. Please check your internet connection.")
#                  else:
#                      print(f"❌ Error appending to Google Sheet: {e}")
             
#              return

#         if auto_category:
#             # Auto-detected category has highest priority
#             if auto_category.lower() == "purchase":
#                 target_sheet_name = "Purchase"
#             elif auto_category.lower() == "sale":
#                 target_sheet_name = "Sales"
#             else:
#                 target_sheet_name = "other"
            
#             print(f"ℹ️ Using auto-detected category: {auto_category} -> {target_sheet_name} sheet (Type: {actual_doc_type})")
#             if company_name:
#                 print(f"   Company: {company_name}")
#         elif user_category:
#             # Fall back to user-selected category
#             if user_category.lower() == "purchase":
#                 target_sheet_name = "Purchase"
#             elif user_category.lower() == "sale":
#                 target_sheet_name = "Sales"
#             else:
#                 target_sheet_name = "other"
            
#             print(f"ℹ️ Using user-selected category: {user_category} -> {target_sheet_name} sheet (Type: {actual_doc_type})")
#         else:
#             # Fall back to automatic detection based on document_type
#             if "invoice" in actual_doc_type:
#                 target_sheet_name = "Sales"
#             elif "receipt" in actual_doc_type:
#                 target_sheet_name = "Purchase"
#             else:
#                 target_sheet_name = "other"
            
#             print(f"ℹ️ Auto-detected document type: {actual_doc_type} -> {target_sheet_name} sheet")
        
#         # Determine description based on target sheet
#         if target_sheet_name == "Sales":
#             # Prioritize standardized customer_name field, then fall back to nested structures
#             description = (
#                 doc_data.get("customer_name") or  # NEW: Standardized field from parser
#                 (doc_data.get("customer_info", {}).get("name") if isinstance(doc_data.get("customer_info"), dict) else None) or
#                 (doc_data.get("bill_to", {}).get("name") if isinstance(doc_data.get("bill_to"), dict) else None) or
#                 doc_data.get("bill_to") or
#                 doc_data.get("client_name") or
#                 doc_data.get("description", "Unknown Customer")
#             )
#         elif target_sheet_name == "Purchase":
#             # Prioritize standardized vendor_name field, then fall back to nested structures
#             description = (
#                 doc_data.get("vendor_name") or  # NEW: Standardized field from parser
#                 doc_data.get("store_name") or
#                 doc_data.get("merchant_name") or
#                 (doc_data.get("store_info", {}).get("name") if isinstance(doc_data.get("store_info"), dict) else None) or
#                 (doc_data.get("supplier_info", {}).get("name") if isinstance(doc_data.get("supplier_info"), dict) else None) or
#                 (doc_data.get("vendor", {}).get("name") if isinstance(doc_data.get("vendor"), dict) else None) or
#                 doc_data.get("vendor") or
#                 doc_data.get("description", "Unknown Vendor")
#             )
#         else:
#             # For other types
#             description = (doc_data.get("description") or 
#                           doc_data.get("name") or 
#                           doc_data.get("title", "Unclassified Document"))

#         worksheet = self._get_or_create_worksheet(target_sheet_name)
#         if not worksheet:
#             return

#         # Extract total amount - prioritize standardized field, then check nested structures
#         total_amount = (
#             doc_data.get("total_amount") or  # NEW: Standardized field from parser (checked first)
#             # Check summary object (for invoices)
#             (doc_data.get("summary", {}).get("total_amount") if isinstance(doc_data.get("summary"), dict) else None) or
#             (doc_data.get("summary", {}).get("amount_due") if isinstance(doc_data.get("summary"), dict) else None) or
#             (doc_data.get("summary", {}).get("grand_total") if isinstance(doc_data.get("summary"), dict) else None) or
#             (doc_data.get("summary", {}).get("total") if isinstance(doc_data.get("summary"), dict) else None) or
#             # Check totals object (for receipts)
#             (doc_data.get("totals", {}).get("total_amount") if isinstance(doc_data.get("totals"), dict) else None) or
#             (doc_data.get("totals", {}).get("grand_total") if isinstance(doc_data.get("totals"), dict) else None) or
#             (doc_data.get("totals", {}).get("total") if isinstance(doc_data.get("totals"), dict) else None) or
#             # Check payment_info array
#             (doc_data.get("payment_info", [{}])[0].get("amount") if isinstance(doc_data.get("payment_info"), list) and len(doc_data.get("payment_info", [])) > 0 else None) or
#             # Check invoice_details
#             (doc_data.get("invoice_details", {}).get("total_amount") if isinstance(doc_data.get("invoice_details"), dict) else None) or
#             (doc_data.get("invoice_details", {}).get("grand_total") if isinstance(doc_data.get("invoice_details"), dict) else None) or
#             # Other top-level fallbacks
#             doc_data.get("amount_due") or
#             doc_data.get("grand_total") or
#             doc_data.get("total") or
#             doc_data.get("amount") or
#             "0.00"
#         )
        
#         # Extract date - prioritize created_at from Firebase (when uploaded), then document date
#         date = None
        
#         # Check if created_at exists (from Firebase - when document was uploaded)
#         if doc_data.get("created_at"):
#             try:
#                 # Parse Firebase created_at format: "22 November 2025 at 07:30:40 PM"
#                 from datetime import datetime as dt
#                 created_at_str = doc_data["created_at"]
#                 # Extract just the date part before "at"
#                 date_part = created_at_str.split(" at ")[0] if " at " in created_at_str else created_at_str
#                 # Parse the date
#                 parsed_date = dt.strptime(date_part, "%d %B %Y")
#                 date = parsed_date.strftime("%Y-%m-%d")
#             except Exception as e:
#                 print(f"⚠️ Could not parse created_at: {e}")
#                 date = None
        
#         # Fallback to document date if created_at parsing failed
#         if not date:
#             date = (
#                 doc_data.get("date") or  # Standardized field from parser
#                 (doc_data.get("transaction_info", {}).get("date") if isinstance(doc_data.get("transaction_info"), dict) else None) or
#                 (doc_data.get("invoice_details", {}).get("date") if isinstance(doc_data.get("invoice_details"), dict) else None) or
#                 (doc_data.get("invoice_details", {}).get("invoice_date") if isinstance(doc_data.get("invoice_details"), dict) else None) or
#                 doc_data.get("invoice_date") or
#                 datetime.now().strftime("%Y-%m-%d")
#             )
        
#         row = [
#             date,
#             actual_doc_type.capitalize(),
#             description,
#             str(total_amount),  # Convert to string to handle both int and float
#             doc_data.get("document_key", "")
#         ]
        
#         try:
#             worksheet.append_row(row)
#             print(f"✅ Synced {actual_doc_type} to '{target_sheet_name}' sheet.")
#         except Exception as e:
#             if "timeout" in str(e).lower() or "timed out" in str(e).lower():
#                 print(f"❌ Timeout while syncing to Google Sheet. Data may not have been saved. Please check your internet connection.")
#             else:
#                 print(f"❌ Error appending to Google Sheet: {e}")
    
#     async def sync_document_async(self, doc_data: dict, user_category: str = None, auto_category: str = None, company_name: str = None):
#         """
#         Sync document data to Google Sheets based on type (async version).
#         Runs Google Sheets API in thread pool to avoid blocking.
        
#         Args:
#             doc_data: Document data to sync
#             user_category: Manual category selection (deprecated)
#             auto_category: Auto-detected category from transaction categorizer
#             company_name: Name of the company for reference
#         """
#         import asyncio
#         loop = asyncio.get_event_loop()
#         await loop.run_in_executor(None, self.sync_document, doc_data, user_category, auto_category, company_name)


import gspread
from google.oauth2.service_account import Credentials as ServiceAccountCredentials
from google.oauth2.credentials import Credentials as OAuthCredentials
from datetime import datetime
import os
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from typing import Optional, Dict, Any


class GoogleSheetsService:
    def __init__(
        self,
        credentials_file: str = "app/config/google_service_account.json",
        spreadsheet_id: str = "1aQsdIOl38P8Rr1uUSWAEtbBHrV-EAaja9KNkGL1fPT8",
        user_oauth_credentials: Optional[Dict[str, Any]] = None,
    ):
        """
        Initialize Google Sheets service.

        Args:
            credentials_file: Path to service account JSON (for system-wide sheet)
            spreadsheet_id: ID of the spreadsheet to use
            user_oauth_credentials: Dict with OAuth credentials (access_token, refresh_token, client_id, client_secret, token_uri)
        """
        self.spreadsheet_id = spreadsheet_id

        # Define default scopes (used for service account only)
        default_scopes = [
            "https://www.googleapis.com/auth/spreadsheets",
            "https://www.googleapis.com/auth/drive.file",
        ]

        # Authenticate with timeout and retry configuration
        try:
            # Use user OAuth credentials if provided, otherwise use service account
            if user_oauth_credentials:
                # Create OAuth credentials with all necessary fields for token refresh
                import os

                # Use the scopes that were originally granted during OAuth flow
                # BUT filter to only include Sheets/Drive scopes (gspread doesn't need userinfo/openid)
                all_scopes = user_oauth_credentials.get("scopes", default_scopes)
                # Filter to only Sheets and Drive scopes
                user_scopes = [
                    scope
                    for scope in all_scopes
                    if "spreadsheets" in scope or "drive" in scope
                ]
                # If no valid scopes found, use defaults
                if not user_scopes:
                    user_scopes = default_scopes

                creds = OAuthCredentials(
                    token=user_oauth_credentials.get("access_token"),
                    refresh_token=user_oauth_credentials.get("refresh_token"),
                    token_uri=user_oauth_credentials.get("token_uri")
                    or os.getenv(
                        "GOOGLE_OAUTH_TOKEN_URI", "https://oauth2.googleapis.com/token"
                    ),
                    client_id=user_oauth_credentials.get("client_id")
                    or os.getenv("GOOGLE_OAUTH_CLIENT_ID"),
                    client_secret=user_oauth_credentials.get("client_secret")
                    or os.getenv("GOOGLE_OAUTH_CLIENT_SECRET"),
                    scopes=user_scopes,  # Use filtered scopes for Sheets/Drive only
                )
                print(
                    f"🔐 Using user OAuth credentials with filtered scopes: {user_scopes}"
                )
            else:
                creds = ServiceAccountCredentials.from_service_account_file(
                    credentials_file, scopes=default_scopes
                )
                print(f"🔐 Using service account credentials")

            # Configure retry strategy
            retry_strategy = Retry(
                total=10,  # Total number of retries
                backoff_factor=1,  # Wait 1s, 2s, 4s between retries
                status_forcelist=[
                    429,
                    500,
                    502,
                    503,
                    504,
                ],  # Retry on these HTTP status codes
                allowed_methods=["GET", "POST", "PUT"],  # Retry on these methods
            )

            # Create HTTP adapter with retry strategy
            adapter = HTTPAdapter(max_retries=retry_strategy)

            # Create gspread client
            self.client = gspread.authorize(creds)

            # Set timeout on the HTTP client (30 seconds)
            if hasattr(self.client, "http_client"):
                self.client.http_client.timeout = 30

                # Apply retry strategy to the HTTP client's session
                if hasattr(self.client.http_client, "session"):
                    self.client.http_client.session.mount("https://", adapter)
                    self.client.http_client.session.mount("http://", adapter)

            self.sheet = self.client.open_by_key(self.spreadsheet_id)
            print(f"✅ Connected to Google Sheet: {self.sheet.title}")
        except Exception as e:
            print(f"❌ Failed to connect to Google Sheets: {e}")
            self.sheet = None

    def _get_or_create_worksheet(self, title):
        """Get worksheet by title or create it if it doesn't exist (case-insensitive)"""
        if not self.sheet:
            return None

        # Capitalize title for consistency (e.g. "other" -> "Other")
        target_title = title.capitalize()

        # 1. Try case-insensitive lookup first
        try:
            worksheets = self.sheet.worksheets()
            for ws in worksheets:
                if ws.title.lower() == target_title.lower():
                    return ws
        except Exception as e:
            print(f"⚠️ Error listing worksheets: {e}")

        # 2. If not found, try to create it
        try:
            print(f"⚠️ Worksheet '{target_title}' not found. Creating it...")
            worksheet = self.sheet.add_worksheet(title=target_title, rows=1000, cols=10)
            worksheet.append_row(["Date", "Type", "Description", "Total Amount"])
            print(f"✅ Created worksheet '{target_title}'")
            return worksheet
        except gspread.exceptions.APIError as e:
            # Sheet already exists (race condition or casing issue)
            if "already exists" in str(e).lower():
                print(
                    f"ℹ️ Sheet '{target_title}' reported as existing. Retrying lookup..."
                )
                try:
                    # Force refresh and try case-insensitive lookup again
                    self.sheet = self.client.open_by_key(self.spreadsheet_id)
                    worksheets = self.sheet.worksheets()
                    for ws in worksheets:
                        if ws.title.lower() == target_title.lower():
                            return ws

                    # If still not found but API says it exists, this is very strange.
                    # Try exact match as last resort
                    return self.sheet.worksheet(target_title)
                except Exception as retry_error:
                    print(
                        f"❌ Failed to fetch existing sheet '{target_title}': {retry_error}"
                    )
                    return None
            else:
                print(f"❌ Error creating worksheet '{target_title}': {e}")
                return None
        except Exception as e:
            if "timeout" in str(e).lower() or "timed out" in str(e).lower():
                print(
                    f"❌ Timeout while creating worksheet '{title}'. Please check your internet connection."
                )
            else:
                print(f"❌ Unexpected error with worksheet '{title}': {e}")
            return None

    def sync_document(
        self,
        doc_data: dict,
        user_category: str = None,
        auto_category: str = None,
        company_name: str = None,
    ):
        """
        Sync document data to Google Sheets based on type.

        Args:
            doc_data: Document data to sync
            user_category: Manual category selection (deprecated, for backward compatibility)
            auto_category: Auto-detected category from transaction categorizer
            company_name: Name of the company for reference

        Priority: auto_category > user_category > document_type
        Invoice -> Sales
        Receipt -> Purchase
        Other -> Other
        """
        if not self.sheet:
            print("❌ No active Google Sheet connection. Skipping sync.")
            return

        # Get the actual document type from parsed data (for Type column display)
        actual_doc_type = doc_data.get("document_type", "other").lower()

        # Debug logging
        print(f"🔍 Document type detected: '{actual_doc_type}'")

        # Determine target sheet based on priority
        # Check for bank statement (handle variations: "bank statement", "bank_statement", "bankstatement")
        is_bank_statement = "bank" in actual_doc_type and "statement" in actual_doc_type

        if is_bank_statement:
            # Extract account number for sheet naming
            account_number = doc_data.get("account_number", "Unknown")
            target_sheet_name = f"Bank Statement ({account_number})"

            print(f"ℹ️ Document type is 'bank statement'. Account: {account_number}")
            print(f"   Target sheet: '{target_sheet_name}'")

            # Get or create worksheet
            worksheet = self._get_or_create_worksheet(target_sheet_name)
            if not worksheet:
                return

            # Check if this is a new sheet (needs headers)
            # A new sheet will be empty or only have default placeholder content
            try:
                all_values = worksheet.get_all_values()
                is_new_sheet = len(all_values) == 0

                # Check if existing sheet has wrong headers (old format)
                # Headers are in row 1 (index 0), but we need to check if there's an account number row first
                if not is_new_sheet and len(all_values) >= 1:
                    # Find the header row - it could be row 1 or row 2 (if row 1 has account number)
                    header_row_index = 0
                    header_row = all_values[0] if len(all_values) > 0 else []

                    # If first row starts with "Account Number:", headers are in row 2
                    if (
                        header_row
                        and len(header_row) > 0
                        and "Account Number" in str(header_row[0])
                    ):
                        header_row_index = 1
                        header_row = all_values[1] if len(all_values) > 1 else []

                    # Check if headers are wrong (Type, Total Amount, Document Key)
                    has_wrong_headers = (
                        len(header_row) >= 3
                        and any("Type" in str(cell) for cell in header_row)
                        and (
                            any("Total Amount" in str(cell) for cell in header_row)
                            # and any("Document Key" in str(cell) for cell in header_row)
                        )
                    )

                    if has_wrong_headers:
                        print(
                            f"   ⚠️ Detected wrong headers in existing sheet. Fixing..."
                        )
                        # Update the header row with correct headers
                        row_num = header_row_index + 1  # Convert to 1-indexed
                        worksheet.update(
                            f"A{row_num}:D{row_num}",
                            [["Date", "Description", "Debit", "Credit"]],
                        )
                        print(
                            f"✅ Fixed headers in row {row_num} to: Date, Description, Debit, Credit"
                        )

                        # Delete "Document Key" column if it exists (column E)
                        # try:
                        #     if len(header_row) >= 5 and "Document Key" in str(
                        #         header_row[4]
                        #     ):
                        #         worksheet.delete_columns(
                        #             5
                        #         )  # Delete column E (5th column)
                        #         print(f"   ✅ Deleted 'Document Key' column")
                        # except Exception as e:
                        #     print(f"   ⚠️ Could not delete Document Key column: {e}")

            except Exception as e:
                print(f"⚠️ Could not check sheet contents, assuming new sheet: {e}")
                is_new_sheet = True

            # Extract transactions
            transactions = doc_data.get("transactions", [])

            # If no transactions found (maybe single row or error), try to construct one from top level
            if not transactions:
                transactions = [
                    {
                        "date": doc_data.get("date"),
                        "description": doc_data.get("description", "No description"),
                        "debit": doc_data.get("debit", 0),
                        "credit": doc_data.get("credit", 0),
                    }
                ]

            # Prepare rows to append
            rows_to_append = []

            # Add headers ONLY for new sheets (first time this account is uploaded)
            if is_new_sheet:
                rows_to_append.append([f"Account Number: {account_number}"])
                rows_to_append.append(["Date", "Description", "Debit", "Credit"])
                print(f"   📋 New sheet - adding headers")
            else:
                print(f"   ➕ Existing sheet - appending transactions only")

            # Add transaction rows
            for tx in transactions:
                row = [
                    tx.get("date", doc_data.get("date")),
                    tx.get("description", ""),
                    float(tx.get("debit", 0)),  # Ensure numbers for sheets
                    float(tx.get("credit", 0)),
                ]
                rows_to_append.append(row)

            try:
                if rows_to_append:
                    worksheet.append_rows(rows_to_append)
                    transaction_count = len(transactions)
                    print(
                        f"✅ Added {transaction_count} transaction(s) to '{target_sheet_name}' sheet."
                    )
            except Exception as e:
                if "timeout" in str(e).lower() or "timed out" in str(e).lower():
                    print(
                        f"❌ Timeout while syncing to Google Sheet. Data may not have been saved. Please check your internet connection."
                    )
                else:
                    print(f"❌ Error appending to Google Sheet: {e}")

            return

        if auto_category:
            # Auto-detected category has highest priority
            if auto_category.lower() == "purchase":
                target_sheet_name = "Purchase"
            elif auto_category.lower() == "sale":
                target_sheet_name = "Sales"
            else:
                target_sheet_name = "other"

            print(
                f"ℹ️ Using auto-detected category: {auto_category} -> {target_sheet_name} sheet (Type: {actual_doc_type})"
            )
            if company_name:
                print(f"   Company: {company_name}")
        elif user_category:
            # Fall back to user-selected category
            if user_category.lower() == "purchase":
                target_sheet_name = "Purchase"
            elif user_category.lower() == "sale":
                target_sheet_name = "Sales"
            else:
                target_sheet_name = "other"

            print(
                f"ℹ️ Using user-selected category: {user_category} -> {target_sheet_name} sheet (Type: {actual_doc_type})"
            )
        else:
            # Fall back to automatic detection based on document_type
            if "invoice" in actual_doc_type:
                target_sheet_name = "Sales"
            elif "receipt" in actual_doc_type:
                target_sheet_name = "Purchase"
            else:
                target_sheet_name = "other"

            print(
                f"ℹ️ Auto-detected document type: {actual_doc_type} -> {target_sheet_name} sheet"
            )

        # Determine description based on target sheet
        if target_sheet_name == "Sales":
            # Prioritize standardized customer_name field, then fall back to nested structures
            description = (
                doc_data.get("customer_name")  # NEW: Standardized field from parser
                or (
                    doc_data.get("customer_info", {}).get("name")
                    if isinstance(doc_data.get("customer_info"), dict)
                    else None
                )
                or (
                    doc_data.get("bill_to", {}).get("name")
                    if isinstance(doc_data.get("bill_to"), dict)
                    else None
                )
                or doc_data.get("bill_to")
                or doc_data.get("client_name")
                or doc_data.get("description", "Unknown Customer")
            )
        elif target_sheet_name == "Purchase":
            # Prioritize standardized vendor_name field, then fall back to nested structures
            description = (
                doc_data.get("vendor_name")  # NEW: Standardized field from parser
                or doc_data.get("store_name")
                or doc_data.get("merchant_name")
                or (
                    doc_data.get("store_info", {}).get("name")
                    if isinstance(doc_data.get("store_info"), dict)
                    else None
                )
                or (
                    doc_data.get("supplier_info", {}).get("name")
                    if isinstance(doc_data.get("supplier_info"), dict)
                    else None
                )
                or (
                    doc_data.get("vendor", {}).get("name")
                    if isinstance(doc_data.get("vendor"), dict)
                    else None
                )
                or doc_data.get("vendor")
                or doc_data.get("description", "Unknown Vendor")
            )
        else:
            # For other types
            description = (
                doc_data.get("description")
                or doc_data.get("name")
                or doc_data.get("title", "Unclassified Document")
            )

        worksheet = self._get_or_create_worksheet(target_sheet_name)
        if not worksheet:
            return

        # Extract total amount - prioritize standardized field, then check nested structures
        total_amount = (
            doc_data.get(
                "total_amount"
            )  # NEW: Standardized field from parser (checked first)
            or
            # Check summary object (for invoices)
            (
                doc_data.get("summary", {}).get("total_amount")
                if isinstance(doc_data.get("summary"), dict)
                else None
            )
            or (
                doc_data.get("summary", {}).get("amount_due")
                if isinstance(doc_data.get("summary"), dict)
                else None
            )
            or (
                doc_data.get("summary", {}).get("grand_total")
                if isinstance(doc_data.get("summary"), dict)
                else None
            )
            or (
                doc_data.get("summary", {}).get("total")
                if isinstance(doc_data.get("summary"), dict)
                else None
            )
            or
            # Check totals object (for receipts)
            (
                doc_data.get("totals", {}).get("total_amount")
                if isinstance(doc_data.get("totals"), dict)
                else None
            )
            or (
                doc_data.get("totals", {}).get("grand_total")
                if isinstance(doc_data.get("totals"), dict)
                else None
            )
            or (
                doc_data.get("totals", {}).get("total")
                if isinstance(doc_data.get("totals"), dict)
                else None
            )
            or
            # Check payment_info array
            (
                doc_data.get("payment_info", [{}])[0].get("amount")
                if isinstance(doc_data.get("payment_info"), list)
                and len(doc_data.get("payment_info", [])) > 0
                else None
            )
            or
            # Check invoice_details
            (
                doc_data.get("invoice_details", {}).get("total_amount")
                if isinstance(doc_data.get("invoice_details"), dict)
                else None
            )
            or (
                doc_data.get("invoice_details", {}).get("grand_total")
                if isinstance(doc_data.get("invoice_details"), dict)
                else None
            )
            or
            # Other top-level fallbacks
            doc_data.get("amount_due")
            or doc_data.get("grand_total")
            or doc_data.get("total")
            or doc_data.get("amount")
            or "0.00"
        )

        # Extract date - prioritize created_at from Firebase (when uploaded), then document date
        date = None

        # Check if created_at exists (from Firebase - when document was uploaded)
        if doc_data.get("created_at"):
            try:
                # Parse Firebase created_at format: "22 November 2025 at 07:30:40 PM"
                from datetime import datetime as dt

                created_at_str = doc_data["created_at"]
                # Extract just the date part before "at"
                date_part = (
                    created_at_str.split(" at ")[0]
                    if " at " in created_at_str
                    else created_at_str
                )
                # Parse the date
                parsed_date = dt.strptime(date_part, "%d %B %Y")
                date = parsed_date.strftime("%Y-%m-%d")
            except Exception as e:
                print(f"⚠️ Could not parse created_at: {e}")
                date = None

        # Fallback to document date if created_at parsing failed
        if not date:
            date = (
                doc_data.get("date")  # Standardized field from parser
                or (
                    doc_data.get("transaction_info", {}).get("date")
                    if isinstance(doc_data.get("transaction_info"), dict)
                    else None
                )
                or (
                    doc_data.get("invoice_details", {}).get("date")
                    if isinstance(doc_data.get("invoice_details"), dict)
                    else None
                )
                or (
                    doc_data.get("invoice_details", {}).get("invoice_date")
                    if isinstance(doc_data.get("invoice_details"), dict)
                    else None
                )
                or doc_data.get("invoice_date")
                or datetime.now().strftime("%Y-%m-%d")
            )

        row = [
            date,
            actual_doc_type.capitalize(),
            description,
            str(total_amount),  # Convert to string to handle both int and float
            # doc_data.get("document_key", ""),
        ]

        try:
            worksheet.append_row(row)
            print(f"✅ Synced {actual_doc_type} to '{target_sheet_name}' sheet.")
        except Exception as e:
            if "timeout" in str(e).lower() or "timed out" in str(e).lower():
                print(
                    f"❌ Timeout while syncing to Google Sheet. Data may not have been saved. Please check your internet connection."
                )
            else:
                print(f"❌ Error appending to Google Sheet: {e}")

    async def sync_document_async(
        self,
        doc_data: dict,
        user_category: str = None,
        auto_category: str = None,
        company_name: str = None,
    ):
        """
        Sync document data to Google Sheets based on type (async version).
        Runs Google Sheets API in thread pool to avoid blocking.

        Args:
            doc_data: Document data to sync
            user_category: Manual category selection (deprecated)
            auto_category: Auto-detected category from transaction categorizer
            company_name: Name of the company for reference
        """
        import asyncio

        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            None,
            self.sync_document,
            doc_data,
            user_category,
            auto_category,
            company_name,
        )