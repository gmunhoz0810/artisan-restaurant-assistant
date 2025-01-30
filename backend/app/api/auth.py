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

class TokenRequest(BaseModel):
    token: str

@router.post("/google-login", response_model=UserSchema)
async def google_login(token_request: TokenRequest, db: Session = Depends(get_db)):
    try:
        # Verify the token
        idinfo = id_token.verify_oauth2_token(
            token_request.token,
            requests.Request(),
            GOOGLE_CLIENT_ID
        )

        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            raise ValueError('Wrong issuer.')

        # Get or create user
        user = db.query(UserModel).filter(UserModel.id == idinfo['sub']).first()
        
        if not user:
            user = UserModel(
                id=idinfo['sub'],
                email=idinfo['email'],
                name=idinfo['name'],
                picture=idinfo.get('picture')
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        return user

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )
    except Exception as e:
        print(f"Login error: {str(e)}")  # Add this for debugging
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )