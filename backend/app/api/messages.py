from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
from ..models.message import Message as MessageSchema
from ..models.message import MessageCreate, MessageUpdate
from ..models.database_models import Message as MessageModel
from ..core.database import get_db

router = APIRouter()

@router.get("/", response_model=List[MessageSchema])
async def get_messages(db: Session = Depends(get_db)):
    messages = db.query(MessageModel).order_by(MessageModel.timestamp.asc()).all()
    return messages

@router.post("/", response_model=MessageSchema)
async def create_message(message: MessageCreate, db: Session = Depends(get_db)):
    # Create user message
    db_message = MessageModel(content=message.content, sender="user")
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    
    # Create bot response (simple echo for now)
    bot_response = MessageModel(
        content=f"You said: {message.content}",
        sender="bot"
    )
    db.add(bot_response)
    db.commit()
    db.refresh(bot_response)
    
    return db_message

@router.put("/{message_id}", response_model=MessageSchema)
async def update_message(message_id: int, message: MessageUpdate, db: Session = Depends(get_db)):
    db_message = db.query(MessageModel).filter(MessageModel.id == message_id).first()
    if db_message is None:
        raise HTTPException(status_code=404, detail="Message not found")
    if db_message.sender != "user":
        raise HTTPException(status_code=400, detail="Can only edit user messages")
    
    db_message.content = message.content
    db_message.is_edited = True
    db.commit()
    db.refresh(db_message)
    return db_message

@router.delete("/{message_id}")
async def delete_message(message_id: int, db: Session = Depends(get_db)):
    db_message = db.query(MessageModel).filter(MessageModel.id == message_id).first()
    if db_message is None:
        raise HTTPException(status_code=404, detail="Message not found")
    if db_message.sender != "user":
        raise HTTPException(status_code=400, detail="Can only delete user messages")
    
    db.delete(db_message)
    db.commit()
    return {"status": "success"}