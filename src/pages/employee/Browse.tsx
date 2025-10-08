import React, { useEffect, useState } from 'react';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { MenuItemCard } from '../../components/ui/MenuItemCard';
import { CartSidebar } from '../../components/ui/CartSidebar';
import { Store, ShoppingCart, Plus, ArrowLeft } from 'lucide-react';
import { Vendor, MenuItem } from '../../types';
import { api } from '../../services/api';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { useRealtimeVendors, useRealtimeMenuItems } from '../../hooks/useRealtimeData';
import toast from 'react-hot-toast';

export const EmployeeBrowse: React.FC = () => {
  const { user } = useAuthStore();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { getTotalItems } = useCartStore();

  useEffect(() => {
    if (user) {
      loadVendors();
    }
  }, [user]);

  // Set up real-time subscriptions
  useRealtimeVendors(() => {
    if (user) {
      loadVendors();
    }
  });

  useRealtimeMenuItems(() => {
    if (selectedVendor) {
      loadMenuItems(selectedVendor);
    }
  });

  const loadVendors = async () => {
    if (!user?.email) return;
    
    try {
      const { data, error } = await api.data.getVendors(user.email);
      if (error) throw error;
      setVendors(data || []);
    } catch (error: any) {
      toast.error('Failed to load vendors');
      console.error('Error loading vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMenuItems = async (vendor: Vendor) => {
    setSelectedVendor(vendor);
    try {
      const { data, error } = await api.data.getMenuItems(vendor.id);
      if (error) throw error;
      setMenuItems(data || []);
    } catch (error: any) {
      toast.error('Failed to load menu items');
      console.error('Error loading menu items:', error);
    }
  };

  const handleCheckout = () => {
    setIsCartOpen(false);
    window.location.href = '/employee/cart';
  };

  const handleQuantityChange = (item: MenuItem, quantity: number) => {
    if (quantity > 0) {
      toast.success(`${item.name} quantity updated to ${quantity}`);
    } else {
      toast.success(`${item.name} removed from cart`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Cart Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Browse Vendors</h1>
          <p className="text-gray-600 mt-1">Order food from your favorite vendors</p>
        </div>
        
        {getTotalItems() > 0 && (
          <Button
            onClick={() => setIsCartOpen(true)}
            className="relative bg-blue-600 hover:bg-blue-700 text-white"
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            Cart
            <Badge 
              variant="primary" 
              className="absolute -top-2 -right-2 text-xs min-w-5 h-5 flex items-center justify-center"
            >
              {getTotalItems()}
            </Badge>
          </Button>
        )}
      </div>

      {!selectedVendor ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vendors.map((vendor) => (
            <Card key={vendor.id} hover>
              <CardBody>
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Store className="w-6 h-6 text-orange-600" />
                  </div>
                  <Badge variant="success">Open</Badge>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{vendor.name}</h3>
                {vendor.description && (
                  <p className="text-sm text-gray-600 mb-4">{vendor.description}</p>
                )}
                <Button onClick={() => loadMenuItems(vendor)} className="w-full">
                  View Menu
                </Button>
              </CardBody>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Vendor Header */}
          <div className="flex items-center justify-between mb-6">
            <Button 
              variant="outline" 
              onClick={() => setSelectedVendor(null)}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Vendors</span>
            </Button>
            <h2 className="text-2xl font-bold text-gray-900">{selectedVendor.name}</h2>
            <div className="w-32"></div> {/* Spacer for alignment */}
          </div>

          {/* Menu Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems
              .filter((item) => item.status === 'active')
              .map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  onQuantityChange={handleQuantityChange}
                />
              ))}
          </div>

          {menuItems.filter((item) => item.status === 'active').length === 0 && (
            <Card>
              <CardBody className="text-center py-12">
                <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No items available at this time</p>
              </CardBody>
            </Card>
          )}
        </>
      )}

      {vendors.length === 0 && (
        <Card>
          <CardBody className="text-center py-12">
            <Store className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No vendors available</p>
          </CardBody>
        </Card>
      )}

      {/* Cart Sidebar */}
      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onCheckout={handleCheckout}
      />
    </div>
  );
};
