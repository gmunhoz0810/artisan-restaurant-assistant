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
    return (
        db.query(ConversationModel)
        .filter(ConversationModel.user_id == current_user.id)
        .order_by(ConversationModel.created_at.desc())
        .all()
    )

@router.post("/new-conversation")
async def create_new_conversation(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new conversation"""
    try:
        # Set all user's conversations to inactive
        db.query(ConversationModel)\
          .filter(
              ConversationModel.user_id == current_user.id,
              ConversationModel.is_active == True
          )\
          .update({ConversationModel.is_active: False})

        # Get next conversation number for this user
        max_number = db.query(
            func.max(
                cast(
                    func.substr(ConversationModel.title, 13),
                    Integer
                )
            )
        ).filter(ConversationModel.user_id == current_user.id).scalar() or 0

        # Create new conversation
        new_conversation = ConversationModel(
            title=f"Conversation {max_number + 1}",
            is_active=True,
            user_id=current_user.id
        )
        db.add(new_conversation)
        db.commit()
        db.refresh(new_conversation)

        return {
            "status": "success",
            "id": new_conversation.id,
            "title": new_conversation.title
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
        
        return {"status": "success"}
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

@router.get("/", response_model=List[MessageSchema])
async def get_messages(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get messages for the active conversation"""
    conversation = (
        db.query(ConversationModel)
        .filter(
            ConversationModel.user_id == current_user.id,
            ConversationModel.is_active == True
        )
        .first()
    )
    
    if not conversation:
        # Create initial conversation if none exists
        conversation = ConversationModel(
            title="Conversation 1",
            is_active=True,
            user_id=current_user.id
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
    
    messages = (
        db.query(MessageModel)
        .filter(MessageModel.conversation_id == conversation.id)
        .order_by(MessageModel.timestamp.asc())
        .all()
    )
    return messages

@router.post("/stream")
async def create_streaming_message(
    message: MessageCreate,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Verify conversation belongs to user
        with SessionLocal() as temp_db:
            conversation = temp_db.query(ConversationModel)\
                .filter(
                    ConversationModel.id == message.conversation_id,
                    ConversationModel.user_id == current_user.id
                )\
                .first()
                
            if not conversation:
                raise HTTPException(status_code=404, detail="Conversation not found")
            
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
                content="",  # Empty content initially
                sender="bot",
                conversation_id=conv_id
            )
            temp_db.add(bot_message)
            temp_db.commit()
            temp_db.refresh(db_message)
            temp_db.refresh(bot_message)
            
            user_msg_id = db_message.id
            bot_msg_id = bot_message.id

        async def process_stream():
            try:
                # Send initial IDs
                yield f"data: {json.dumps({'user_message_id': user_msg_id})}\n\n"
                yield f"data: {json.dumps({'bot_message_id': bot_msg_id})}\n\n"

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
                    
                    # Pass through the chunk
                    yield chunk
                    
                    if chunk.startswith('data: [DONE]'):
                        # Final update of the bot message
                        with SessionLocal() as final_db:
                            bot_message = final_db.query(MessageModel).get(bot_msg_id)
                            if bot_message:
                                bot_message.content = ''.join(accumulated_content).strip()
                                final_db.commit()

            except Exception as e:
                print(f"Stream error: {e}")
                yield f"data: {json.dumps({'error': 'Stream failed'})}\n\n"
            finally:
                if not chunk.startswith('data: [DONE]'):
                    yield "data: [DONE]\n\n"

        return StreamingResponse(process_stream(), media_type="text/event-stream")

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