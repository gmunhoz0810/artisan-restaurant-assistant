# backend/app/services/chat_service.py
from openai import OpenAI
from fastapi import WebSocket
import os
from typing import List, Dict
from fastapi.responses import StreamingResponse
import json
import asyncio

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
)

class ChatService:
    def __init__(self):
        # mock search restaurants function
        self.tools = [{
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
        }]

    async def get_streaming_response(self, messages: List[Dict[str, str]]):
        try:
            if not messages or messages[0]["role"] != "system":
                messages.insert(0, {
                    "role": "system",
                    "content": """You are a helpful restaurant assistant. 
                    Help users find restaurants and answer questions about food and dining.
                    When users ask about specific restaurants or cuisines, use the search_restaurants function to find relevant options."""
                })

            stream = client.chat.completions.create(
                model="gpt-4o",
                messages=messages,
                tools=self.tools,
                tool_choice="auto",
                stream=True
            )

            async def generate():
                try:
                    for chunk in stream:
                        if chunk.choices[0].delta.content is not None:
                            yield f"data: {json.dumps({'content': chunk.choices[0].delta.content})}\n\n"
                        elif chunk.choices[0].delta.tool_calls is not None: # mock search restaurants function call
                            yield f"data: {json.dumps({'content': 'I am searching for restaurants that match your criteria...'})}\n\n"
                except Exception as e:
                    print(f"Error in stream generation: {e}")
                    yield f"data: {json.dumps({'content': 'I apologize, but I am having trouble processing your request right now.'})}\n\n"
                finally:
                    yield "data: [DONE]\n\n"

            return StreamingResponse(generate(), media_type="text/event-stream")
            
        except Exception as e:
            print(f"Error in response generation: {e}")
            async def error_generate():
                yield f"data: {json.dumps({'content': 'An error occurred while processing your request.'})}\n\n"
                yield "data: [DONE]\n\n"
            return StreamingResponse(error_generate(), media_type="text/event-stream")