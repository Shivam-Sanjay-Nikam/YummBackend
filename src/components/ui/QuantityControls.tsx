import React from 'react';
import { Button } from './Button';
import { Plus, Minus } from 'lucide-react';

interface QuantityControlsProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  onAdd: () => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  maxQuantity?: number;
}

export const QuantityControls: React.FC<QuantityControlsProps> = ({
  quantity,
  onIncrease,
  onDecrease,
  onAdd,
  size = 'md',
  disabled = false,
  maxQuantity = 99
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base'
  };

  const buttonSizeClasses = {
    sm: 'p-1',
    md: 'p-1.5',
    lg: 'p-2'
  };

  if (quantity === 0) {
    return (
      <Button
        onClick={onAdd}
        disabled={disabled}
        size={size}
        className="bg-blue-600 hover:bg-blue-700 text-white"
      >
        <Plus className={`${sizeClasses[size]} mr-1`} />
        Add
      </Button>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <Button
        onClick={onDecrease}
        disabled={disabled}
        variant="outline"
        size={size}
        className={`${buttonSizeClasses[size]} min-w-0`}
      >
        <Minus className={sizeClasses[size]} />
      </Button>
      
      <span className={`font-medium text-gray-900 min-w-0 ${sizeClasses[size]}`}>
        {quantity}
      </span>
      
      <Button
        onClick={onIncrease}
        disabled={disabled || quantity >= maxQuantity}
        variant="outline"
        size={size}
        className={`${buttonSizeClasses[size]} min-w-0`}
      >
        <Plus className={sizeClasses[size]} />
      </Button>
    </div>
  );
};
