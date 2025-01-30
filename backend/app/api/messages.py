from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, Integer, cast
from typing import List, Optional
from ..models.message import (
    Message as MessageSchema,
    MessageCreate, 
    MessageUpdate,
    ConversationCreate,
    ConversationWithMessages
)
from ..models.database_models import Message as MessageModel, Conversation as ConversationModel, User as UserModel
from ..core.database import get_db, SessionLocal
from ..services.chat_service import ChatService
from ..auth.oauth import get_current_user

import json

router = APIRouter()
chat_service = ChatService()

@router.get("/conversations", response_model=List[ConversationWithMessages])
async def get_conversations(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all conversations for current user"""
    conversations = (
        db.query(ConversationModel)
        .filter(ConversationModel.user_id == current_user.id)
        .order_by(ConversationModel.created_at.desc())
        .all()
    )
    
    print("\n=== GET CONVERSATIONS ===")
    for conv in conversations:
        print(f"Conversation {conv.id}: title='{conv.title}', is_new={conv.is_new}, is_active={conv.is_active}")
        message_count = db.query(MessageModel).filter(MessageModel.conversation_id == conv.id).count()
        print(f"  Message count: {message_count}")
    
    # Explicitly include is_new in the response for each conversation
    return [
        {
            "id": conv.id,
            "title": conv.title,
            "created_at": conv.created_at,
            "updated_at": conv.updated_at,
            "is_active": conv.is_active,
            "is_new": conv.is_new,  # Explicitly include is_new
            "user_id": conv.user_id,
            "messages": conv.messages
        }
        for conv in conversations
    ]

@router.post("/new-conversation")
async def create_new_conversation(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new conversation"""
    try:
        print("\n=== BEFORE NEW CONVERSATION ===")
        existing_convs = db.query(ConversationModel).filter(ConversationModel.user_id == current_user.id).all()
        for conv in existing_convs:
            print(f"Existing conversation {conv.id}: is_new={conv.is_new}, is_active={conv.is_active}")

        # Only update is_active flag
        db.query(ConversationModel)\
          .filter(
              ConversationModel.user_id == current_user.id,
              ConversationModel.is_active == True
          )\
          .update({ConversationModel.is_active: False}, synchronize_session='fetch')

        # Create new conversation
        new_conversation = ConversationModel(
            title="New Conversation",
            is_active=True,
            is_new=True,
            user_id=current_user.id
        )
        db.add(new_conversation)
        db.commit()
        db.refresh(new_conversation)

        print("\n=== AFTER NEW CONVERSATION ===")
        all_convs = db.query(ConversationModel).filter(ConversationModel.user_id == current_user.id).all()
        for conv in all_convs:
            print(f"Conversation {conv.id}: is_new={conv.is_new}, is_active={conv.is_active}")

        # Return full conversation data
        return {
            "id": new_conversation.id,
            "title": new_conversation.title,
            "is_new": new_conversation.is_new,  # Explicitly include is_new
            "is_active": new_conversation.is_active,
            "created_at": new_conversation.created_at.isoformat(),
            "messages": []
        }

    except Exception as e:
        db.rollback()
        print(f"Error creating conversation: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create conversation: {str(e)}"
        )

@router.post("/conversations/{conversation_id}/activate")
async def activate_conversation(
    conversation_id: int,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Set a conversation as active and deactivate others"""
    try:
        # Verify conversation belongs to user
        conversation = db.query(ConversationModel)\
                        .filter(
                            ConversationModel.id == conversation_id,
                            ConversationModel.user_id == current_user.id
                        )\
                        .first()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")

        # Deactivate all user's conversations
        db.query(ConversationModel)\
          .filter(
              ConversationModel.user_id == current_user.id,
              ConversationModel.is_active == True
          )\
          .update({ConversationModel.is_active: False})
        
        # Activate the selected conversation
        conversation.is_active = True
        db.commit()
        
        return {
            "status": "success",
            "conversation": {
                "id": conversation.id,
                "is_new": conversation.is_new,  # Include is_new in response
                "is_active": True
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/conversations/{conversation_id}", response_model=ConversationWithMessages)
async def get_conversation(
    conversation_id: int,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific conversation and its messages"""
    conversation = (
        db.query(ConversationModel)
        .filter(
            ConversationModel.id == conversation_id,
            ConversationModel.user_id == current_user.id
        )
        .first()
    )
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    print(f"\n=== GET CONVERSATION {conversation_id} ===")
    print(f"State: is_new={conversation.is_new}, title='{conversation.title}'")
    
    # Return with explicit is_new flag
    return {
        "id": conversation.id,
        "title": conversation.title,
        "created_at": conversation.created_at,
        "updated_at": conversation.updated_at,
        "is_active": conversation.is_active,
        "is_new": conversation.is_new,  # Explicitly include is_new
        "user_id": conversation.user_id,
        "messages": conversation.messages
    }

@router.get("/conversations/{conversation_id}", response_model=ConversationWithMessages)
async def get_conversation(
    conversation_id: int,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific conversation and its messages"""
    conversation = (
        db.query(ConversationModel)
        .filter(
            ConversationModel.id == conversation_id,
            ConversationModel.user_id == current_user.id
        )
        .first()
    )
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    print(f"\n=== GET CONVERSATION {conversation_id} ===")
    print(f"State: is_new={conversation.is_new}, title='{conversation.title}'")
    
    return conversation

@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: int,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a conversation and all its messages"""
    conversation = (
        db.query(ConversationModel)
        .filter(
            ConversationModel.id == conversation_id,
            ConversationModel.user_id == current_user.id
        )
        .first()
    )
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    db.delete(conversation)
    db.commit()
    return {"status": "success"}

@router.post("/stream")
async def create_streaming_message(
    message: MessageCreate,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Stream message responses"""
    try:
        conversation = None
        user_msg_id = None
        bot_msg_id = None
        conv_id = None
        thread_id = None
        conversation_updated = False
        final_update_data = None

        with SessionLocal() as temp_db:
            conversation = temp_db.query(ConversationModel)\
                .filter(
                    ConversationModel.id == message.conversation_id,
                    ConversationModel.user_id == current_user.id
                )\
                .first()
                
            if not conversation:
                raise HTTPException(status_code=404, detail="Conversation not found")
            
            print(f"\n=== STREAM START ===")
            print(f"Processing message for conversation {conversation.id}")
            print(f"Before update: is_new={conversation.is_new}, title='{conversation.title}'")
            
            # If this is a new conversation, update its title
            if conversation.is_new:
                # Get count of all conversations that were ever used
                existing_conversations = temp_db.query(ConversationModel)\
                    .filter(
                        ConversationModel.user_id == current_user.id,
                        ConversationModel.is_new == False
                    )\
                    .count()
                
                # Update current conversation
                new_title = f"Conversation {existing_conversations + 1}"
                conversation.title = new_title
                conversation.is_new = False
                temp_db.commit()
                temp_db.refresh(conversation)
                conversation_updated = True
                final_update_data = {
                    'id': conversation.id,
                    'title': conversation.title,
                    'is_new': False
                }
                print(f"After update: is_new={conversation.is_new}, title='{conversation.title}'")
            
            # Store critical values
            conv_id = conversation.id
            thread_id = conversation.thread_id
            
            # Create user message
            db_message = MessageModel(
                content=message.content,
                sender="user",
                conversation_id=conv_id
            )
            temp_db.add(db_message)
            
            # Create bot message placeholder
            bot_message = MessageModel(
                content="",
                sender="bot",
                conversation_id=conv_id
            )
            temp_db.add(bot_message)
            temp_db.commit()
            temp_db.refresh(db_message)
            temp_db.refresh(bot_message)
            
            user_msg_id = db_message.id
            bot_msg_id = bot_message.id

        # Create the streaming response
        async def generate():
            chunk = None
            try:
                # Send initial IDs
                yield f"data: {json.dumps({'user_message_id': user_msg_id})}\n\n"
                yield f"data: {json.dumps({'bot_message_id': bot_msg_id})}\n\n"
                
                # If conversation was updated, send that info immediately
                if conversation_updated and final_update_data:
                    yield f"data: {json.dumps({'conversation_update': final_update_data})}\n\n"

                # Get streaming response
                response = await chat_service.get_streaming_response(
                    conversation_id=conv_id,
                    thread_id=thread_id,
                    message=message.content,
                    db=db
                )

                accumulated_content = []
                async for chunk in response.body_iterator:
                    if chunk.startswith('data: '):
                        try:
                            data = json.loads(chunk[6:])
                            if 'content' in data:
                                accumulated_content.append(data['content'])
                        except json.JSONDecodeError:
                            pass
                    
                    yield chunk
                    
                    if chunk.startswith('data: [DONE]'):
                        with SessionLocal() as final_db:
                            bot_message = final_db.query(MessageModel).get(bot_msg_id)
                            if bot_message:
                                bot_message.content = ''.join(accumulated_content).strip()
                                final_db.commit()

            except Exception as e:
                print(f"Stream error: {e}")
                yield f"data: {json.dumps({'error': 'Stream failed'})}\n\n"
                yield "data: [DONE]\n\n"
            finally:
                if chunk is None or not chunk.startswith('data: [DONE]'):
                    yield "data: [DONE]\n\n"

        return StreamingResponse(generate(), media_type="text/event-stream")

    except Exception as e:
        print(f"Endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{message_id}", response_model=MessageSchema)
async def update_message(
    message_id: int,
    message: MessageUpdate,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a message"""
    # First get the message and verify it belongs to the user
    db_message = db.query(MessageModel)\
        .join(ConversationModel)\
        .filter(
            MessageModel.id == message_id,
            ConversationModel.user_id == current_user.id
        )\
        .first()

    if db_message is None:
        raise HTTPException(status_code=404, detail="Message not found")
    if db_message.sender != "user":
        raise HTTPException(status_code=400, detail="Can only edit user messages")
    
    db_message.content = message.content
    db_message.is_edited = True
    db.commit()
    db.refresh(db_message)
    return db_message

@router.delete("/{message_id}")
async def delete_message(
    message_id: int,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a message"""
    # First get the message and verify it belongs to the user
    db_message = db.query(MessageModel)\
        .join(ConversationModel)\
        .filter(
            MessageModel.id == message_id,
            ConversationModel.user_id == current_user.id
        )\
        .first()

    if db_message is None:
        raise HTTPException(status_code=404, detail="Message not found")
    if db_message.sender != "user":
        raise HTTPException(status_code=400, detail="Can only delete user messages")
    
    db.delete(db_message)
    db.commit()
    return {"status": "success"}