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

@router.get("/conversations/{conversation_id}")
async def get_conversation(
    conversation_id: int,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
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
    
    # Simply convert messages to dict, treating restaurant_search just like any other field
    messages = [{
        "id": msg.id,
        "content": msg.content,
        "sender": msg.sender,
        "timestamp": msg.timestamp,
        "is_edited": msg.is_edited,
        "conversation_id": msg.conversation_id,
        "restaurant_search": msg.load_restaurant_search()  # Simple load
    } for msg in conversation.messages]
    
    return {
        "id": conversation.id,
        "title": conversation.title,
        "created_at": conversation.created_at,
        "updated_at": conversation.updated_at,
        "is_active": conversation.is_active,
        "is_new": conversation.is_new,
        "user_id": conversation.user_id,
        "messages": messages
    }

@router.get("/conversations")
async def get_conversations(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all conversations for the user"""
    print("\n=== LOADING ALL CONVERSATIONS ===")
    
    conversations = (
        db.query(ConversationModel)
        .filter(ConversationModel.user_id == current_user.id)
        .order_by(ConversationModel.created_at.desc())
        .all()
    )
    
    result = []
    for conv in conversations:
        messages = []
        for msg in conv.messages:
            # Print raw data for debugging
            print(f"\nMessage {msg.id}:")
            print(f"Content type: {msg.sender}")
            print(f"Raw restaurant_search: {msg.restaurant_search}")
            
            message_dict = {
                "id": msg.id,
                "content": msg.content,
                "sender": msg.sender,
                "timestamp": msg.timestamp,
                "is_edited": msg.is_edited,
                "conversation_id": msg.conversation_id,
                "restaurant_search": msg.load_restaurant_search()
            }
            
            # Print processed data
            print(f"Processed restaurant_search: {message_dict['restaurant_search']}")
            messages.append(message_dict)
            
        conv_dict = {
            "id": conv.id,
            "title": conv.title,
            "created_at": conv.created_at,
            "updated_at": conv.updated_at,
            "is_active": conv.is_active,
            "is_new": conv.is_new,
            "user_id": conv.user_id,
            "messages": messages
        }
        result.append(conv_dict)
    
    return result


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

        # First check for any existing new conversations
        existing_new = db.query(ConversationModel)\
            .filter(
                ConversationModel.user_id == current_user.id,
                ConversationModel.is_new == True
            )\
            .first()

        if existing_new:
            print(f"Found existing new conversation: {existing_new.id}. Redirecting there.")
            # Deactivate all other conversations
            db.query(ConversationModel)\
                .filter(
                    ConversationModel.user_id == current_user.id,
                    ConversationModel.is_active == True
                )\
                .update({ConversationModel.is_active: False}, synchronize_session='fetch')
            
            # Activate the existing new conversation
            existing_new.is_active = True
            db.commit()

            return {
                "id": existing_new.id,
                "title": existing_new.title,
                "created_at": existing_new.created_at.isoformat(),
                "is_active": True,
                "is_new": True,
                "messages": []
            }

        print("No existing new conversation found. Creating new one.")

        # Deactivate all existing conversations
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

        return {
            "id": new_conversation.id,
            "title": new_conversation.title,
            "is_new": new_conversation.is_new,
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
                "is_new": conversation.is_new,
                "is_active": True
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

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
        print(f"\n=== STREAM START ===")
        conversation_update = None
        
        # Get conversation first
        conversation = (
            db.query(ConversationModel)
            .filter(
                ConversationModel.id == message.conversation_id,
                ConversationModel.user_id == current_user.id
            )
            .first()
        )
                
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        # Store necessary values
        conversation_id = conversation.id
        thread_id = conversation.thread_id
        
        print(f"Processing message for conversation {conversation_id}")
        
        # Create user message
        db_message = MessageModel(
            content=message.content,
            sender="user",
            conversation_id=conversation_id
        )
        db.add(db_message)
        
        # Create bot message placeholder
        bot_message = MessageModel(
            content="",
            sender="bot",
            conversation_id=conversation_id,
            restaurant_search=None
        )
        db.add(bot_message)  # Fixed: was adding db_message twice
        
        # If this is a new conversation, update its title immediately
        if conversation.is_new:
            # Find the highest conversation number
            existing_numbers = []
            all_conversations = db.query(ConversationModel)\
                .filter(
                    ConversationModel.user_id == current_user.id,
                    ConversationModel.is_new == False
                )\
                .all()
            
            for conv in all_conversations:
                if conv.title.startswith("Conversation "):
                    try:
                        num = int(conv.title.split(" ")[1])
                        existing_numbers.append(num)
                    except (ValueError, IndexError):
                        continue
            
            # Use the next available number
            next_number = 1
            if existing_numbers:
                next_number = max(existing_numbers) + 1
            
            # Update conversation
            new_title = f"Conversation {next_number}"
            conversation.title = new_title
            conversation.is_new = False
            conversation_update = {
                'id': conversation_id,
                'title': new_title,
                'is_new': False
            }
        
        # Commit all changes before proceeding
        db.commit()
        db.refresh(db_message)
        db.refresh(bot_message)
        db.refresh(conversation)
        
        user_msg_id = db_message.id
        bot_msg_id = bot_message.id
        
        print(f"Created messages - User: {user_msg_id}, Bot: {bot_msg_id}")

        async def generate():
            nonlocal conversation_update
            try:
                # Send initial IDs
                yield f"data: {json.dumps({'user_message_id': user_msg_id})}\n\n"
                yield f"data: {json.dumps({'bot_message_id': bot_msg_id})}\n\n"
                
                # Send conversation update immediately if needed
                if conversation_update:
                    yield f"data: {json.dumps({'conversation_update': conversation_update})}\n\n"
                
                restaurant_search_data = None
                accumulated_content = []
                
                # Get the streaming response object
                response = await chat_service.get_streaming_response(
                    conversation_id=conversation_id,
                    thread_id=thread_id,
                    message=message.content,
                    db=db
                )
                
                # Process the response stream
                async for chunk in response.body_iterator:
                    if isinstance(chunk, bytes):
                        chunk = chunk.decode()
                        
                    if chunk.startswith('data: '):
                        try:
                            data = json.loads(chunk[6:])
                            
                            # Handle restaurant search
                            if 'restaurant_search' in data:
                                restaurant_search_data = data['restaurant_search']
                                print(f"\n=== SAVING RESTAURANT SEARCH ===")
                                print(f"Data: {restaurant_search_data}")
                                
                                with SessionLocal() as update_db:
                                    bot_msg = update_db.query(MessageModel).get(bot_msg_id)
                                    if bot_msg:
                                        bot_msg.save_restaurant_search(restaurant_search_data)
                                        update_db.commit()
                                
                                yield chunk

                            # Handle content
                            if 'content' in data:
                                accumulated_content.append(data['content'])
                                yield chunk

                        except json.JSONDecodeError as e:
                            print(f"Error decoding chunk: {e}")
                            
                    else:
                        yield chunk

                    if chunk.startswith('data: [DONE]'):
                        with SessionLocal() as final_db:
                            bot_msg = final_db.query(MessageModel).get(bot_msg_id)
                            if bot_msg:
                                if accumulated_content:
                                    bot_msg.content = ''.join(accumulated_content).strip()
                                if restaurant_search_data:
                                    bot_msg.save_restaurant_search(restaurant_search_data)
                                final_db.commit()
                                
                                # Final verification
                                final_db.refresh(bot_msg)
                                print(f"\n=== FINAL MESSAGE STATE ===")
                                print(f"Content length: {len(bot_msg.content)}")
                                print(f"Restaurant search data: {bot_msg.restaurant_search}")
                
                yield "data: [DONE]\n\n"

            except Exception as e:
                print(f"Stream error: {e}")
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
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