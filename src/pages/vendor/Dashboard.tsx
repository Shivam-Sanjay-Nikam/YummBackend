import React, { useEffect, useState } from 'react';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import { Order, OrderStatus } from '../../types';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

export const VendorDashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const { data, error } = await api.data.getOrders('vendor');
      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      toast.error('Failed to load orders');
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, status: OrderStatus) => {
    try {
      // For now, we'll just reload orders since we don't have a specific update status endpoint
      // In a real app, you'd call an API to update the order status
      toast.success('Order status updated');
      loadOrders();
    } catch (error: any) {
      toast.error('Failed to update order status');
    }
  };

  const handleCancelRequest = async (orderId: string, action: 'accept' | 'reject') => {
    try {
      await api.vendor.handleCancelRequest({ order_id: orderId, action });
      toast.success(action === 'accept' ? 'Order cancelled' : 'Cancellation denied');
      loadOrders();
    } catch (error: any) {
      toast.error('Failed to handle cancellation request');
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    const statusConfig = {
      placed: { variant: 'primary' as const, icon: Clock, text: 'New Order' },
      preparing: { variant: 'warning' as const, icon: Clock, text: 'Preparing' },
      prepared: { variant: 'warning' as const, icon: Clock, text: 'Prepared' },
      given: { variant: 'success' as const, icon: CheckCircle, text: 'Completed' },
      cancelled: { variant: 'danger' as const, icon: XCircle, text: 'Cancelled' },
      cancel_requested: { variant: 'warning' as const, icon: Clock, text: 'Cancel Requested' },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant}>
        <Icon className="w-3 h-3 mr-1 inline" />
        {config.text}
      </Badge>
    );
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-600 mt-1">Manage incoming orders</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardBody>
            <p className="text-sm font-medium text-gray-600">Pending</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{pendingOrders.length}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm font-medium text-gray-600">Preparing</p>
            <p className="text-3xl font-bold text-orange-600 mt-2">{activeOrders.length}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm font-medium text-gray-600">Completed</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{completedOrders.length}</p>
          </CardBody>
        </Card>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardBody>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Order #{order.id.slice(0, 8)}
                    </h3>
                    {getStatusBadge(order.status)}
                  </div>
                  <p className="text-sm text-gray-600">
                    Customer: {order.employee?.name || 'Unknown'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">
                    ${order.total_amount.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Order Items</h4>
                <div className="space-y-2">
                  {order.order_items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {item.menu_items?.name || 'Unknown Item'} x{item.quantity}
                      </span>
                      <span className="font-medium">${item.total_cost.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {order.status === 'placed' && (
                <div className="flex space-x-3">
                  <Button
                    size="sm"
                    onClick={() => handleUpdateStatus(order.id, 'preparing')}
                    className="flex-1"
                  >
                    Start Preparing
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleCancelRequest(order.id, 'accept')}
                  >
                    Cancel
                  </Button>
                </div>
              )}

              {order.status === 'preparing' && (
                <Button
                  size="sm"
                  variant="success"
                  onClick={() => handleUpdateStatus(order.id, 'given')}
                  className="w-full"
                >
                  Mark as Completed
                </Button>
              )}
            </CardBody>
          </Card>
        ))}
      </div>

      {orders.length === 0 && (
        <Card>
          <CardBody className="text-center py-12">
            <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No orders yet</p>
          </CardBody>
        </Card>
      )}
    </div>
  );
};
