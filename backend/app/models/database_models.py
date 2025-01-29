from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.sql import func
from ..core.database import Base

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(String, nullable=False)
    sender = Column(String, nullable=False)  # 'user' or 'bot'
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    is_edited = Column(Boolean, default=False)