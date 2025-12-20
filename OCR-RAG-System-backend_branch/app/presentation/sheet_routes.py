# from fastapi import APIRouter, Depends, HTTPException, Request
# from fastapi.responses import RedirectResponse, JSONResponse
# from app.presentation.auth_middleware import get_current_user
# from app.infrastructure.oauth.oauth_service import GoogleOAuthService
# from app.infrastructure.firebase.firebase_service import FirebaseService
# from datetime import datetime
# from dotenv import load_dotenv
# import os

# router = APIRouter(prefix="/api/sheets", tags=["Sheets"])
# load_dotenv()
# # Initialize services
# oauth_service = GoogleOAuthService()
# firebase_service = FirebaseService()
# UPLOAD_DOCS_URL = os.getenv("UPLOAD_DOCS_URL")
# SHEETS_URL = os.getenv("SHEETS_URL")


# @router.get("/status")
# async def get_sheets_status(current_user: dict = Depends(get_current_user)):
#     """Check if user has connected Google Sheets for their active company"""
#     user_id = current_user["userId"]
#     company_id = current_user["activeCompany"]

#     # Get tokens from Firebase for this user + company
#     tokens = await firebase_service.get_google_tokens_async(user_id, company_id)

#     if not tokens:
#         return {"connected": False}

#     # We just return connected status and spreadsheet name if available
#     spreadsheet_name = tokens.get("spreadsheet_name", "Google Sheet")

#     return {
#         "connected": True,
#         "spreadsheet_name": spreadsheet_name,
#         "spreadsheet_id": tokens.get("spreadsheet_id"),
#         "spreadsheet_url": tokens.get("spreadsheet_url")
#     }

# @router.get("/connect")
# async def connect_sheets(current_user: dict = Depends(get_current_user)):
#     """Initiate Google OAuth flow for user's active company"""
#     # Generate state with user_id AND company_id to identify user + company in callback
#     user_id = current_user["userId"]
#     company_id = current_user["activeCompany"]
#     state = f"{user_id}:{company_id}"
#     try : 

#         auth_url = oauth_service.get_authorization_url(state=state)
#         return {"auth_url": auth_url}
#     except Exception as e:
#         raise HTTPException(status_code =500, detail=f"Failed to connect to google sheets: {str(e)}")

    

# @router.get("/oauth/callback")
# async def oauth_callback(code: str = None, state: str = None, error: str = None):
#     """Handle OAuth callback from Google"""
#     # Handle explicit error from Google (e.g., access_denied when user clicks Cancel)
#     if error:
#         print(f"⚠️ OAuth error: {error}")
#         return RedirectResponse(url=f"{UPLOAD_DOCS_URL}?sheets_error=true&error={error}")

#     # Handle case where user cancelled (no code and no explicit error)
#     if not code:
#         print("⚠️ OAuth cancelled: No authorization code received")
#         return RedirectResponse(url="{UPLOAD_DOCS_URL}?sheets_cancelled=true")

#     try:
#         # Exchange code for tokens
#         token_data = oauth_service.exchange_code_for_tokens(code)

#         # Parse state to get user_id and company_id
#         # Format: "user_id:company_id"
#         if not state or ":" not in state:
#             print(f"⚠️ Invalid state format: {state}")
#             return RedirectResponse(url=" {SHEETS_URL}?sheets_error=true&error=invalid_state")

#         user_id, company_id = state.split(":", 1)

#         if not user_id or not company_id:
#             print(f"⚠️ Missing user_id or company_id in state: {state}")
#             return RedirectResponse(url=" {SHEETS_URL}?sheets_error=true&error=invalid_state")

#         # Create a company-specific spreadsheet
#         # We need the access token to create the sheet
#         access_token = token_data["access_token"]

#         # Create spreadsheet with company-specific name
#         spreadsheet_name = f"AI Receipt - Company {company_id}"
#         spreadsheet_info = oauth_service.create_spreadsheet(access_token, spreadsheet_name)

#         # Encrypt tokens before saving
#         encrypted_access = oauth_service.encrypt_token(token_data["access_token"])
#         encrypted_refresh = oauth_service.encrypt_token(token_data["refresh_token"])

