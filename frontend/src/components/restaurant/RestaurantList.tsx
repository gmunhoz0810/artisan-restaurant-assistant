import type { YelpBusiness } from '../../services/yelp';
import RestaurantCard from './RestaurantCard';

interface RestaurantListProps {
  businesses: YelpBusiness[];
  className?: string;
}

const RestaurantList = ({ businesses, className = '' }: RestaurantListProps) => {
  if (!businesses.length) return null;

  return (
    <div className={`space-y-4 ${className}`}>
      {businesses.map((business, index) => (
        <RestaurantCard 
          key={business.id} 
          business={business} 
          index={index}
        />
      ))}
    </div>
  );
};

export default RestaurantList;