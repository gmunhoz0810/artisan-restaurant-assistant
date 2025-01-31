"""
yelp.py

FastAPI router managing all Yelp API integrations.
Handles restaurant searches, business details, and data formatting.

Key Features:
- Restaurant search with multiple parameters
- Business details retrieval
- Image proxy handling for CORS
- Search result filtering and sorting
- Error handling for API failures
- Request retrying for reliability
- Data caching for performance

"""

from fastapi import APIRouter, HTTPException, Response
from typing import Optional, List
import httpx
import os
from urllib.parse import unquote

router = APIRouter()

YELP_API_KEY=os.getenv("YELP_API_KEY")

YELP_API_BASE_URL = "https://api.yelp.com/v3"

def convert_price_to_yelp_format(price: str) -> str:
    """Convert dollar signs to Yelp's number format"""
    if not price:
        return None
    
    # Map dollar signs to numbers
    price_map = {
        "$": "1",
        "$$": "2",
        "$$$": "3",
        "$$$$": "4"
    }
    return price_map.get(price)

async def make_yelp_request(path: str, params: dict = None):
    """Make a request to Yelp API"""
    headers = {
        "Authorization": f"Bearer {YELP_API_KEY}",
        "Accept": "application/json",
    }
    
    url = f"{YELP_API_BASE_URL}{path}"
    print(f"\n=== YELP API REQUEST ===")
    print(f"URL: {url}")
    print(f"Params: {params}")
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                url,
                headers=headers,
                params=params,
                timeout=30.0
            )
            
            print(f"Response Status: {response.status_code}")
            if response.status_code != 200:
                print(f"Error Response: {response.text}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Yelp API error: {response.text}"
                )
            
            return response.json()
            
        except httpx.TimeoutException:
            print("Request timed out")
            raise HTTPException(
                status_code=504,
                detail="Request to Yelp API timed out"
            )
        except httpx.RequestError as e:
            print(f"Request error: {str(e)}")
            raise HTTPException(
                status_code=502,
                detail=f"Error making request to Yelp API: {str(e)}"
            )
        except Exception as e:
            print(f"Unexpected error: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Unexpected error: {str(e)}"
            )

async def fetch_businesses_with_retry(params: dict, desired_count: int) -> dict:
    """Fetch businesses with retries and pagination until we get enough valid results"""
    all_businesses = []
    offset = 0
    max_attempts = 3  # Limit the number of pagination attempts
    
    while len(all_businesses) < desired_count and max_attempts > 0:
        try:
            # Update offset in params
            current_params = {**params, 'offset': offset}
            print(f"Fetching businesses with params: {current_params}")
            
            response = await make_yelp_request("/businesses/search", current_params)
            
            if not response or 'businesses' not in response:
                break
                
            # Filter valid businesses
            valid_businesses = [
                b for b in response['businesses']
                if b.get('review_count', 0) > 0  # Has reviews
                and b.get('rating') is not None  # Has rating
                and b.get('name')  # Has name
                and b not in all_businesses  # No duplicates
            ]
            
            all_businesses.extend(valid_businesses)
            
            # If we didn't get any valid businesses or there are no more results
            if not valid_businesses or not response['businesses']:
                break
                
            offset += len(response['businesses'])
            max_attempts -= 1
            
        except Exception as e:
            print(f"Error in fetch attempt: {str(e)}")
            break
    
    return {
        'businesses': all_businesses[:desired_count],
        'total': len(all_businesses)
    }

@router.get("/businesses/search")
async def search_businesses(
    term: Optional[str] = None,
    location: Optional[str] = None,
    price: Optional[str] = None,
    sort_by: Optional[str] = None,
    limit: Optional[int] = 20,
    offset: Optional[int] = 0,
    k: Optional[int] = None
):
    """Proxy endpoint for Yelp business search"""
    print(f"\n=== BUSINESS SEARCH REQUEST ===")
    print(f"Term: {term}")
    print(f"Location: {location}")
    print(f"K param: {k}")
    print(f"Price: {price}")
    print(f"Sort by: {sort_by}")
    
    try:
        if not location:
            raise HTTPException(
                status_code=400,
                detail="Location must be provided"
            )
            
        desired_count = k or limit
        
        # Build base parameters
        params = {
            "term": term,
            "location": location,
            "sort_by": sort_by,
            "limit": min(desired_count * 3, 50),  # Triple the requested amount, max 50
        }

        # Add price if specified
        if price:
            yelp_price = convert_price_to_yelp_format(price)
            if yelp_price:
                params["price"] = yelp_price

        # Remove None values
        params = {k: v for k, v in params.items() if v is not None}
        
        # Fetch businesses with retry logic
        data = await fetch_businesses_with_retry(params, desired_count)
        
        # Log results
        print(f"Found {len(data['businesses'])} valid businesses out of {data['total']} total results")
        
        if len(data['businesses']) < desired_count:
            print(f"Warning: Only found {len(data['businesses'])} valid businesses, wanted {desired_count}")
        
        return data
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in search_businesses: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch businesses: {str(e)}"
        )

@router.get("/businesses/{business_id}")
async def get_business(business_id: str):
    """Proxy endpoint for getting business details"""
    print(f"\n=== BUSINESS DETAILS REQUEST ===")
    print(f"Business ID: {business_id}")
    
    try:
        return await make_yelp_request(f"/businesses/{business_id}")
    except Exception as e:
        print(f"Error in get_business: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch business details: {str(e)}"
        )

@router.get("/businesses/{business_id}/reviews")
async def get_business_reviews(business_id: str):
    """Proxy endpoint for getting business reviews"""
    print(f"\n=== BUSINESS REVIEWS REQUEST ===")
    print(f"Business ID: {business_id}")
    
    try:
        return await make_yelp_request(f"/businesses/{business_id}/reviews")
    except Exception as e:
        print(f"Error in get_business_reviews: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch business reviews: {str(e)}"
        )

@router.get("/images/{encoded_url:path}")
async def proxy_image(encoded_url: str):
    """Proxy for Yelp images to handle CORS"""
    try:
        # Decode the URL
        url = unquote(encoded_url)
        print(f"\n=== IMAGE PROXY REQUEST ===")
        print(f"URL: {url}")
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            
            if response.status_code != 200:
                print(f"Image proxy error: {response.status_code}")
                raise HTTPException(status_code=response.status_code, detail="Failed to fetch image")

            return Response(
                content=response.content,
                media_type=response.headers.get("content-type", "image/jpeg"),
                headers={"Cache-Control": "public, max-age=31536000"}
            )
            
    except Exception as e:
        print(f"Error proxying image: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))