#         # Prepare data to save
#         save_data = {
#             "access_token": encrypted_access,
#             "refresh_token": encrypted_refresh,
#             "token_expiry": token_data["token_expiry"].isoformat(),
#             "scopes": token_data.get("scopes", []),  
#             "spreadsheet_id": spreadsheet_info["spreadsheet_id"],
#             "spreadsheet_name": spreadsheet_info["spreadsheet_name"],
#             "spreadsheet_url": spreadsheet_info["spreadsheet_url"],
#             "updated_at": datetime.utcnow().isoformat()
#         }

#         # Save to Firebase for this user + company
#         await firebase_service.save_google_tokens_async(user_id, company_id, save_data)

#         print(f"✅ Connected Google Sheets for user {user_id}, company {company_id}: {spreadsheet_info['spreadsheet_name']}")

#         # Redirect back to frontend (upload_docs.html as requested)
#         return RedirectResponse(
#             url=f"{UPLOAD_DOCS_URL}?sheets_connected=true&sheet_name={spreadsheet_info['spreadsheet_name']}"
#         )

#     except Exception as e:
#         print(f"❌ OAuth callback error: {str(e)}")
#         return RedirectResponse(url=f"{SHEETS_URL}?sheets_error=true&error={str(e)}")
    
    


# ==========================================================================================================================================================


from datetime import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse, JSONResponse
from app.presentation.auth_middleware import get_current_user
from app.infrastructure.oauth.oauth_service import GoogleOAuthService
from app.infrastructure.firebase.firebase_service import FirebaseService
from dotenv import load_dotenv 
import  os

router = APIRouter(prefix="/api/sheets", tags=["Sheets"])

# Initialize services
oauth_service = GoogleOAuthService()
firebase_service = FirebaseService()

# UPLOAD_PAGE_URL = "/static/upload_docs.html"
# SHEETS_PAGE_URL = "/static/sheets.html"
load_dotenv()
UPLOAD_PAGE_URL = os.getenv("UPLOAD_DOCS_URL")
SHEETS_PAGE_URL = os.getenv("SHEETS_URL")

@router.get("/status")
async def get_sheets_status(current_user: dict = Depends(get_current_user)):
    """Check if user has connected Google Sheets for their active company"""
    user_id = current_user["userId"]
    company_id = current_user["activeCompany"]

    try:

        # Get tokens from Firebase for this user + company
        tokens = await firebase_service.get_google_tokens_async(user_id, company_id)

    except Exception:
        raise HTTPException(
            status_code=500, detail="Failes to fetch google sheets connection status"
        )

    if not tokens:
        return {"connected": False}

    # We just return connected status and spreadsheet name if available
    spreadsheet_name = tokens.get("spreadsheet_name", "Google Sheet")

    # Get user info for history fetch if available
    access_token = tokens.get("access_token")

    # Simple check: If access_token is None, we are disconnected
    if not access_token:
        return {"connected": False}

    try:
       
        history = await firebase_service.get_sheet_history_async(user_id, company_id)

    except Exception:
        raise HTTPException(
            status_code=500, detail="Failes to fetch Google sheets history"
        )

    history_list = []
    if history:
        # Convert dict of dicts to list
        for sub_id, sheets in history.items():
            if isinstance(sheets, dict):
                for s_id, s_info in sheets.items():
                    history_list.append(s_info)

    return {
        "connected": True,
        "spreadsheet_name": spreadsheet_name,
        "spreadsheet_id": tokens.get("spreadsheet_id"),
        "spreadsheet_url": tokens.get("spreadsheet_url"),
        "history": history_list,
    }


@router.get("/connect")
async def connect_sheets(current_user: dict = Depends(get_current_user)):
    """Initiate Google OAuth flow for user's active company"""
    # Generate state with user_id AND company_id to identify user + company in callback
    user_id = current_user["userId"]
    company_id = current_user["activeCompany"]
    state = f"{user_id}:{company_id}"

    try:
        auth_url = oauth_service.get_authorization_url(state=state)
        return {"auth_url": auth_url}

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to connect to Google Sheets: {str(e)}"
        )


@router.post("/disconnect")
async def disconnect_sheets(current_user: dict = Depends(get_current_user)):
    """Disconnect Google Sheets (Remove active tokens)"""
    user_id = current_user["userId"]
    company_id = current_user["activeCompany"]

    try:

        await firebase_service.disconnect_google_tokens_async(user_id, company_id)
        return {"status": "disconnected"}
    except Exception:
        raise HTTPException(
            status_code=500, detail="Failed to disconnect google sheets "
        )


