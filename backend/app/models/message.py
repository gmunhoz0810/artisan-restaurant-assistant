from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class MessageBase(BaseModel):
    content: str

class MessageCreate(MessageBase):
    pass

class MessageUpdate(MessageBase):
    pass

class Message(MessageBase):
    id: int
    sender: str  # 'user' or 'bot'
    timestamp: datetime
    is_edited: bool = False

    class Config:
        from_attributes = True