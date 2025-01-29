from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import messages
from .core.database import engine
from .models import database_models

database_models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(messages.router, prefix="/api/messages", tags=["messages"])

@app.get("/")
async def root():
    return {"status": "ok"}