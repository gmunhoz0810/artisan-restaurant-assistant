from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, field_validator
import json

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
    sender: str
    timestamp: datetime
    is_edited: bool = False
    restaurant_search: Optional[Dict[str, Any]] = None

    @field_validator('restaurant_search', mode='before')
    @classmethod
    def parse_restaurant_search(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                print(f"Error decoding restaurant_search: {v}")
                return None
        return v

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }

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
    is_new: bool
    user_id: str

    class Config:
        from_attributes = True

class ConversationWithMessages(Conversation):
    messages: List[Message]

    class Config:
        from_attributes = True