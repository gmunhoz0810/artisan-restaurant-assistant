"""
database.py

Core database configuration and session management.
Sets up SQLite database connection and provides session utilities.

Features:
- SQLite database configuration
- SQLAlchemy session management
- Connection pooling
- Session context management
- Database initialization
- Thread-safe session handling

"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./chatbot.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()