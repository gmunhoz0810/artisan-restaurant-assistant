import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.database import Base, get_db

# Use an in-memory SQLite database for testing
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

# Override the database dependency
app.dependency_overrides[get_db] = override_get_db

@pytest.fixture
def client():
    # Create test database tables
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as test_client:
        yield test_client
    # Clean up after tests
    Base.metadata.drop_all(bind=engine)

def test_create_message(client):
    # Test creating a user message
    response = client.post(
        "/api/messages/",
        json={"content": "Hello, bot!"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["content"] == "Hello, bot!"
    assert data["sender"] == "user"
    assert not data["is_edited"]

def test_get_messages(client):
    # Create a test message first
    client.post("/api/messages/", json={"content": "Test message"})
    
    # Test getting all messages
    response = client.get("/api/messages/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert data[0]["content"] == "Test message"

def test_update_message(client):
    # Create a message first
    create_response = client.post(
        "/api/messages/",
        json={"content": "Original message"}
    )
    message_id = create_response.json()["id"]
    
    # Test updating the message
    update_response = client.put(
        f"/api/messages/{message_id}",
        json={"content": "Updated message"}
    )
    assert update_response.status_code == 200
    data = update_response.json()
    assert data["content"] == "Updated message"
    assert data["is_edited"]

def test_delete_message(client):
    # Create a message first
    create_response = client.post(
        "/api/messages/",
        json={"content": "Message to delete"}
    )
    message_id = create_response.json()["id"]
    
    # Test deleting the message
    delete_response = client.delete(f"/api/messages/{message_id}")
    assert delete_response.status_code == 200
    
    # Verify message is deleted
    get_response = client.get("/api/messages/")
    messages = get_response.json()
    assert not any(msg["id"] == message_id for msg in messages)

def test_cannot_edit_bot_message(client):
    # Create a message to get a bot response
    create_response = client.post(
        "/api/messages/",
        json={"content": "Hello"}
    )
    # Bot message will be the second message
    messages = client.get("/api/messages/").json()
    bot_message_id = messages[1]["id"]
    
    # Try to edit bot message
    update_response = client.put(
        f"/api/messages/{bot_message_id}",
        json={"content": "Trying to hack the bot"}
    )
    assert update_response.status_code == 400

def test_cannot_delete_bot_message(client):
    # Create a message to get a bot response
    create_response = client.post(
        "/api/messages/",
        json={"content": "Hello"}
    )
    # Bot message will be the second message
    messages = client.get("/api/messages/").json()
    bot_message_id = messages[1]["id"]
    
    # Try to delete bot message
    delete_response = client.delete(f"/api/messages/{bot_message_id}")
    assert delete_response.status_code == 400

def test_update_nonexistent_message(client):
    response = client.put(
        "/api/messages/999",
        json={"content": "Update nonexistent"}
    )
    assert response.status_code == 404

def test_delete_nonexistent_message(client):
    response = client.delete("/api/messages/999")
    assert response.status_code == 404