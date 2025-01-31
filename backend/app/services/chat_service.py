from openai import OpenAI
import os
from typing import List, Dict
from fastapi.responses import StreamingResponse
from ..models.database_models import Message as MessageModel, Conversation as ConversationModel, User as UserModel
import json
import asyncio

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
)

class ChatService:
    def __init__(self):
        self.assistant_id = os.getenv("OPENAI_ASSISTANT_ID")
        if not self.assistant_id:
            assistant = client.beta.assistants.create(
                name="Restaurant Assistant",
                instructions="""You are Chef Ava, a helpful restaurant assistant. Help users find restaurants and answer questions about food and dining.
                When users ask about specific restaurants or cuisines, use the search_restaurants function to find relevant options.
                
                Important notes about restaurant search functionality:
                - The search_restaurants function will display restaurant cards in the chat interface automatically
                - Each restaurant card shows the name, rating, reviews, photos, price level, hours, and location
                - Users can click on restaurant cards to visit their Yelp pages
                - No need to describe restaurant details that are already visible in the cards
                - Focus on providing context, recommendations, and insights about the restaurants shown
                
                Guidelines for restaurant searches:
                - Use between 1-5 results (k parameter) depending on how many restaurants you assume the user wants to see.
                - Always include relevant search parameters like cuisine, price range, etc.
                - Location can be specified by city or address
                
                Remember to:
                - Maintain a natural conversation while leveraging the visual restaurant cards
                - Refer to people by first name only
                - Provide thoughtful recommendations and local insights
                - Keep responses focused and concise since details are in the cards""",
                tools=[{
                    "type": "function",
                    "function": {
                        "name": "search_restaurants",
                        "description": "Search for restaurants and display the results as cards in chat",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "term": {
                                    "type": "string",
                                    "description": "Search term for Yelp search bar (e.g. cuisine type, restaurant name, etc)"
                                },
                                "location": {
                                    "type": "string",
                                    "description": "Location to search in (city, address, etc) - Cannot be just a country name, needs to be a city or address"
                                },
                                "price": {
                                    "type": "string",
                                    "description": "Price level (1-4 dollar signs)",
                                    "enum": ["$", "$$", "$$$", "$$$$"]
                                },
                                "k": {
                                    "type": "integer",
                                    "description": "Number of results to show (1-5)",
                                    "minimum": 1,
                                    "maximum": 5
                                },
                                "sort_by": {
                                    "type": "string",
                                    "description": "How to sort search results (always use best_match, unless the user explicitly asks to sort by distance/rating/review_count, like: give me the 3 closes restaurants to my address here, but if they say give me the 3 best restaurants, always use best_match).",
                                    "enum": ["best_match", "review_count", "distance"]
                                }
                            },
                            "required": ["term", "k"]
                        }
                    }
                }],
                model="gpt-4o"
            )
            self.assistant_id = assistant.id
            print(f"Created new assistant with ID: {self.assistant_id}")

    async def get_streaming_response(self, conversation_id: int, thread_id: str, message: str, db=None) -> StreamingResponse:
        try:
            if not thread_id:
                thread = client.beta.threads.create()
                thread_id = thread.id
                
                if db:
                    conversation = db.query(ConversationModel).filter_by(id=conversation_id).first()
                    if conversation:
                        conversation.thread_id = thread_id
                        user = db.query(UserModel).filter_by(id=conversation.user_id).first()
                        if user:
                            client.beta.threads.messages.create(
                                thread_id=thread_id,
                                role="user",
                                content=f"Hello! Just so you know, my name from my Google account is: {user.name}. Please use my name occasionally in our conversation to make it more personal."
                            )
                        db.commit()

            # Add the user's message to thread
            client.beta.threads.messages.create(
                thread_id=thread_id,
                role="user",
                content=message
            )

            # Run the assistant
            run = client.beta.threads.runs.create(
                thread_id=thread_id,
                assistant_id=self.assistant_id
            )

            async def generate():
                accumulated_content = []
                restaurant_search_data = None
                try:
                    while True:
                        run_status = client.beta.threads.runs.retrieve(
                            thread_id=thread_id,
                            run_id=run.id
                        )

                        if run_status.status == 'requires_action':
                            for action in run_status.required_action.submit_tool_outputs.tool_calls:
                                if action.function.name == 'search_restaurants':
                                    try:
                                        params = json.loads(action.function.arguments)
                                        print(f"Restaurant search params: {params}")  # Debug log
                                        restaurant_search_data = params
                                        yield f"data: {json.dumps({'restaurant_search': params})}\n\n"
                                        
                                        # Submit empty result since we're handling display client-side
                                        client.beta.threads.runs.submit_tool_outputs(
                                            thread_id=thread_id,
                                            run_id=run.id,
                                            tool_outputs=[{
                                                "tool_call_id": action.id,
                                                "output": json.dumps({"status": "success"})
                                            }]
                                        )
                                    except json.JSONDecodeError:
                                        print(f"Error parsing function arguments: {action.function.arguments}")
                            continue

                        if run_status.status == 'completed':
                            messages = client.beta.threads.messages.list(thread_id=thread_id)
                            latest_message = messages.data[0]
                            
                            for content_item in latest_message.content:
                                if hasattr(content_item, 'text'):
                                    content = content_item.text.value
                                    words = content.split(' ')
                                    for word in words:
                                        accumulated_content.append(word + ' ')
                                        yield f"data: {json.dumps({'content': word + ' '})}\n\n"
                                        await asyncio.sleep(0.05)
                            
                            if db:
                                bot_message = (
                                    db.query(MessageModel)
                                    .filter_by(conversation_id=conversation_id)
                                    .order_by(MessageModel.timestamp.desc())
                                    .first()
                                )
                                if bot_message and bot_message.sender == 'bot':
                                    print(f"Saving message content: {accumulated_content}")  # Debug log
                                    print(f"Saving restaurant search data: {restaurant_search_data}")  # Debug log
                                    bot_message.content = ''.join(accumulated_content).strip()
                                    bot_message.save_restaurant_search(restaurant_search_data)
                                    db.commit()
                                    
                                    # Verify save
                                    db.refresh(bot_message)
                                    loaded_data = bot_message.load_restaurant_search()
                                    print(f"Verified saved restaurant search data: {loaded_data}")  # Debug log
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