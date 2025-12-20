from datetime import datetime
from zoneinfo import ZoneInfo
from app.config.settings import init_firebase
from firebase_admin import db
import asyncio


class FirebaseService:

    def __init__(self):
        # firebase_admin db instance
        self.db = init_firebase()

    # ==============================
    #  CLEAN SERVER PAYLOAD FOR API
    # ==============================
    def _clean_for_response(self, payload: dict) -> dict:
        """
        Remove Firebase metadata so the API does not return duplicated data.
        """
        cleaned = payload.copy()
        remove_keys = [
            "document_key",
            "created_at",
            "business_path",
            "server_path",
            "status",
            "user_id",
        ]

        for key in remove_keys:
            cleaned.pop(key, None)

        return cleaned

    # ==============================
    #  SAVE METHOD (User-Scoped)
    # ==============================

    async def save_async(self, data: dict, user_id: str, company_id: str) -> dict:
        """
        Save document into user and company-specific paths (async version with parallel writes):

        🔹 users/{user_id}/companies/{company_id}/documents/{document_key}
            → Full parsed JSON with metadata

        Args:
            data: Document data to save
            user_id: Firebase UID of the user
            company_id: Company identifier
        """

        # Validate document_key
        if "document_key" not in data:
            raise ValueError("document_key must be included inside data!")

        doc_key = data["document_key"]

        # Generate Nepal timestamp
        now_nepal = datetime.now(ZoneInfo("Asia/Kathmandu"))
        created_at = now_nepal.strftime("%d %B %Y at %I:%M:%S %p")

        # Prepare complete payload
        complete_payload = data.copy()
        complete_payload["created_at"] = created_at
        complete_payload["user_id"] = user_id
        complete_payload["company_id"] = company_id

        # Single reference path
        doc_ref = self.db.reference(
            f"users/{user_id}/companies/{company_id}/documents/{doc_key}"
        )

        # Write to Firebase
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, doc_ref.set, complete_payload)

        return {
            "status": "saved",
            "document_key": doc_key,
            "created_at": created_at,
            "document_path": f"users/{user_id}/companies/{company_id}/documents/{doc_key}",
            "full_data": self._clean_for_response(complete_payload),
        }

    async def get_all_async(self, user_id: str, company_id: str):
        """Get all documents for a specific user and company from Firebase"""

        loop = asyncio.get_event_loop()
        ref = db.reference(f"users/{user_id}/companies/{company_id}/documents")
        all_docs = await loop.run_in_executor(None, ref.get)

        if not all_docs:
            return {}

        return all_docs

    async def get_document_async(
        self, user_id: str, company_id: str, document_key: str
    ):
        """Get a specific document for a user and company"""

        loop = asyncio.get_event_loop()
        ref = db.reference(
            f"users/{user_id}/companies/{company_id}/documents/{document_key}"
        )
        return await loop.run_in_executor(None, ref.get)

    async def save_google_tokens_async(
        self, user_id: str, company_id: str, tokens: dict
    ):
        """Save encrypted Google OAuth tokens for a user and company"""
        loop = asyncio.get_event_loop()
        ref = self.db.reference(f"users/{user_id}/companies/{company_id}/google_tokens")
        await loop.run_in_executor(None, ref.set, tokens)

    async def get_google_tokens_async(self, user_id: str, company_id: str):
        """Get encrypted Google OAuth tokens for a user and company"""
        loop = asyncio.get_event_loop()
        ref = self.db.reference(f"users/{user_id}/companies/{company_id}/google_tokens")
        return await loop.run_in_executor(None, ref.get)

    async def disconnect_google_tokens_async(self, user_id: str, company_id: str):
        """
        Disconnect Google Sheets by removing active tokens.
        Does NOT delete the sheet history or map.
        """
        loop = asyncio.get_event_loop()
        ref = self.db.reference(f"users/{user_id}/companies/{company_id}/google_tokens")
        # Removing the node effectively disconnects
        await loop.run_in_executor(None, ref.delete)

    async def save_sheet_to_history_async(
        self, user_id: str, company_id: str, google_sub: str, sheet_info: dict
    ):
        """
        Save a sheet to the user's history for a specific Google Account.
        Path: users/{uid}/companies/{cid}/sheet_history/{google_sub}/{sheet_id}
        """
        loop = asyncio.get_event_loop()
        sheet_id = sheet_info["spreadsheet_id"]
        # Use sheet_id as key to prevent duplicates
        ref = self.db.reference(
            f"users/{user_id}/companies/{company_id}/sheet_history/{google_sub}/{sheet_id}"
        )
        await loop.run_in_executor(None, ref.set, sheet_info)

    async def get_sheet_history_async(
        self, user_id: str, company_id: str, google_sub: str = None
    ):
        """
        Get sheet history.
        If google_sub is provided, gets history for that account.
        If google_sub is active in google_tokens, you can fetch it from there first.
        """
        loop = asyncio.get_event_loop()
        # If we know the google_sub, we fetch that specific history
        if google_sub:
            ref = self.db.reference(
                f"users/{user_id}/companies/{company_id}/sheet_history/{google_sub}"
            )
            return await loop.run_in_executor(None, ref.get)

        # Otherwise possibly get all history (rarely used directly without knowing account)
        ref = self.db.reference(f"users/{user_id}/companies/{company_id}/sheet_history")
        return await loop.run_in_executor(None, ref.get)

    async def delete_sheet_from_history_async(
        self, user_id: str, company_id: str, spreadsheet_id: str, google_sub: str = None
    ):
        """
        Delete a specific sheet from user's history.
        If google_sub is not provided, it will try to remove from all accounts in sheet_history.
        """
        loop = asyncio.get_event_loop()

        if google_sub:
            # Delete specific sheet under specific account
            ref = self.db.reference(
                f"users/{user_id}/companies/{company_id}/sheet_history/{google_sub}/{spreadsheet_id}"
            )
            await loop.run_in_executor(None, ref.delete)
        else:
            # Remove from all google_sub accounts
            ref = self.db.reference(
                f"users/{user_id}/companies/{company_id}/sheet_history"
            )
            all_history = await loop.run_in_executor(None, ref.get)

            if all_history:
                for sub_id, sheets in all_history.items():
                    if isinstance(sheets, dict) and spreadsheet_id in sheets:
                        ref_to_delete = self.db.reference(
                            f"users/{user_id}/companies/{company_id}/sheet_history/{sub_id}/{spreadsheet_id}"
                        )
                        await loop.run_in_executor(None, ref_to_delete.delete)
                        break