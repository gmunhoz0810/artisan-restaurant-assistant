// src/components/restaurant/RestaurantCard.tsx
import { useState } from 'react';
import type { YelpBusiness } from '../../services/yelp';
import { yelpService } from '../../services/yelp';

interface RestaurantCardProps {
  business: YelpBusiness;
  index: number;
}

const RestaurantCard = ({ business, index }: RestaurantCardProps) => {
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

  return (
    <div className="w-full bg-white rounded-lg shadow-md overflow-hidden mb-4 hover:shadow-lg transition-shadow duration-200">
      {/* Photo Section */}
      <div className="relative h-48 bg-gray-200">
        <div className="absolute inset-0 flex items-center justify-between px-2 z-10">
          <button
            onClick={handlePrevPhoto}
            disabled={currentPhotoIndex === 0}
            className={`p-2 rounded-full transition-all duration-200 ${
              currentPhotoIndex === 0
                ? 'bg-gray-400/50 text-gray-500 cursor-not-allowed'
                : 'bg-black/50 text-white hover:bg-black/70 cursor-pointer'
            }`}
            aria-label="Previous photo"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={handleNextPhoto}
            disabled={currentPhotoIndex >= photos.length - 1}
            className={`p-2 rounded-full transition-all duration-200 ${
              currentPhotoIndex >= photos.length - 1
                ? 'bg-gray-400/50 text-gray-500 cursor-not-allowed'
                : 'bg-black/50 text-white hover:bg-black/70 cursor-pointer'
            }`}
            aria-label="Next photo"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div 
          className="relative h-full"
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
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              <span>Image unavailable</span>
            </div>
          )}
          
          <div className="absolute top-2 left-2 bg-white/90 text-gray-900 px-2 py-1 rounded text-sm font-medium z-20">
            #{index + 1}
          </div>
          
          {photos.length > 1 && !imageError && (
            <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs z-20">
              {currentPhotoIndex + 1} / {photos.length}
            </div>
          )}
        </div>
      </div>

      {/* Info Section */}
      <div 
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
        onClick={() => window.open(business.url, '_blank')}
      >
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900 hover:text-[#d32323]">
            {business.name}
          </h3>
          {business.price && (
            <span className="text-gray-600 font-medium">{business.price}</span>
          )}
        </div>
        <div className="flex items-center mb-2">
          <img
            src={yelpService.getStarImage(business.rating)}
            alt={`${business.rating} stars`}
            className="h-6"
          />
          <span className="ml-1 text-gray-600">
            {business.review_count.toLocaleString()} reviews
          </span>
        </div>
        <div className="text-gray-600 text-sm mb-2">
          {business.categories.map(cat => cat.title).join(', ')}
        </div>
        <div className="text-gray-800 text-sm">
          {business.location.address1}<br />
          {business.location.city}, {business.location.state} {business.location.zip_code}
        </div>
        {business.hours && business.hours[0] && (
          <div className="mt-2 text-sm">
            <span className={business.hours[0].is_open_now ? 'text-green-600' : 'text-red-600'}>
              {business.hours[0].is_open_now ? '● Open' : '● Closed'}
            </span>
            <span className="text-gray-600 ml-2">
              {yelpService.formatOpenHours(business.hours)}
            </span>
          </div>
        )}
        <div className="mt-3 flex items-center">
          <img
            src="/light_bg/RGB/yelp_logo.png"
            alt="Yelp"
            className="h-4 mr-1"
          />
          <span className="text-xs text-gray-500">
            Powered by Yelp
          </span>
        </div>
      </div>
    </div>
  );
};

export default RestaurantCard;