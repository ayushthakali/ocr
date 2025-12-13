

from fastapi import APIRouter, HTTPException, Depends
from firebase_admin import db
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from app.presentation.auth_middleware import get_current_user

router = APIRouter()

@router.get("/search-documents")
async def search_documents(
    start_date: str = None,
    end_date: str = None,
    doc_type: str = None,
    current_user: dict = Depends(get_current_user) 
):
    """
    Search documents for the authenticated user with flexible filters
    - start_date: Filter by start date (YYYY-MM-DD format)
    - end_date: Filter by end date (YYYY-MM-DD format)
    - doc_type: Filter by document type (receipt, invoice, bank_statement, others)
    """

   
     
    user_id = current_user['userId']
    company_id = current_user["activeCompany"]
    print(f"ℹ️ [TEST MODE] Searching documents for user: {user_id}, company_id: {company_id}")

    all_results = []

    # Parse date filters if provided (make them timezone-aware for Nepal timezone)
    nepal_tz = ZoneInfo("Asia/Kathmandu")
    start_dt = None
    end_dt = None

    if start_date:
        try:
            start_dt = datetime.strptime(start_date, "%Y-%m-%d")
            start_dt = start_dt.replace(hour=0, minute=0, second=0, microsecond=0, tzinfo=nepal_tz)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start_date format. Use YYYY-MM-DD")

    if end_date:
        try:
            end_dt = datetime.strptime(end_date, "%Y-%m-%d")
            end_dt = end_dt.replace(hour=23, minute=59, second=59, microsecond=999999, tzinfo=nepal_tz)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid end_date format. Use YYYY-MM-DD")

    # Get all documents for this user and company from new structure
    user_docs_ref = db.reference(f"users/{user_id}/companies/{company_id}/documents")
    user_docs = user_docs_ref.get() or {}

    for doc_id, doc_data in user_docs.items():
        # With new structure, all data is in one place (no business/server split)

        # Parse created_at for sorting and filtering
        created_at_str = doc_data.get("created_at")
        created_dt = None

        if created_at_str:
            try:
                if 'Z' in created_at_str:
                    created_dt = datetime.fromisoformat(created_at_str.replace('Z', '+00:00'))
                else:
                    try:
                        created_dt = datetime.fromisoformat(created_at_str)
                        if created_dt.tzinfo is None:
                            created_dt = created_dt.replace(tzinfo=timezone.utc)
                        created_dt = created_dt.astimezone(nepal_tz)
                    except ValueError:
                        # Fallback for "02 December 2025 at 02:11:02 PM" format
                        clean_str = created_at_str.replace(' at ', ' ')
                        try:
                            created_dt = datetime.strptime(clean_str, "%d %B %Y %I:%M:%S %p")
                            created_dt = created_dt.replace(tzinfo=nepal_tz)
                        except ValueError:
                            print(f"⚠️ Could not parse date: {created_at_str}")
            except (ValueError, AttributeError) as e:
                print(f"⚠️ Failed to parse date for {doc_id}: {created_at_str} - {e}")

        # Apply date filter
        if start_dt or end_dt:
            if not created_dt:
                continue
            if start_dt and created_dt < start_dt:
                continue
            if end_dt and created_dt > end_dt:
                continue

        # Get document type from document data
        document_type = doc_data.get("document_type", "").lower()

        # Apply document type filter
        if doc_type and doc_type.lower() != "all":
            if doc_type.lower() == "bank_statement":
                if document_type not in ["bank_statement", "bank statement"]:
                    continue
            elif doc_type.lower() == "others":
                if document_type in ["receipt", "invoice", "bank_statement", "bank statement"]:
                    continue
            else:
                if document_type != doc_type.lower():
                    continue

        # Add to results
        all_results.append({
            "doc_id": doc_id,
            "created_at": created_at_str,
            "image_url": doc_data.get("image_url"),
            "document_type": document_type,
            "_sort_dt": created_dt or datetime.min.replace(tzinfo=timezone.utc)
        })
    
    # Sort by newest first
    all_results.sort(key=lambda x: x["_sort_dt"], reverse=True)
    
    # Remove helper key
    for res in all_results:
        res.pop("_sort_dt", None)
    
    return all_results