from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class UserBase(BaseModel):
    email: str
    name: str
    picture: Optional[str] = None

class UserCreate(UserBase):
    id: str  # Google User ID

class User(UserBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

class MessageBase(BaseModel):
    content: str

class MessageCreate(MessageBase):
    conversation_id: int

class MessageUpdate(MessageBase):
    pass

class Message(MessageBase):
    id: int
    conversation_id: int
    sender: str  # 'user' or 'bot'
    timestamp: datetime
    is_edited: bool = False

    class Config:
        from_attributes = True

class ConversationBase(BaseModel):
    title: str

class ConversationCreate(ConversationBase):
    user_id: str

class ConversationUpdate(ConversationBase):
    pass

class Conversation(ConversationBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    is_active: bool
    user_id: str

    class Config:
        from_attributes = True

class ConversationWithMessages(Conversation):
    messages: List[Message]

    class Config:
        from_attributes = True