import React, { useEffect, useState } from 'react';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ShoppingBag, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Order, OrderStatus } from '../../types';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { confirmManager } from '../../components/ui/ConfirmDialog';
import toast from 'react-hot-toast';

export const EmployeeOrders: React.FC = () => {
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
      const { data, error } = await api.data.getOrders('employee', user.email);
      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      toast.error('Failed to load orders');
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    const confirmed = await confirmManager.confirm({
      title: 'Cancel Order Request',
      message: 'Are you sure you want to request cancellation for this order? The vendor will need to approve your request.',
      type: 'warning',
      confirmText: 'Request Cancel',
      cancelText: 'Keep Order'
    });
    
    if (!confirmed) {
      return;
    }


    try {
      const response = await api.employee.cancelOrderRequest({ order_id: orderId });
      if (response.data) {
        toast.success('Cancellation request sent to vendor');
        loadOrders();
      } else {
        // Show user-friendly error messages
        if (response.error?.includes('cannot be cancelled once it has been given')) {
          toast.error('This order cannot be cancelled once it has been given to the employee');
        } else if (response.error?.includes('cannot be cancelled')) {
          toast.error('This order cannot be cancelled in its current status');
        } else {
          toast.error(response.error || 'Failed to send cancellation request');
        }
      }
    } catch (error: any) {
      console.error('Cancel order error:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Failed to send cancellation request';
      
      // Show user-friendly error messages
      if (errorMessage.includes('cannot be cancelled once it has been given')) {
        toast.error('This order cannot be cancelled once it has been given to the employee');
      } else if (errorMessage.includes('cannot be cancelled')) {
        toast.error('This order cannot be cancelled in its current status');
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const canCancelOrder = (order: Order) => {
    // Check if order status allows cancellation
    const cancellableStatuses = ['placed', 'preparing', 'prepared'];
    if (!cancellableStatuses.includes(order.status)) {
      return false;
    }

    // No time limit - can cancel anytime before 'given'
    return true;
  };

  const getCancelButtonText = (order: Order) => {
    if (!canCancelOrder(order)) {
      if (order.status === 'given') {
        return 'Already Given';
      }
      return 'Cannot Cancel';
    }
    return 'Request Cancel';
  };

  const getStatusBadge = (status: OrderStatus) => {
    const statusConfig = {
      placed: { variant: 'primary' as const, icon: Clock, text: 'Placed' },
      preparing: { variant: 'warning' as const, icon: Clock, text: 'Preparing' },
      prepared: { variant: 'warning' as const, icon: CheckCircle, text: 'Prepared' },
      given: { variant: 'success' as const, icon: CheckCircle, text: 'Given' },
      cancelled: { variant: 'danger' as const, icon: XCircle, text: 'Cancelled' },
      cancel_requested: { variant: 'warning' as const, icon: XCircle, text: 'Cancel Requested' },
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
        <p className="text-gray-600 mt-1">Track your order history</p>
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
                    {order.vendor?.name || 'Unknown Vendor'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">
                    ₹{order.total_amount.toFixed(2)}
                  </p>
                  {(order.status === 'placed' || order.status === 'preparing' || order.status === 'prepared') && (
                    <Button
                      size="sm"
                      variant={canCancelOrder(order) ? "danger" : "secondary"}
                      onClick={() => canCancelOrder(order) && handleCancelOrder(order.id)}
                      disabled={!canCancelOrder(order)}
                      className="mt-2"
                      title={!canCancelOrder(order) ? 
                        (order.status === 'given' ? 
                          'Order has already been given to employee' : 
                          'Order cannot be cancelled in current status') : 
                        'Request cancellation for this order'
                      }
                    >
                      {getCancelButtonText(order)}
                    </Button>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Order Items</h4>
                <div className="space-y-2">
                  {order.order_items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {item.menu_items?.name || 'Unknown Item'} x{item.quantity}
                      </span>
                      <span className="font-medium">₹{item.total_cost.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {orders.length === 0 && (
        <Card>
          <CardBody className="text-center py-12">
            <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-500 mb-6">Start ordering from vendors</p>
            <Button onClick={() => (window.location.href = '/employee/dashboard')}>
              Browse Vendors
            </Button>
          </CardBody>
        </Card>
      )}
    </div>
  );
};
