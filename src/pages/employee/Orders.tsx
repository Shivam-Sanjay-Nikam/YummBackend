import React, { useEffect, useState } from 'react';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ShoppingBag, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Order, OrderStatus } from '../../types';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { confirmManager } from '../../components/ui/ConfirmDialog';
import { useRealtimeOrders } from '../../hooks/useRealtimeData';
import { useRealtimeBalance } from '../../hooks/useRealtimeBalance';
import toast from 'react-hot-toast';

export const EmployeeOrders: React.FC = () => {
  const { user, refreshUser } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  // Set up real-time subscription for orders
  useRealtimeOrders(() => {
    if (user) {
      loadOrders(); // This will also sync balance
    }
  });

  // Set up real-time subscription for balance updates
  useRealtimeBalance();

  const loadOrders = async () => {
    if (!user?.email) return;
    
    try {
      const { data, error } = await api.data.getOrders('employee', user.email);
      if (error) throw error;
      setOrders(data || []);
      
      // Refresh user data to get updated balance
      await refreshUser();
      
      // Sync employee balance after loading orders
      await syncEmployeeBalance();
    } catch (error: any) {
      toast.error('Failed to load orders');
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncEmployeeBalance = async () => {
    if (!user?.email) return;
    
    try {
      // Get current employee data
      const { data: employees, error: employeeError } = await api.data.getEmployees(user.email);
      if (employeeError || !employees || employees.length === 0) {
        console.error('Failed to get employee data for balance sync:', employeeError);
        return;
      }
      
      const employee = employees[0]; // Get the first (and should be only) employee

      // Calculate total amount from "given" orders
      const givenOrdersTotal = orders
        .filter(order => order.status === 'given')
        .reduce((total, order) => total + parseFloat(order.total_amount.toString()), 0);

      // Calculate current balance (assuming starting balance was 0 or some initial amount)
      // This is a simplified calculation - you might want to adjust based on your business logic
      const currentBalance = employee.balance;
      
      console.log('Employee balance sync:', {
        currentBalance,
        givenOrdersTotal,
        ordersCount: orders.length,
        givenOrdersCount: orders.filter(o => o.status === 'given').length
      });

      // Note: The actual balance update happens in the update_order_status function
      // This is just for logging and verification purposes
      
    } catch (error: any) {
      console.error('Error syncing employee balance:', error);
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
    <div className="space-y-4 sm:space-y-6">
      <div className="px-1">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Orders</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Track your order history</p>
          </div>
        </div>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {orders.map((order) => (
          <Card key={order.id} className="overflow-hidden">
            <CardBody className="p-4 sm:p-6">
              {/* Mobile-first header layout */}
              <div className="space-y-3 sm:space-y-0 sm:flex sm:items-start sm:justify-between">
                {/* Order info - stacked on mobile, side-by-side on desktop */}
                <div className="space-y-2 sm:space-y-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-2 sm:space-y-0">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                      Order #{order.id.slice(0, 8)}
                    </h3>
                    <div className="flex-shrink-0">
                      {getStatusBadge(order.status)}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    {order.vendors?.name || 'Unknown Vendor'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>

                {/* Price and cancel button - stacked on mobile */}
                <div className="flex flex-col sm:items-end space-y-2 sm:space-y-0">
                  <p className="text-xl sm:text-2xl font-bold text-green-600">
                    ₹{order.total_amount.toFixed(2)}
                  </p>
                  <div className="flex space-x-2">
                    {(order.status === 'placed' || order.status === 'preparing' || order.status === 'prepared') && (
                      <Button
                        size="sm"
                        variant={canCancelOrder(order) ? "danger" : "secondary"}
                        onClick={() => canCancelOrder(order) && handleCancelOrder(order.id)}
                        disabled={!canCancelOrder(order)}
                        className="flex-1 sm:flex-none text-xs sm:text-sm"
                        title={!canCancelOrder(order) ? 
                          'Order cannot be cancelled in current status' : 
                          'Request cancellation for this order'
                        }
                      >
                        {getCancelButtonText(order)}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Order items - mobile optimized */}
              <div className="border-t border-gray-200 pt-3 sm:pt-4 mt-3 sm:mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2 sm:mb-3">Order Items</h4>
                <div className="space-y-2">
                  {order.order_items?.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-sm bg-gray-50 rounded-lg p-2 sm:p-3">
                      <div className="flex-1 min-w-0">
                        <span className="text-gray-700 font-medium block truncate">
                          {item.menu_items?.name || 'Unknown Item'}
                        </span>
                        <span className="text-xs text-gray-500">Qty: {item.quantity}</span>
                      </div>
                      <span className="font-semibold text-green-600 ml-2 flex-shrink-0">
                        ₹{item.total_cost.toFixed(2)}
                      </span>
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
          <CardBody className="text-center py-8 sm:py-12 px-4">
            <ShoppingBag className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
            <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6">Start ordering from vendors</p>
            <Button 
              onClick={() => (window.location.href = '/employee/dashboard')}
              className="w-full sm:w-auto"
            >
              Browse Vendors
            </Button>
          </CardBody>
        </Card>
      )}

    </div>
  );
};
