import React, { useEffect, useState } from 'react';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Store, ShoppingCart, Plus } from 'lucide-react';
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
  const addItem = useCartStore((state) => state.addItem);

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

  const handleAddToCart = (item: MenuItem) => {
    addItem(item);
    toast.success(`${item.name} added to cart`);
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Browse Vendors</h1>
        <p className="text-gray-600 mt-1">Order food from your favorite vendors</p>
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
          <div className="flex items-center justify-between">
            <div>
              <Button variant="outline" onClick={() => setSelectedVendor(null)}>
                Back to Vendors
              </Button>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">{selectedVendor.name}</h2>
            <div></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems
              .filter((item) => item.status === 'active')
              .map((item) => (
                <Card key={item.id} hover>
                  <CardBody>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                        {item.description && (
                          <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-xl font-bold text-green-600">
                        ₹{item.price.toFixed(2)}
                      </span>
                      <Button size="sm" onClick={() => handleAddToCart(item)}>
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  </CardBody>
                </Card>
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
    </div>
  );
};
