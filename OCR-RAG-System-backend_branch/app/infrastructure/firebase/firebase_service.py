from datetime import datetime
from zoneinfo import ZoneInfo
from app.config.settings import init_firebase
from firebase_admin import  db
import asyncio

class FirebaseService():

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
            "document_key", "created_at",
            "business_path", "server_path",
            "status", "user_id"
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
        doc_ref = self.db.reference(f"users/{user_id}/companies/{company_id}/documents/{doc_key}")

        # Write to Firebase
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, doc_ref.set, complete_payload)

        return {
            "status": "saved",
            "document_key": doc_key,
            "created_at": created_at,
            "document_path": f"users/{user_id}/companies/{company_id}/documents/{doc_key}",
            "full_data": self._clean_for_response(complete_payload)   
        }
        
    async def get_all_async(self, user_id: str, company_id: str):
        """Get all documents for a specific user and company from Firebase"""

        loop = asyncio.get_event_loop()
        ref = db.reference(f"users/{user_id}/companies/{company_id}/documents")
        all_docs = await loop.run_in_executor(None, ref.get)

        if not all_docs:
            return {}

        return all_docs

    async def get_document_async(self, user_id: str, company_id: str, document_key: str):
        """Get a specific document for a user and company"""

        loop = asyncio.get_event_loop()
        ref = db.reference(f"users/{user_id}/companies/{company_id}/documents/{document_key}")
        return await loop.run_in_executor(None, ref.get)

    async def save_google_tokens_async(self, user_id: str, company_id: str, tokens: dict):
        """Save encrypted Google OAuth tokens for a user and company"""
        loop = asyncio.get_event_loop()
        ref = self.db.reference(f"users/{user_id}/companies/{company_id}/google_tokens")
        await loop.run_in_executor(None, ref.set, tokens)

    async def get_google_tokens_async(self, user_id: str, company_id: str):
        """Get encrypted Google OAuth tokens for a user and company"""
        loop = asyncio.get_event_loop()
        ref = self.db.reference(f"users/{user_id}/companies/{company_id}/google_tokens")
        return await loop.run_in_executor(None, ref.get)

