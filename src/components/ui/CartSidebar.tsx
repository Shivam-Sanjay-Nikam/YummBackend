import React from 'react';
import { Card, CardBody } from './Card';
import { Button } from './Button';
import { Badge } from './Badge';
import { X, Plus, Minus, ShoppingCart, Trash2 } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({ isOpen, onClose, onCheckout }) => {
  const { items, updateQuantity, removeItem, getTotalAmount, getTotalItems, clearCart } = useCartStore();
  const { user } = useAuthStore();

  const totalAmount = getTotalAmount();
  const totalItems = getTotalItems();

  const handleQuantityChange = (menuItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(menuItemId);
    } else {
      updateQuantity(menuItemId, newQuantity);
    }
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Cart</h2>
              {totalItems > 0 && (
                <Badge variant="primary" className="text-xs">
                  {totalItems}
                </Badge>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <ShoppingCart className="w-12 h-12 text-gray-400 mb-4" />
                <p className="text-gray-500 mb-2">Your cart is empty</p>
                <p className="text-sm text-gray-400">Add some delicious items to get started!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <Card key={item.menu_item.id} className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">
                          {item.menu_item.name}
                        </h3>
                        {item.menu_item.description && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                            {item.menu_item.description}
                          </p>
                        )}
                        <p className="text-sm font-semibold text-green-600 mt-1">
                          ₹{item.menu_item.price.toFixed(2)} each
                        </p>
                      </div>
                      <button
                        onClick={() => removeItem(item.menu_item.id)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors ml-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleQuantityChange(item.menu_item.id, item.quantity - 1)}
                          className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                        >
                          <Minus className="w-4 h-4 text-gray-600" />
                        </button>
                        <span className="w-8 text-center font-medium text-gray-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(item.menu_item.id, item.quantity + 1)}
                          className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                        >
                          <Plus className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                      <p className="font-semibold text-gray-900">
                        ₹{(item.menu_item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-gray-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-gray-900">Total</span>
                <span className="text-xl font-bold text-green-600">
                  ₹{totalAmount.toFixed(2)}
                </span>
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={clearCart}
                  className="flex-1"
                  disabled={items.length === 0}
                >
                  Clear Cart
                </Button>
                <Button
                  onClick={onCheckout}
                  className="flex-1"
                >
                  Checkout
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
