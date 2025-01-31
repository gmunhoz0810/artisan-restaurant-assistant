/**
 * RestaurantList.tsx
 * 
 * Displays a collection of restaurant cards from Yelp search results.
 * Handles different layout modes for regular and fullscreen views.
 * 
 * Features:
 * - Grid/list layout management
 * - Responsive design with breakpoints
 * - Dynamic layout based on screen size
 * - Handles single and multiple restaurant displays
 * - Automatic spacing and alignment
 * - Visual hierarchy for search results
 */

import type { YelpBusiness } from '../../services/yelp';
import RestaurantCard from './RestaurantCard';

interface RestaurantListProps {
  businesses: YelpBusiness[];
  className?: string;
  isFullscreen?: boolean;
}

const RestaurantList = ({ 
  businesses, 
  className = '',
  isFullscreen = false 
}: RestaurantListProps) => {
  if (!businesses.length) return null;

  // Single restaurant case in fullscreen
  if (businesses.length === 1 && isFullscreen) {
    return (
      <div className={className}>
        <div className="w-[400px]">
          <RestaurantCard 
            business={businesses[0]} 
            index={0}
            isFullscreen={isFullscreen}
          />
        </div>
      </div>
    );
  }

  // Regular mode or single item non-fullscreen
  if (!isFullscreen) {
    return (
      <div className={`space-y-3 ${className}`}>
        {businesses.map((business, index) => (
          <RestaurantCard 
            key={business.id} 
            business={business} 
            index={index}
            isFullscreen={isFullscreen}
          />
        ))}
      </div>
    );
  }

  // Fullscreen mode with multiple items - using fixed-width columns
  const isLastItemAlone = businesses.length % 2 === 1;
  const normalItems = isLastItemAlone ? businesses.slice(0, -1) : businesses;
  const lastItem = isLastItemAlone ? businesses[businesses.length - 1] : null;

  return (
    <div className={className}>
      <div className="grid gap-4 max-w-6xl mx-auto grid-cols-1 md:grid-cols-2 place-items-center">
        {normalItems.map((business, index) => (
          <div className="w-full max-w-[500px]" key={business.id}>
            <RestaurantCard 
              business={business} 
              index={index}
              isFullscreen={isFullscreen}
            />
          </div>
        ))}
      </div>
      
      {lastItem && (
        <div className="mt-4 flex justify-center max-w-6xl mx-auto">
          <div className="w-full max-w-[500px]">
            <RestaurantCard 
              business={lastItem} 
              index={businesses.length - 1}
              isFullscreen={isFullscreen}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantList;