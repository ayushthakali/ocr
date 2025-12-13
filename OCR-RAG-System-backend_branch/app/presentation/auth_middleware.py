from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
import os
from dotenv import load_dotenv

load_dotenv()

security = HTTPBearer()
JWT_SECRET = os.getenv("JWT_SECRET") 

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """
    Decode JWT sent by frontend using secret key,
    without specifying algorithm explicitly.
     """
    # return {
    #     "userId": "test_user_123",
    #     "uid": "test_user_123",
    #     "activeCompany": "test_company_001",
    #     "companyName": "Test Company 001",
    #     "companyIds": ["test_company_001", "test_company_002"]
    # }

    # Test second user
    # return {
    #     "userId": "test_user_456",
    #     "uid": "test_user_456",
    #     "activeCompany": "test_company_100",
    #     "companyName": "Test Company 1000",
    #     "companyIds": ["test_company_100", "test_company_200"]
    # }

    # ==============================================================================================

    token = credentials.credentials
    try:
        # Decode token using secret only; library may infer algorithm automatically
        payload = jwt.decode(token, JWT_SECRET, options={"verify_signature": True})
    
        # Optional: validate payload fields
        if "userId" not in payload or "activeCompany" not in payload:
            raise HTTPException(status_code=400, detail="Invalid token payload")
    
        return payload
    
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
