from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse, JSONResponse
from app.presentation.auth_middleware import get_current_user
from app.infrastructure.oauth.oauth_service import GoogleOAuthService
from app.infrastructure.firebase.firebase_service import FirebaseService
from datetime import datetime
from dotenv import load_dotenv
import os

router = APIRouter(prefix="/api/sheets", tags=["Sheets"])
load_dotenv()
# Initialize services
oauth_service = GoogleOAuthService()
firebase_service = FirebaseService()
UPLOAD_DOCS_URL = os.getenv("UPLOAD_DOCS_URL")
SHEETS_URL = os.getenv("SHEETS_URL")


@router.get("/status")
async def get_sheets_status(current_user: dict = Depends(get_current_user)):
    """Check if user has connected Google Sheets for their active company"""
    user_id = current_user["userId"]
    company_id = current_user["activeCompany"]

    # Get tokens from Firebase for this user + company
    tokens = await firebase_service.get_google_tokens_async(user_id, company_id)

    if not tokens:
        return {"connected": False}

    # We just return connected status and spreadsheet name if available
    spreadsheet_name = tokens.get("spreadsheet_name", "Google Sheet")

    return {
        "connected": True,
        "spreadsheet_name": spreadsheet_name,
        "spreadsheet_id": tokens.get("spreadsheet_id"),
        "spreadsheet_url": tokens.get("spreadsheet_url")
    }

@router.get("/connect")
async def connect_sheets(current_user: dict = Depends(get_current_user)):
    """Initiate Google OAuth flow for user's active company"""
    # Generate state with user_id AND company_id to identify user + company in callback
    user_id = current_user["userId"]
    company_id = current_user["activeCompany"]
    state = f"{user_id}:{company_id}"
    try : 

        auth_url = oauth_service.get_authorization_url(state=state)
        return {"auth_url": auth_url}
    except Exception as e:
        raise HTTPException(status_code =500, detail=f"Failed to connect to google sheets: {str(e)}")

    

@router.get("/oauth/callback")
async def oauth_callback(code: str = None, state: str = None, error: str = None):
    """Handle OAuth callback from Google"""
    # Handle explicit error from Google (e.g., access_denied when user clicks Cancel)
    if error:
        print(f"⚠️ OAuth error: {error}")
        return RedirectResponse(url=f"{UPLOAD_DOCS_URL}?sheets_error=true&error={error}")

    # Handle case where user cancelled (no code and no explicit error)
    if not code:
        print("⚠️ OAuth cancelled: No authorization code received")
        return RedirectResponse(url="{UPLOAD_DOCS_URL}?sheets_cancelled=true")

    try:
        # Exchange code for tokens
        token_data = oauth_service.exchange_code_for_tokens(code)

        # Parse state to get user_id and company_id
        # Format: "user_id:company_id"
        if not state or ":" not in state:
            print(f"⚠️ Invalid state format: {state}")
            return RedirectResponse(url=" {SHEETS_URL}?sheets_error=true&error=invalid_state")

        user_id, company_id = state.split(":", 1)

        if not user_id or not company_id:
            print(f"⚠️ Missing user_id or company_id in state: {state}")
            return RedirectResponse(url=" {SHEETS_URL}?sheets_error=true&error=invalid_state")

        # Create a company-specific spreadsheet
        # We need the access token to create the sheet
        access_token = token_data["access_token"]

        # Create spreadsheet with company-specific name
        spreadsheet_name = f"AI Receipt - Company {company_id}"
        spreadsheet_info = oauth_service.create_spreadsheet(access_token, spreadsheet_name)

        # Encrypt tokens before saving
        encrypted_access = oauth_service.encrypt_token(token_data["access_token"])
        encrypted_refresh = oauth_service.encrypt_token(token_data["refresh_token"])

        # Prepare data to save
        save_data = {
            "access_token": encrypted_access,
            "refresh_token": encrypted_refresh,
            "token_expiry": token_data["token_expiry"].isoformat(),
            "scopes": token_data.get("scopes", []),  
            "spreadsheet_id": spreadsheet_info["spreadsheet_id"],
            "spreadsheet_name": spreadsheet_info["spreadsheet_name"],
            "spreadsheet_url": spreadsheet_info["spreadsheet_url"],
            "updated_at": datetime.utcnow().isoformat()
        }

        # Save to Firebase for this user + company
        await firebase_service.save_google_tokens_async(user_id, company_id, save_data)

        print(f"✅ Connected Google Sheets for user {user_id}, company {company_id}: {spreadsheet_info['spreadsheet_name']}")

        # Redirect back to frontend (upload_docs.html as requested)
        return RedirectResponse(
            url=f"{UPLOAD_DOCS_URL}?sheets_connected=true&sheet_name={spreadsheet_info['spreadsheet_name']}"
        )

    except Exception as e:
        print(f"❌ OAuth callback error: {str(e)}")
        return RedirectResponse(url=f"{SHEETS_URL}?sheets_error=true&error={str(e)}")
    
    
