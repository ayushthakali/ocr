from fastapi import APIRouter, UploadFile, BackgroundTasks, HTTPException, Form
from app.infrastructure.firebase.firebase_service import FirebaseService
from app.use_cases.document_processor import DocumentProcessor
from app.infrastructure.ocr.tesseract_service import OCRService
from app.infrastructure.parser.gemini_parser_service import GeminiParserService
from pathlib import Path
import os
from datetime import datetime
from firebase_admin import db
from app.use_cases.document_indexer import get_document_indexer
from app.infrastructure.sheets.google_sheets_service import GoogleSheetsService
from app.infrastructure.sheets.transaction_categorizer import TransactionCategorizer
import asyncio
from app.presentation.auth_middleware import get_current_user
from fastapi import Depends

router = APIRouter()

# Initialize services
firebase_service = FirebaseService()
ocr_service = OCRService()
parser_service = GeminiParserService()
processor = DocumentProcessor(ocr_service, parser_service)
document_indexer = get_document_indexer()
sheets_service = GoogleSheetsService()
categorizer = TransactionCategorizer()

# Create media/uploads folder if it doesn't exist
upload_folder = Path("media/uploads")
upload_folder.mkdir(parents=True, exist_ok=True)

@router.post("/process-image")
async def process_image(
    file: UploadFile,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)  
):
    """
    Process uploaded image with user-specific data isolation

    Args:
        file: Uploaded image file
        background_tasks: FastAPI background tasks
        current_user: Authenticated user from Firebase Auth
    """

   

    user_id = current_user["userId"]
    company_name = current_user["companyName"]
    company_id = current_user["activeCompany"]
    print(f"ℹ️ [TEST MODE] Processing document for user: {user_id}, company: {company_name} (ID: {company_id})")

    # 1. Save uploaded file (image or PDF) in media/uploads
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S%f")
    ext = os.path.splitext(file.filename)[-1] or ".png"

    # Determine file type and set appropriate filename
    if ext.lower() == '.pdf':
        filename = f"Document_{timestamp}{ext}"
    else:
        filename = f"Receipt_{timestamp}{ext}"

    image_path = upload_folder / filename

    with open(image_path, "wb") as f:
        f.write(await file.read())

    # Construct accessible URL
    image_url = f"http://127.0.0.1:8000/media/uploads/{filename}".strip('"')

    # 2. Process file asynchronously (OCR + parsing + key generation + Firebase save)
    # Works for both images and PDFs
    try:
        saved_result = await processor.process_image_async(
            image_path=str(image_path),
            user_id=user_id,
            company_id=company_id,
            image_url=image_url
        )
    except ValueError as e:
        # Handle validation errors (e.g., empty OCR text, missing Poppler)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Handle other processing errors
        print(f"❌ Error processing document: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process document: {str(e)}")
    document_key = saved_result["document_key"]
    full_data = saved_result.get("full_data", {})
    
    # 3. Categorize transaction if company is provided
    categorization_result = None
    auto_category = None
    
    if company_name:
        categorization_result = categorizer.categorize_transaction(full_data, company_name)
        auto_category = categorization_result.get("category")
        
        print(f"📊 Categorization Result:")
        print(f"   Category: {auto_category}")
        print(f"   Confidence: {categorization_result.get('confidence', 0):.2%}")
        print(f"   Reason: {categorization_result.get('reason')}")
    
    # 4. Index document in vector database (background task)
    def index_task():
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            # Get full_data from saved_result and add metadata
            full_data_copy = full_data.copy()
            full_data_copy["image_url"] = image_url
            full_data_copy["document_key"] = document_key
            full_data_copy["user_id"] = user_id  # Add user_id for filtering
            full_data_copy["company_id"] = company_id  # Add company_id for multi-tenant isolation
            loop.run_until_complete(
                document_indexer.index_document_async(document_key, full_data_copy)
            )
        finally:
            loop.close()

    background_tasks.add_task(index_task)

    # 5. Sync to Google Sheets (background task)
    def sync_to_sheets(auto_cat: str, comp_name: str, uid: str):
        try:
            # Get credentials from Firebase
            from app.infrastructure.oauth.oauth_service import GoogleOAuthService
            import os
            
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                # Fetch tokens from Firebase for this user + company
                tokens = loop.run_until_complete(
                    firebase_service.get_google_tokens_async(uid, company_id)
                )

                if not tokens:
                    print(f"ℹ️ User {uid} hasn't connected Google Sheets for company {company_id}. Skipping sync.")
                    return
                
                # Decrypt tokens
                oauth_service = GoogleOAuthService()
                access_token = oauth_service.decrypt_token(tokens.get("access_token"))
                refresh_token = oauth_service.decrypt_token(tokens.get("refresh_token"))
                
                if not access_token:
                    print(f"❌ Failed to decrypt access token for user {uid}")
                    return
                
                # Fetch from Firebase user and company-specific path
                doc_ref = db.reference(f"users/{uid}/companies/{company_id}/documents/{document_key}")
                firebase_data = doc_ref.get()
                
                if firebase_data:
                    # With async save, data is stored directly (not in nested full_data)
                    sheets_data = firebase_data.copy()
                    
                    # Ensure document_key is present
                    if "document_key" not in sheets_data:
                        sheets_data["document_key"] = document_key
                    
                    # Remove image_url if present
                    sheets_data.pop("image_url", None)
                    
                    # Prepare full OAuth credentials for Google Sheets
                    oauth_credentials = {
                        'access_token': access_token,
                        'refresh_token': refresh_token,
                        'client_id': os.getenv('GOOGLE_OAUTH_CLIENT_ID'),
                        'client_secret': os.getenv('GOOGLE_OAUTH_CLIENT_SECRET'),
                        'token_uri': 'https://oauth2.googleapis.com/token',
                        'scopes': tokens.get('scopes', [])  # Include granted scopes
                    }
                    
                    # Create user-specific sheets service
                    user_sheets_service = GoogleSheetsService(
                        spreadsheet_id=tokens.get('spreadsheet_id'),
                        user_oauth_credentials=oauth_credentials
                    )
                    
                    # Pass auto_category and company_name to sheets service
                    loop.run_until_complete(
                        user_sheets_service.sync_document_async(
                            sheets_data, 
                            user_category=None,
                            auto_category=auto_cat,
                            company_name=comp_name
                        )
                    )
                    print(f"✅ Synced to user's Google Sheet: {tokens.get('spreadsheet_name')}")
                else:
                    print(f"⚠️ No data found for {document_key}")
            finally:
                loop.close()
        except Exception as e:
            print(f"❌ Error syncing to sheets: {e}")
            import traceback
            traceback.print_exc()
    
    background_tasks.add_task(sync_to_sheets, auto_category, company_name, user_id)

    # 6. Return response with categorization result
    response = {
        "status": "success",
        "image_url": image_url,
        "document_key": document_key,
        "parsed": saved_result
    }
    
    # Add categorization info if available
    if categorization_result:
        response["categorization"] = categorization_result
    
    return response
