"""
auth.py

FastAPI router handling Google OAuth authentication processes.
Manages user authentication, token verification, and user profile data.

Key Features:
- Google OAuth token verification
- User profile creation and updates
- Session token management
- Database user persistence
- Error handling for auth failures
- Automatic user profile syncing with Google data

"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from google.oauth2 import id_token
from google.auth.transport import requests
from pydantic import BaseModel
import os
import json

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
        print("\n=== GOOGLE LOGIN ATTEMPT ===")
        
        # Verify the token and get user info
        idinfo = id_token.verify_oauth2_token(
            token_request.token,
            requests.Request(),
            GOOGLE_CLIENT_ID,
            clock_skew_in_seconds=60
        )
        
        # Debug: Print all available fields from Google
        print("\nGoogle Token Info:")
        for key, value in idinfo.items():
            print(f"{key}: {value}")
        
        print(f"\nPicture URL specifically: {idinfo.get('picture', 'NO PICTURE URL FOUND')}")

        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            raise ValueError('Wrong issuer.')

        # Get or create user
        user = db.query(UserModel).filter(UserModel.id == idinfo['sub']).first()
        
        if not user:
            print(f"\nCreating new user:")
            print(f"ID: {idinfo['sub']}")
            print(f"Email: {idinfo['email']}")
            print(f"Name: {idinfo['name']}")
            print(f"Picture URL: {idinfo.get('picture')}")
            
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
            print(f"\nUpdating existing user:")
            print(f"ID: {user.id}")
            print(f"Old picture URL: {user.picture}")
            print(f"New picture URL: {idinfo.get('picture')}")
            
            user.email = idinfo['email']
            user.name = idinfo['name']
            user.picture = idinfo.get('picture')
            db.commit()
            db.refresh(user)

        print("\nFinal user state in database:")
        print(f"ID: {user.id}")
        print(f"Email: {user.email}")
        print(f"Name: {user.name}")
        print(f"Picture URL: {user.picture}")
        
        return user

    except ValueError as e:
        print(f"\nValueError in google_login: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )
    except Exception as e:
        print(f"\nUnexpected error in google_login: {str(e)}")
        print(f"Error type: {type(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )