
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import Response
from app.utils.firebase_to_csv import FirebaseToCSV
from app.utils.excel_templates import ExcelTemplateFactory
from firebase_admin import db

from app.presentation.auth_middleware import get_current_user

router = APIRouter()

@router.get("/generate-csv/{doc_id}")
def generate_csv(doc_id: str, current_user: dict = Depends(get_current_user)):
    obj = FirebaseToCSV()
    user_id = current_user["uid"]
    company_id = current_user["activeCompany"]

    # Updated path with company structure
    ref = db.reference(f"users/{user_id}/companies/{company_id}/documents/{doc_id}")
    data = ref.get()

    if not data:
        raise HTTPException(status_code=404, detail="Document not found")

    # Fields to exclude from CSV export (internal system fields)
    exclude_fields = [
        "company_id",
        "image_url",
        "document_key",
        "user_id",
        "created_at",
        "document_type"
    ]

    # Flatten data and generate CSV with excluded fields
    flattened_rows = obj.flatten_for_csv(data)
    csv_text = obj.generate_csv_from_rows(flattened_rows, exclude_fields=exclude_fields)

    return {
        "doc_id": doc_id,
        "csv": csv_text,
        "filename": f"{doc_id}.csv"
    }


@router.get("/generate-excel/{doc_id}")
def generate_excel(doc_id: str, current_user: dict = Depends(get_current_user)):
    """
    Generate a beautifully formatted Excel file for a document
    """
    user_id = current_user["uid"]
    company_id = current_user["activeCompany"]

    # Get document data from Firebase
    ref = db.reference(f"users/{user_id}/companies/{company_id}/documents/{doc_id}")
    data = ref.get()

    if not data:
        raise HTTPException(status_code=404, detail="Document not found")

    # Fields to exclude from Excel export (internal system fields)
    exclude_fields = [
        "company_id",
        "image_url",
        "document_key",
        "user_id",
        "created_at",
        "document_type"
    ]

    # Create a clean copy of data without excluded fields
    clean_data = {k: v for k, v in data.items() if k not in exclude_fields}

    # Add back document_type for template selection
    if "document_type" in data:
        clean_data["document_type"] = data["document_type"]

    # Generate Excel file using template factory
    excel_bytes = ExcelTemplateFactory.generate_excel(clean_data)

    # Determine filename
    doc_type = data.get('document_type', 'document')
    filename = f"{doc_type}_{doc_id}.xlsx"

    # Return Excel file as response
    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )

