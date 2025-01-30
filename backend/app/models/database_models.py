from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True)  # Google User ID
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
    is_new = Column(Boolean, default=True)  # New field to track pristine state
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

    conversation = relationship("Conversation", back_populates="messages")