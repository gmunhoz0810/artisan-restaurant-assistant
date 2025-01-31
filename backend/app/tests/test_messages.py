"""
Test suite for message endpoints with authentication and conversation support.
Tests key functionality while maintaining isolation from the main application.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from typing import Generator
from datetime import datetime

from app.main import app
from app.core.database import Base, get_db
from app.models.database_models import User, Conversation
from app.auth.oauth import get_current_user

# Test database setup - uses separate SQLite file
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def create_test_user():
    """Creates a fresh test user instance"""
    return User(
        id="test123",
        email="test@example.com",
        name="Test User",
        picture="http://example.com/pic.jpg"
    )

def override_get_db():
    """Override database dependency"""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

async def override_get_current_user():
    """Override authentication dependency"""
    return create_test_user()

# Override dependencies
app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_current_user] = override_get_current_user

@pytest.fixture
def client() -> Generator:
    """
    Test client fixture that sets up a fresh database for each test.
    Creates a test user and conversation, then cleans up afterward.
    """
    # Create test database tables
    Base.metadata.create_all(bind=engine)
    
    # Create test user and conversation in database
    db = TestingSessionLocal()
    test_user = create_test_user()
    db.add(test_user)
    
    test_conversation = Conversation(
        title="Test Conversation",
        user_id=test_user.id,
        is_active=True,
        is_new=False
    )
    db.add(test_conversation)
    db.commit()
    db.refresh(test_conversation)
    
    with TestClient(app) as test_client:
        yield test_client
    
    # Clean up - drop test database
    db.close()
    Base.metadata.drop_all(bind=engine)

def test_create_new_conversation(client):
    """Test creating a new conversation"""
    response = client.post("/api/messages/new-conversation")
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "New Conversation"
    assert data["is_new"] is True
    assert data["is_active"] is True

def test_send_message(client):
    """Test sending a message in a conversation"""
    # First get existing conversation
    conv_response = client.get("/api/messages/conversations")
    assert conv_response.status_code == 200
    conversations = conv_response.json()
    assert len(conversations) > 0
    
    conversation_id = conversations[0]["id"]
    
    # Send a message
    response = client.post("/api/messages/stream", 
        json={
            "content": "Hello, bot!",
            "conversation_id": conversation_id
        }
    )
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/event-stream")

def test_edit_message(client):
    """Test editing a user message"""
    # Create a conversation and message first
    conv_response = client.post("/api/messages/new-conversation")
    conversation_id = conv_response.json()["id"]
    
    # Send initial message
    stream_response = client.post("/api/messages/stream",
        json={
            "content": "Original message",
            "conversation_id": conversation_id
        }
    )
    assert stream_response.status_code == 200
    
    # Get conversation to find message ID
    conv_details = client.get(f"/api/messages/conversations/{conversation_id}")
    assert conv_details.status_code == 200
    messages = conv_details.json()["messages"]
    user_message = next(m for m in messages if m["sender"] == "user")
    
    # Edit the message
    edit_response = client.put(
        f"/api/messages/{user_message['id']}",
        json={"content": "Updated message"}
    )
    assert edit_response.status_code == 200
    assert edit_response.json()["content"] == "Updated message"
    assert edit_response.json()["is_edited"] is True

def test_delete_message(client):
    """Test deleting a user message"""
    # Create a conversation and message first
    conv_response = client.post("/api/messages/new-conversation")
    conversation_id = conv_response.json()["id"]
    
    # Send a message
    stream_response = client.post("/api/messages/stream",
        json={
            "content": "Message to delete",
            "conversation_id": conversation_id
        }
    )
    assert stream_response.status_code == 200
    
    # Get conversation to find message ID
    conv_details = client.get(f"/api/messages/conversations/{conversation_id}")
    messages = conv_details.json()["messages"]
    user_message = next(m for m in messages if m["sender"] == "user")
    
    # Delete the message
    delete_response = client.delete(f"/api/messages/{user_message['id']}")
    assert delete_response.status_code == 200

def test_cannot_edit_bot_message(client):
    """Test that bot messages cannot be edited"""
    # Create a conversation and get bot response
    conv_response = client.post("/api/messages/new-conversation")
    conversation_id = conv_response.json()["id"]
    
    # Send a message to get bot response
    stream_response = client.post("/api/messages/stream",
        json={
            "content": "Hello bot",
            "conversation_id": conversation_id
        }
    )
    assert stream_response.status_code == 200
    
    # Get conversation to find bot message
    conv_details = client.get(f"/api/messages/conversations/{conversation_id}")
    messages = conv_details.json()["messages"]
    bot_message = next(m for m in messages if m["sender"] == "bot")
    
    # Try to edit bot message - should fail
    edit_response = client.put(
        f"/api/messages/{bot_message['id']}",
        json={"content": "Trying to hack the bot"}
    )
    assert edit_response.status_code == 400

def test_delete_conversation(client):
    """Test deleting an entire conversation"""
    # Create a new conversation
    conv_response = client.post("/api/messages/new-conversation")
    conversation_id = conv_response.json()["id"]
    
    # Delete the conversation
    delete_response = client.delete(f"/api/messages/conversations/{conversation_id}")
    assert delete_response.status_code == 200
    
    # Verify it's gone
    conversations = client.get("/api/messages/conversations")
    assert not any(c["id"] == conversation_id for c in conversations.json())