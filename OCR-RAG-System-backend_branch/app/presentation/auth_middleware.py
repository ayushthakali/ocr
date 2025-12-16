
from fastapi import Depends, Header, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt, os
from dotenv import load_dotenv
from typing import Optional
load_dotenv()
security = HTTPBearer()
JWT_SECRET = os.getenv("JWT_SECRET")

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    x_active_company: str = Header(...),
    x_company_name: Optional[str] = Header(None)  # Read company name from header
) -> dict:
    """
    Decode JWT token from frontend and include active company info from headers.

    JWT Payload must contain:
    - userId: User's unique ID
    - companies: List of company IDs the user belongs to

    Headers required:
    - X-Active-Company: Currently active company ID
    - X-Company-Name: Currently active company name
    """
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, options={"verify_signature": False})

        # Validate expected fields in JWT
        for key in ["userId"]:
            if key not in payload:
                raise HTTPException(status_code=400, detail=f"{key} missing in token")

        # Validate active company is in user's companies list
        # if x_active_company not in payload["companies"]:
        #     raise HTTPException(
        #         status_code=403,
        #         detail=f"Active company {x_active_company} not allowed for this user"
        #     )

        # Add active company and company name to the payload
        payload["activeCompany"] = x_active_company
        payload["companyName"] = x_company_name

        return payload

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