class SwitchSheetRequest(BaseModel):
    spreadsheet_id: str


@router.post("/switch_sheet")
async def switch_sheet(
    request: SwitchSheetRequest, current_user: dict = Depends(get_current_user)
):
    """Switch active Google Sheet to one from history"""
    user_id = current_user["userId"]
    company_id = current_user["activeCompany"]

    # Get current tokens to ensure we are connected (or at least valid user context)
    # Actually, we might be disconnected state in UI but want to "Reconnect" to a specific historical sheet?
    # But usually switch implies we are active.
    # If we are disconnected, the user should hit "Connect" -> Callback -> Reuse Logic.
    # So Switch is for "I am connected to Sheet A, I want Sheet B".

    try:
        tokens = await firebase_service.get_google_tokens_async(user_id, company_id)
    except Exception:
        raise HTTPException(
            status_code=500, detail="Failed to read Google Sheets connection"
        )

    if not tokens or not tokens.get("access_token"):
        raise HTTPException(status_code=400, detail="Not connected to Google Sheets")

    try:
        history = await firebase_service.get_sheet_history_async(user_id, company_id)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to fetch sheet history")

    found_sheet = None

    if history:
        for sub_id, sheets in history.items():
            if isinstance(sheets, dict) and request.spreadsheet_id in sheets:
                found_sheet = sheets[request.spreadsheet_id]
                break

    if not found_sheet:
        raise HTTPException(status_code=404, detail="Sheet not found in history")

    # Update active tokens with new sheet info
    tokens["spreadsheet_id"] = found_sheet["spreadsheet_id"]
    tokens["spreadsheet_name"] = found_sheet["spreadsheet_name"]
    tokens["spreadsheet_url"] = found_sheet["spreadsheet_url"]

    try:
        await firebase_service.save_google_tokens_async(user_id, company_id, tokens)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to switch active sheet")

    return {"status": "switched", "sheet_name": found_sheet["spreadsheet_name"]}


@router.post("/create_new_sheet")
async def create_new_sheet(current_user: dict = Depends(get_current_user)):
    user_id = current_user["userId"]
    company_id = current_user["activeCompany"]

    try:
        tokens = await firebase_service.get_google_tokens_async(user_id, company_id)
    except Exception:
        raise HTTPException(500, "Failed to read connection data")

    if not tokens or not tokens.get("access_token"):
        raise HTTPException(400, "Not connected")

    try:
        access_token = oauth_service.decrypt_token(tokens["access_token"])
        user_info = oauth_service.get_user_info(access_token)
        google_sub = user_info["id"]
    except Exception:
        raise HTTPException(401, "Google authentication failed")

    try:
        timestamp = int(datetime.utcnow().timestamp())
        sheet_name = f"AI Receipt - Company {company_id} ({timestamp})"
        new_sheet = oauth_service.create_spreadsheet(access_token, sheet_name)
        new_sheet["created_at"] = datetime.utcnow().isoformat()
    except Exception:
        raise HTTPException(502, "Failed to create Google Sheet")

    try:
        tokens.update(
            {
                "spreadsheet_id": new_sheet["spreadsheet_id"],
                "spreadsheet_name": new_sheet["spreadsheet_name"],
                "spreadsheet_url": new_sheet["spreadsheet_url"],
            }
        )

        await firebase_service.save_google_tokens_async(user_id, company_id, tokens)
        await firebase_service.save_sheet_to_history_async(
            user_id, company_id, google_sub, new_sheet
        )
    except Exception:
        raise HTTPException(500, "Failed to persist sheet data")

    return {"status": "created", "sheet_name": sheet_name}





