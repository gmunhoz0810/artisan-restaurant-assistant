from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from google.oauth2 import id_token
from google.auth.transport import requests
from pydantic import BaseModel
import os

from ..core.database import get_db
from ..models.database_models import User as UserModel
from ..models.message import User as UserSchema, UserCreate

router = APIRouter()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
if not GOOGLE_CLIENT_ID:
    raise ValueError("GOOGLE_CLIENT_ID environment variable is not set")

class TokenRequest(BaseModel):
    token: str

@router.post("/google-login", response_model=UserSchema)
async def google_login(token_request: TokenRequest, db: Session = Depends(get_db)):
    try:
        # Print debug information
        print(f"Attempting to verify token with client ID: {GOOGLE_CLIENT_ID}")
        
        # Verify the token
        idinfo = id_token.verify_oauth2_token(
            token_request.token,
            requests.Request(),
            GOOGLE_CLIENT_ID,
            clock_skew_in_seconds=60  # Add some tolerance for clock skew
        )
        
        print(f"Token verification successful. User info: {idinfo['sub']}")

        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            raise ValueError('Wrong issuer.')

        # Get or create user
        user = db.query(UserModel).filter(UserModel.id == idinfo['sub']).first()
        
        if not user:
            print(f"Creating new user with ID: {idinfo['sub']}")
            user = UserModel(
                id=idinfo['sub'],
                email=idinfo['email'],
                name=idinfo['name'],
                picture=idinfo.get('picture')
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            print(f"Found existing user with ID: {idinfo['sub']}")

        return user

    except ValueError as e:
        print(f"ValueError in google_login: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )
    except Exception as e:
        print(f"Unexpected error in google_login: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )