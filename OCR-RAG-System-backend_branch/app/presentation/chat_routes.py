from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.use_cases.rag_service import get_rag_service
from app.presentation.auth_middleware import get_current_user

router = APIRouter(prefix="/api", tags=["Chat"])

class ChatRequest(BaseModel):
    query: str

@router.post("/chat")
async def chat(request: ChatRequest, 
               current_user: dict = Depends(get_current_user)
            ):
    """
    RAG-powered chat endpoint with user and company-specific data isolation
    Retrieves relevant documents and generates intelligent responses
    Only returns documents belonging to the authenticated user and their active company
    """
    try:
        # Extract user_id and company_id from authenticated user
        user_id = current_user["userId"]
        company_id = current_user["activeCompany"]
       

        # Get RAG service and perform user + company filtered search
        rag_service = get_rag_service()
        result = await rag_service.chat_async(request.query, user_id, company_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")
