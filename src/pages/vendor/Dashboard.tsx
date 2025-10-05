import React, { useEffect, useState } from 'react';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Clock, CheckCircle, Package, List, UtensilsCrossed } from 'lucide-react';
import { Order } from '../../types';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

export const VendorDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    if (!user?.email) return;
    
    try {
      const { data, error } = await api.data.getOrders('vendor', user.email);
      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      toast.error('Failed to load orders');
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const pendingOrders = orders.filter((o) => o.status === 'placed');
  const activeOrders = orders.filter((o) => o.status === 'preparing');
  const completedOrders = orders.filter((o) => o.status === 'given' || o.status === 'cancelled');

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="px-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">Manage your orders and business</p>
      </div>

      {/* Statistics Cards - Mobile Friendly */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card>
          <CardBody className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
                <Package className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl sm:text-3xl font-bold text-blue-600 mt-1">{pendingOrders.length}</p>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-orange-100 rounded-lg">
                <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Preparing</p>
                <p className="text-2xl sm:text-3xl font-bold text-orange-600 mt-1">{activeOrders.length}</p>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card className="sm:col-span-2 lg:col-span-1">
          <CardBody className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl sm:text-3xl font-bold text-green-600 mt-1">{completedOrders.length}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>


      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardBody className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Manage Menu</h3>
                <p className="text-sm text-gray-600 mt-1">Add or edit your menu items</p>
              </div>
              <a 
                href="/vendor/menu"
                className="p-3 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
              >
                <UtensilsCrossed className="w-6 h-6 text-blue-600" />
              </a>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">View All Orders</h3>
                <p className="text-sm text-gray-600 mt-1">See complete order history</p>
              </div>
              <a 
                href="/vendor/orders"
                className="p-3 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
              >
                <List className="w-6 h-6 text-green-600" />
              </a>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
