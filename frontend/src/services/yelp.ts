interface YelpSearchParams {
    term: string;  // Changed to required
    location?: string;
    price?: '$' | '$$' | '$$$' | '$$$$';
    sort_by?: 'best_match' | 'rating' | 'review_count' | 'distance';
    k?: number;  // For controlling number of results (1-5)
  }
  
  interface YelpBusinessHours {
    is_open_now: boolean;
    open: Array<{
      start: string;
      end: string;
      day: number;
      is_overnight: boolean;
    }>;
  }
  
  interface YelpBusiness {
    id: string;
    name: string;
    image_url: string;
    photos?: string[];
    url: string;
    price?: '$' | '$$' | '$$$' | '$$$$';
    rating: number;
    review_count: number;
    categories: Array<{
      alias: string;
      title: string;
    }>;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    location: {
      address1: string;
      address2?: string;
      address3?: string;
      city: string;
      state: string;
      zip_code: string;
      country: string;
    };
    hours?: YelpBusinessHours[];
  }
  
  interface YelpSearchResponse {
    total: number;
    businesses: YelpBusiness[];
  }
  
  class YelpService {
    private baseUrl = 'http://localhost:8000/api/yelp';
  
    private buildQueryString(params: Record<string, any>): string {
      const validParams = Object.entries(params)
        .filter(([_, value]) => value != null && value !== '')
        .reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {} as Record<string, any>);
  
      return new URLSearchParams(validParams as Record<string, string>).toString();
    }
  
    async searchBusinesses(params: YelpSearchParams): Promise<YelpSearchResponse> {
      console.log('Yelp service making search request with params:', params);
      
      // Ensure k is within bounds (1-5)
      if (params.k) {
        params.k = Math.min(Math.max(params.k, 1), 5);
      }
  
      const queryParams = this.buildQueryString(params);
      const url = `${this.baseUrl}/businesses/search?${queryParams}`;
      console.log('Full URL:', url);
  
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });
  
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Yelp API error response:', errorText);
          throw new Error(`Yelp API error: ${response.status} ${response.statusText}`);
        }
  
        const data = await response.json();
        console.log('Yelp API response:', data);
        return data;
      } catch (error) {
        console.error('Error in searchBusinesses:', error);
        throw error;
      }
    }
  
    async getBusinessDetails(businessId: string): Promise<YelpBusiness> {
      console.log('Fetching details for business:', businessId);
      const url = `${this.baseUrl}/businesses/${businessId}`;
      
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });
  
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Yelp API error response:', errorText);
          throw new Error(`Yelp API error: ${response.status} ${response.statusText}`);
        }
  
        const data = await response.json();
        console.log('Business details response:', data);
        return data;
      } catch (error) {
        console.error('Error in getBusinessDetails:', error);
        throw error;
      }
    }
  
    getStarImage(rating: number): string {
      // Round to nearest half
      const roundedRating = Math.round(rating * 2) / 2;
      
      // Convert to string and check if it's a half star
      const isHalf = roundedRating % 1 === 0.5;
      
      // Get the base number (whole number part)
      const baseRating = Math.floor(roundedRating);
      
      // Construct the filename
      const ratingPart = isHalf ? `${baseRating}_half` : baseRating;
      
      return `/ReviewRibbon_v2/Desktop/large_32/Review_Ribbon_large_32_${ratingPart}@2x.png`;
    }
  
    formatOpenHours(hours: YelpBusinessHours[]): string {
      if (!hours || !hours[0]?.open) return '';
  
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const today = new Date().getDay();
      const todayHours = hours[0].open.find(h => h.day === today);
  
      if (!todayHours) return '';
  
      const formatTime = (time: string) => {
        const hour = parseInt(time.slice(0, 2));
        const minute = time.slice(2);
        const period = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}${minute === '00' ? '' : ':' + minute}${period}`;
      };
  
      return `Today: ${formatTime(todayHours.start)} - ${formatTime(todayHours.end)}`;
    }
  }
  
  export type { YelpBusiness, YelpSearchParams, YelpBusinessHours, YelpSearchResponse };
  export const yelpService = new YelpService();