@router.get("/oauth/callback")
async def oauth_callback(code: str = None, state: str = None, error: str = None):
    """Handle OAuth callback from Google"""

    #  Explicit OAuth error
    if error:
        return RedirectResponse(
            url=f"{UPLOAD_PAGE_URL}?sheets_error=true&error={error}"
        )

    #  User cancelled OAuth
    if not code:
        return RedirectResponse(url=f"{UPLOAD_PAGE_URL}?sheets_cancelled=true")

    # 1️ Exchange authorization code for tokens
    try:
        token_data = oauth_service.exchange_code_for_tokens(code)
    except Exception:
        return RedirectResponse(
            url=f"{UPLOAD_PAGE_URL}?sheets_error=true&error=oauth_exchange_failed"
        )

    # 2️ Validate and parse state (NO try-except)
    if not state or ":" not in state:
        return RedirectResponse(
            url=f"{UPLOAD_PAGE_URL}?sheets_error=true&error=invalid_state"
        )

    user_id, company_id = state.split(":", 1)

    # 3️ Fetch Google identity
    try:
        access_token = token_data["access_token"]
        user_info = oauth_service.get_user_info(access_token)
        google_sub = user_info["id"]
    except Exception:
        return RedirectResponse(
            url=f"{UPLOAD_PAGE_URL}?sheets_error=true&error=google_identity_failed"
        )

    # 4️ Fetch sheet history
    try:
        history = await firebase_service.get_sheet_history_async(
            user_id, company_id, google_sub
        )
    except Exception:
        return RedirectResponse(
            url=f"{UPLOAD_PAGE_URL}?sheets_error=true&error=history_fetch_failed"
        )

    # 5️ Decide which sheet to use (pure logic)
    target_sheet = None
    if history:
        for _, sheet_info in history.items():
            target_sheet = sheet_info
            break

    # 6️ Create new sheet if none exists
    if not target_sheet:
        try:
            timestamp = int(datetime.utcnow().timestamp())
            spreadsheet_name = f"AI Receipt - Company {company_id} ({timestamp})"
            # spreadsheet_name = f"AI Receipt - Company {company_id}"
            target_sheet = oauth_service.create_spreadsheet(
                access_token, spreadsheet_name
            )
            target_sheet["created_at"] = datetime.utcnow().isoformat()
        except Exception:
            return RedirectResponse(
                url=f"{UPLOAD_PAGE_URL}?sheets_error=true&error=sheet_creation_failed"
            )

        try:
            await firebase_service.save_sheet_to_history_async(
                user_id, company_id, google_sub, target_sheet
            )
        except Exception:
            return RedirectResponse(
                url=f"{UPLOAD_PAGE_URL}?sheets_error=true&error=history_save_failed"
            )

    # 7️ Save active tokens
    try:
        encrypted_access = oauth_service.encrypt_token(token_data["access_token"])
        encrypted_refresh = oauth_service.encrypt_token(token_data["refresh_token"])

        save_data = {
            "access_token": encrypted_access,
            "refresh_token": encrypted_refresh,
            "token_expiry": token_data["token_expiry"].isoformat(),
            "scopes": token_data.get("scopes", []),
            "google_sub": google_sub,
            "google_email": user_info.get("email"),
            "spreadsheet_id": target_sheet["spreadsheet_id"],
            "spreadsheet_name": target_sheet["spreadsheet_name"],
            "spreadsheet_url": target_sheet["spreadsheet_url"],
            "updated_at": datetime.utcnow().isoformat(),
        }

        await firebase_service.save_google_tokens_async(user_id, company_id, save_data)
    except Exception:
        return RedirectResponse(
            url=f"{UPLOAD_PAGE_URL}?sheets_error=true&error=token_persistence_failed"
        )

    # 8️ Success
    return RedirectResponse(
        url=(
            f"{UPLOAD_PAGE_URL}"
            f"?sheets_connected=true&sheet_name={target_sheet['spreadsheet_name']}"
        )
    )





class DeleteSheetRequest(BaseModel):
    spreadsheet_id: str


@router.post("/delete_sheet")
async def delete_sheet(
    request: DeleteSheetRequest, current_user: dict = Depends(get_current_user)
):
    user_id = current_user["userId"]
    company_id = current_user["activeCompany"]

    # Get current tokens to fetch google_sub if needed
    tokens = await firebase_service.get_google_tokens_async(user_id, company_id)
    if not tokens or not tokens.get("access_token"):
        raise HTTPException(status_code=400, detail="Not connected to Google Sheets")

    google_sub = tokens.get("google_sub")

    # Delete from Firebase history
    await firebase_service.delete_sheet_from_history_async(
        user_id, company_id, request.spreadsheet_id, google_sub
    )

    # If this sheet is active, clear active tokens
    if tokens.get("spreadsheet_id") == request.spreadsheet_id:
        tokens["spreadsheet_id"] = None
        tokens["spreadsheet_name"] = None
        tokens["spreadsheet_url"] = None
        await firebase_service.save_google_tokens_async(user_id, company_id, tokens)

    return {"status": "deleted", "spreadsheet_id": request.spreadsheet_id}