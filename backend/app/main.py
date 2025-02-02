"""
main.py

FastAPI application initialization and configuration.
Sets up the main application with all required middleware and routers.

Features:
- CORS configuration
- Router registration
- Database initialization
- Environment configuration
- API documentation setup
- Error handlers
- Security middleware

"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

from .api import messages, auth, yelp
from .core.database import engine
from .models import database_models

database_models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(messages.router, prefix="/api/messages", tags=["messages"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(yelp.router, prefix="/api/yelp", tags=["yelp"])

@app.get("/")
async def root():
    return {"status": "ok"}