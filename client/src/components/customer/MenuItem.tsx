import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { formatCurrency, parseJSON } from '@/lib/utils';
import { MenuItem as MenuItemType } from '@shared/schema';

interface MenuItemProps {
  item: MenuItemType;
  onAddToCart: () => void;
}

export default function MenuItem({ item, onAddToCart }: MenuItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Parse allergies and dietary info
  const allergies = parseJSON<string[]>(item.allergies as string, []);
  const dietaryInfo = parseJSON<string[]>(item.dietaryInfo as string, []);

  return (
    <div className="menu-item">
      <div className="flex gap-3">
        {item.image && (
          <img 
            src={item.image} 
            alt={item.name} 
            className="w-20 h-20 object-cover rounded" 
          />
        )}
        <div className="flex-1">
          <div className="flex justify-between">
            <h4 className="font-medium">{item.name}</h4>
            <span className="font-medium">{formatCurrency(item.price)}</span>
          </div>
          <p className={`text-sm text-neutral-500 ${isExpanded ? '' : 'line-clamp-2'} mb-1`}>
            {item.description || 'No description available'}
          </p>
          {(item.description?.length || 0) > 70 && (
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-primary mb-1"
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </button>
          )}
          <div className="flex items-center text-xs text-neutral-500 gap-2 flex-wrap">
            {allergies.length > 0 && allergies.map((allergy, index) => (
              <span key={index} className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                Contains {allergy}
              </span>
            ))}
            {dietaryInfo.length > 0 && dietaryInfo.map((info, index) => (
              <span key={index} className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                {info}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="flex justify-end mt-2">
        <button 
          onClick={onAddToCart}
          disabled={!item.isAvailable}
          className={`px-3 py-1 text-sm rounded-full ${
            item.isAvailable 
              ? 'bg-primary text-white hover:bg-primary/90' 
              : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
          }`}
        >
          {item.isAvailable ? 'Add to Order' : 'Out of Stock'}
        </button>
      </div>
    </div>
  );
}
