/**
 * RestaurantCard.tsx
 * 
 * Individual restaurant card component displaying Yelp business information.
 * Manages detailed restaurant information display with photo carousel.
 * 
 * Features:
 * - Photo carousel with navigation controls
 * - Yelp rating display with dynamic stars
 * - Business hours and pricing information
 * - Click-through to Yelp business page
 * - Location and category display
 * - Responsive image handling with error states
 * - Support for both fullscreen and compact modes
 */

import { useState } from 'react';
import type { YelpBusiness } from '../../services/yelp';
import { yelpService } from '../../services/yelp';

interface RestaurantCardProps {
  business: YelpBusiness;
  index: number;
  isFullscreen?: boolean;
}

const RestaurantCard = ({ business, index, isFullscreen = false }: RestaurantCardProps) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  const photos = (business.photos || [business.image_url]).filter(Boolean);

  const handleNextPhoto = () => {
    if (currentPhotoIndex < photos.length - 1) {
      setCurrentPhotoIndex(prev => prev + 1);
    }
  };

  const handlePrevPhoto = () => {
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex(prev => prev - 1);
    }
  };

  const handleImageError = () => {
    setImageError(true);
    console.error('Image failed to load:', photos[currentPhotoIndex]);
  };

  const currentPhotoUrl = photos[currentPhotoIndex];

  if (!currentPhotoUrl) {
    return null;
  }

  // Adjust height based on fullscreen mode while maintaining aspect ratio
  const imageHeight = isFullscreen ? 'h-52' : 'h-36';

  return (
    <div className="w-full bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
      {/* Photo Section */}
      <div className={`relative ${imageHeight} bg-gray-200`}>
        <div className="absolute inset-0 flex items-center justify-between px-2 z-10">
          <button
            onClick={handlePrevPhoto}
            disabled={currentPhotoIndex === 0}
            className={`p-1.5 rounded-full transition-all duration-200 ${
              currentPhotoIndex === 0
                ? 'bg-gray-400/50 text-gray-500 cursor-not-allowed'
                : 'bg-black/50 text-white hover:bg-black/70 cursor-pointer'
            }`}
            aria-label="Previous photo"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={handleNextPhoto}
            disabled={currentPhotoIndex >= photos.length - 1}
            className={`p-1.5 rounded-full transition-all duration-200 ${
              currentPhotoIndex >= photos.length - 1
                ? 'bg-gray-400/50 text-gray-500 cursor-not-allowed'
                : 'bg-black/50 text-white hover:bg-black/70 cursor-pointer'
            }`}
            aria-label="Next photo"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div 
          className="relative h-full cursor-pointer"
          onClick={() => window.open(business.url, '_blank')}
        >
          {!imageError ? (
            <img
              src={currentPhotoUrl}
              alt={business.name}
              className="w-full h-full object-cover"
              onError={handleImageError}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
              <span>Image unavailable</span>
            </div>
          )}
          
          <div className="absolute top-2 left-2 bg-white/90 text-gray-900 px-1.5 py-0.5 rounded text-xs font-medium z-20">
            #{index + 1}
          </div>
          
          {photos.length > 1 && !imageError && (
            <div className="absolute bottom-2 right-2 bg-black/50 text-white px-1.5 py-0.5 rounded text-[10px] z-20">
              {currentPhotoIndex + 1} / {photos.length}
            </div>
          )}
        </div>
      </div>

      {/* Info Section */}
      <div 
        className={`cursor-pointer hover:bg-gray-50 transition-colors duration-200 ${isFullscreen ? 'p-4' : 'p-3'}`}
        onClick={() => window.open(business.url, '_blank')}
      >
        <div className="flex justify-between items-start mb-1.5">
          <h3 className={`font-semibold text-gray-900 hover:text-[#d32323] ${isFullscreen ? 'text-base' : 'text-sm'}`}>
            {business.name}
          </h3>
          {business.price && (
            <span className="text-xs text-gray-600 font-medium">{business.price}</span>
          )}
        </div>
        <div className="flex items-center mb-1.5">
          <img
            src={yelpService.getStarImage(business.rating)}
            alt={`${business.rating} stars`}
            className={isFullscreen ? 'h-5' : 'h-4'}
          />
          <span className="ml-1 text-xs text-gray-600">
            {business.review_count.toLocaleString()} reviews
          </span>
        </div>
        <div className="text-xs text-gray-600 mb-1.5">
          {business.categories.map(cat => cat.title).join(', ')}
        </div>
        <div className="text-xs text-gray-800">
          {business.location.address1}<br />
          {business.location.city}, {business.location.state} {business.location.zip_code}
        </div>
        {business.hours && business.hours[0] && (
          <div className="mt-1.5 text-xs">
            <span className={business.hours[0].is_open_now ? 'text-green-600' : 'text-red-600'}>
              {business.hours[0].is_open_now ? '● Open' : '● Closed'}
            </span>
            <span className="text-gray-600 ml-2">
              {yelpService.formatOpenHours(business.hours)}
            </span>
          </div>
        )}
        <div className="mt-2 flex items-center">
          <img
            src="/light_bg/RGB/yelp_logo.png"
            alt="Yelp"
            className={isFullscreen ? 'h-4' : 'h-3'}
          />
          <span className="text-[10px] text-gray-500 ml-1">
            Powered by Yelp
          </span>
        </div>
      </div>
    </div>
  );
};

export default RestaurantCard;