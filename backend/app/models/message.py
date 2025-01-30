from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

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
    pass

class ConversationUpdate(ConversationBase):
    pass

class Conversation(ConversationBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    is_active: bool

    class Config:
        from_attributes = True

class ConversationWithMessages(Conversation):
    messages: List[Message]

    class Config:
        from_attributes = True