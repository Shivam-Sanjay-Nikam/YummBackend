import React, { useState } from 'react';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ShoppingCart, Trash2, Plus, Minus } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

export const EmployeeCart: React.FC = () => {
  const { items, updateQuantity, removeItem, clearCart, getTotalAmount } = useCartStore();
  const [loading, setLoading] = useState(false);

  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    const vendorId = items[0].menu_item.vendor_id;
    const allSameVendor = items.every((item) => item.menu_item.vendor_id === vendorId);

    if (!allSameVendor) {
      toast.error('All items must be from the same vendor');
      return;
    }

    setLoading(true);

    try {
      const orderItems = items.map((item) => ({
        menu_item_id: item.menu_item.id,
        quantity: item.quantity,
      }));

      await api.employee.placeOrder({
        vendor_id: vendorId,
        items: orderItems,
      });

      toast.success('Order placed successfully!');
      clearCart();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cart</h1>
          <p className="text-gray-600 mt-1">Review your order</p>
        </div>

        <Card>
          <CardBody className="text-center py-12">
            <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Your cart is empty</h3>
            <p className="text-gray-500 mb-6">Start adding items from vendors</p>
            <Button onClick={() => (window.location.href = '/employee/browse')}>
              Browse Vendors
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Cart</h1>
        <p className="text-gray-600 mt-1">Review your order</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">Order Items</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.menu_item.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{item.menu_item.name}</h3>
                    {item.menu_item.description && (
                      <p className="text-sm text-gray-600 mt-1">{item.menu_item.description}</p>
                    )}
                    <p className="text-sm font-medium text-green-600 mt-2">
                      ${item.menu_item.price.toFixed(2)} each
                    </p>
                  </div>

                  <div className="flex items-center space-x-4 ml-4">
                    <div className="flex items-center space-x-2 border border-gray-300 rounded-lg">
                      <button
                        onClick={() => updateQuantity(item.menu_item.id, item.quantity - 1)}
                        className="p-2 hover:bg-gray-100 rounded-l-lg transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="px-3 font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.menu_item.id, item.quantity + 1)}
                        className="p-2 hover:bg-gray-100 rounded-r-lg transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeItem(item.menu_item.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">Order Summary</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">${getTotalAmount().toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-lg font-bold text-green-600">
                      ${getTotalAmount().toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <Button onClick={handlePlaceOrder} loading={loading} className="w-full">
                Place Order
              </Button>

              <Button variant="outline" onClick={clearCart} className="w-full">
                Clear Cart
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};
