from openai import OpenAI
import os
from typing import List, Dict
from fastapi.responses import StreamingResponse
from ..models.database_models import Message as MessageModel, Conversation as ConversationModel
import json
import asyncio

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
)

class ChatService:
    def __init__(self):
        # Initialize assistant_id, either load from env or create new
        self.assistant_id = os.getenv("OPENAI_ASSISTANT_ID")
        if not self.assistant_id:
            # Create new assistant if no ID is stored
            assistant = client.beta.assistants.create(
                name="Restaurant Assistant",
                instructions="""You are a helpful restaurant assistant. 
                Help users find restaurants and answer questions about food and dining.
                When users ask about specific restaurants or cuisines, use the search_restaurants function to find relevant options.
                Always provide thoughtful and detailed responses about restaurants, dining experiences, and cuisine.
                Also maintain conversation context and refer to previous messages when appropriate.""",
                tools=[{
                    "type": "function",
                    "function": {
                        "name": "search_restaurants",
                        "description": "Search for restaurants based on criteria",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "query": {
                                    "type": "string",
                                    "description": "Search query for restaurant name or cuisine"
                                },
                                "cuisine": {
                                    "type": "string",
                                    "description": "Type of cuisine"
                                },
                                "price_range": {
                                    "type": "string",
                                    "description": "Price range ($, $$, $$$, $$$$)"
                                },
                                "min_rating": {
                                    "type": "number",
                                    "description": "Minimum rating (1-5)"
                                }
                            },
                            "required": ["query"]
                        }
                    }
                }],
                model="gpt-4o"
            )
            self.assistant_id = assistant.id
            # Optionally save the assistant ID to env or config
            print(f"Created new assistant with ID: {self.assistant_id}")

    async def get_streaming_response(self, conversation_id: int, thread_id: str, message: str, db=None) -> StreamingResponse:
        try:
            if not thread_id:
                # Create new thread if none exists
                thread = client.beta.threads.create()
                thread_id = thread.id
                
                # Update conversation with thread_id
                if db:
                    conversation = db.query(ConversationModel).filter_by(id=conversation_id).first()
                    if conversation:
                        conversation.thread_id = thread_id
                        db.commit()

            # Add message to thread
            client.beta.threads.messages.create(
                thread_id=thread_id,
                role="user",
                content=message
            )

            # Run the assistant using the stored assistant_id
            run = client.beta.threads.runs.create(
                thread_id=thread_id,
                assistant_id=self.assistant_id
            )

            async def generate():
                accumulated_content = []
                try:
                    while True:
                        run_status = client.beta.threads.runs.retrieve(
                            thread_id=thread_id,
                            run_id=run.id
                        )

                        if run_status.status == 'completed':
                            # Get the assistant's response
                            messages = client.beta.threads.messages.list(thread_id=thread_id)
                            latest_message = messages.data[0]
                            content = latest_message.content[0].text.value

                            # Stream the content word by word
                            words = content.split(' ')
                            for word in words:
                                accumulated_content.append(word + ' ')
                                yield f"data: {json.dumps({'content': word + ' '})}\n\n"
                                await asyncio.sleep(0.05)
                            
                            # Update the bot message in the database
                            if db:
                                bot_message = (
                                    db.query(MessageModel)
                                    .filter_by(conversation_id=conversation_id)
                                    .order_by(MessageModel.timestamp.desc())
                                    .first()
                                )
                                if bot_message and bot_message.sender == 'bot':
                                    bot_message.content = ''.join(accumulated_content).strip()
                                    db.commit()
                            break

                        elif run_status.status in ['failed', 'cancelled', 'expired']:
                            error_msg = "I apologize, but I had trouble processing your request."
                            yield f"data: {json.dumps({'content': error_msg})}\n\n"
                            break

                        await asyncio.sleep(0.1)

                    yield "data: [DONE]\n\n"

                except Exception as e:
                    print(f"Error in stream generation: {e}")
                    error_msg = "I apologize, but I'm having trouble processing your request right now."
                    yield f"data: {json.dumps({'content': error_msg})}\n\n"
                    yield "data: [DONE]\n\n"

            return StreamingResponse(
                generate(),
                media_type="text/event-stream"
            )

        except Exception as e:
            print(f"Error in response generation: {e}")
            async def error_stream():
                error_msg = "An error occurred while processing your request."
                yield f"data: {json.dumps({'content': error_msg})}\n\n"
                yield "data: [DONE]\n\n"
            return StreamingResponse(error_stream(), media_type="text/event-stream")