from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import json

from ..core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True)
    email = Column(String, unique=True)
    name = Column(String)
    picture = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    conversations = relationship("Conversation", back_populates="user")

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, default="New Conversation")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    is_active = Column(Boolean, default=True)
    is_new = Column(Boolean, default=True)
    thread_id = Column(String, unique=True, nullable=True)
    user_id = Column(String, ForeignKey("users.id"))
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")
    user = relationship("User", back_populates="conversations")

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"))
    content = Column(String, nullable=False)
    sender = Column(String, nullable=False)  # 'user' or 'bot'
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    is_edited = Column(Boolean, default=False)
    restaurant_search = Column(Text, nullable=True)
    
    conversation = relationship("Conversation", back_populates="messages")

    def load_restaurant_search(self):
        """Simple load - if there's data, parse it. If not, return None."""
        if not self.restaurant_search:
            return None
        try:
            return json.loads(self.restaurant_search)
        except:
            return None

    def save_restaurant_search(self, data):
        """Simple save - if there's data, save it. If not, set to None."""
        if data is not None:
            self.restaurant_search = json.dumps(data)
        else:
            self.restaurant_search = None