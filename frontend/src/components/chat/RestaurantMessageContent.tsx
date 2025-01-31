import { useEffect, useState, useRef } from 'react';
import type { YelpBusiness, YelpSearchParams } from '../../services/yelp';
import { yelpService } from '../../services/yelp';
import RestaurantList from '../restaurant/RestaurantList';

interface RestaurantMessageContentProps {
  searchParams: YelpSearchParams;
}

const RestaurantMessageContent = ({ searchParams }: RestaurantMessageContentProps) => {
  const [businesses, setBusinesses] = useState<YelpBusiness[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);

  useEffect(() => {
    const fetchBusinessesWithDetails = async () => {
      if (fetchingRef.current) return;

      if (!searchParams?.term || !searchParams?.location) {
        setError('Invalid search parameters');
        setIsLoading(false);
        return;
      }

      try {
        fetchingRef.current = true;
        setIsLoading(true);
        setError(null);
        
        const cacheKey = JSON.stringify(searchParams);
        const cached = sessionStorage.getItem(cacheKey);
        
        if (cached) {
          setBusinesses(JSON.parse(cached));
          setIsLoading(false);
          return;
        }
        
        const searchResponse = await yelpService.searchBusinesses(searchParams);

        if (!searchResponse || !searchResponse.businesses) {
          throw new Error('Invalid response from Yelp API');
        }

        const businessesWithDetails = await Promise.all(
          searchResponse.businesses.map(async (business) => {
            try {
              const details = await yelpService.getBusinessDetails(business.id);
              return {
                ...business,
                photos: details.photos?.slice(0, 3) || [business.image_url],
                hours: details.hours
              };
            } catch (error) {
              return business;
            }
          })
        );
        
        sessionStorage.setItem(cacheKey, JSON.stringify(businessesWithDetails));
        setBusinesses(businessesWithDetails);

      } catch (err) {
        setError('Failed to load restaurants. Please try again later.');
      } finally {
        setIsLoading(false);
        fetchingRef.current = false;
      }
    };

    if (searchParams?.term) {
      fetchBusinessesWithDetails();
    }

    return () => {
      fetchingRef.current = false;
    };
  }, [searchParams]);

  return (
    <div>
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      )}

      {error && (
        <div className="text-red-600 py-2">
          {error}
        </div>
      )}

      {!isLoading && !error && !businesses.length && (
        <div className="text-gray-600 py-2">
          No restaurants found matching your criteria.
        </div>
      )}

      {businesses.length > 0 && (
        <RestaurantList businesses={businesses} className="mt-4" />
      )}
    </div>
  );
};

export default RestaurantMessageContent;