import React from 'react';
import { Card, CardBody } from './Card';
import { Badge } from './Badge';
import { QuantityControls } from './QuantityControls';
import { MenuItem } from '../../types';
import { useCartStore } from '../../store/cartStore';

interface MenuItemCardProps {
  item: MenuItem;
  onQuantityChange?: (item: MenuItem, quantity: number) => void;
  className?: string;
}

export const MenuItemCard: React.FC<MenuItemCardProps> = ({ 
  item, 
  onQuantityChange,
  className = '' 
}) => {
  const { items, addItem, updateQuantity, removeItem } = useCartStore();
  
  const cartItem = items.find(cartItem => cartItem.menu_item.id === item.id);
  const currentQuantity = cartItem?.quantity || 0;

  const handleIncrease = () => {
    if (currentQuantity === 0) {
      addItem(item);
    } else {
      updateQuantity(item.id, currentQuantity + 1);
    }
    onQuantityChange?.(item, currentQuantity + 1);
  };

  const handleDecrease = () => {
    if (currentQuantity === 1) {
      removeItem(item.id);
    } else {
      updateQuantity(item.id, currentQuantity - 1);
    }
    onQuantityChange?.(item, currentQuantity - 1);
  };

  const handleAdd = () => {
    addItem(item);
    onQuantityChange?.(item, 1);
  };

  return (
    <Card 
      hover 
      className={`relative overflow-hidden ${currentQuantity > 0 ? 'ring-2 ring-blue-200 bg-blue-50' : ''} ${className}`}
    >
      <CardBody className="p-4">
        {/* Item Status Badge */}
        {currentQuantity > 0 && (
          <div className="absolute top-2 right-2">
            <Badge variant="primary" className="text-xs">
              In Cart ({currentQuantity})
            </Badge>
          </div>
        )}

        {/* Item Content */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 pr-16">
            {item.name}
          </h3>
          
          {item.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {item.description}
            </p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold text-green-600">
                ₹{item.price.toFixed(2)}
              </span>
              {currentQuantity > 0 && (
                <span className="text-sm text-gray-500">
                  × {currentQuantity} = ₹{(item.price * currentQuantity).toFixed(2)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center justify-end">
          <QuantityControls
            quantity={currentQuantity}
            onIncrease={handleIncrease}
            onDecrease={handleDecrease}
            onAdd={handleAdd}
            size="md"
            maxQuantity={10}
          />
        </div>
      </CardBody>
    </Card>
  );
};
