import React, { useEffect, useState } from 'react';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Clock, CheckCircle, XCircle, List, ChevronDown, Trash2 } from 'lucide-react';
import { Order, OrderStatus } from '../../types';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

export const VendorOrders: React.FC = () => {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ orderId: string; orderNumber: string } | null>(null);

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

  const handleUpdateStatus = async (orderId: string, status: OrderStatus) => {
    setUpdatingStatus(orderId);
    try {
      await api.vendor.updateOrderStatus({ order_id: orderId, status });
      toast.success('Order status updated successfully');
      loadOrders();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update order status');
    } finally {
      setUpdatingStatus(null);
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

  const handleDeleteOrder = async (orderId: string) => {
    setDeletingOrder(orderId);
    try {
      await api.vendor.deleteOrder({ order_id: orderId });
      toast.success('Order deleted successfully');
      loadOrders();
      setShowDeleteConfirm(null);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete order');
    } finally {
      setDeletingOrder(null);
    }
  };

  const canDeleteOrder = (status: OrderStatus) => {
    return true; // Allow deletion of orders with any status
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

  const StatusDropdown: React.FC<{ order: Order }> = ({ order }) => {
    const allStatuses: OrderStatus[] = ['placed', 'preparing', 'prepared', 'given', 'cancelled', 'cancel_requested'];
    const isUpdating = updatingStatus === order.id;
    
    return (
      <div className="relative inline-block">
        <select
          value={order.status}
          onChange={(e) => handleUpdateStatus(order.id, e.target.value as OrderStatus)}
          disabled={isUpdating}
          className={`appearance-none bg-white border border-gray-300 rounded-md px-3 py-1 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            isUpdating ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {allStatuses.map((status) => (
            <option key={status} value={status}>
              {getStatusBadge(status).props.children[1]}
            </option>
          ))}
        </select>
        {isUpdating ? (
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
          </div>
        ) : (
          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Show ALL orders, sorted by oldest first
  const allOrdersSorted = [...orders].sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="px-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">All Orders</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">Manage all your orders</p>
      </div>

      {/* Orders Table - Mobile Friendly */}
      <div className="space-y-4">
        <Card>
          <CardBody className="p-2 sm:p-4 lg:p-6">
            {/* Mobile Card Layout */}
            <div className="block sm:hidden space-y-4">
              {allOrdersSorted.map((order) => (
                <div key={order.id} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">
                      Order #{order.id.slice(0, 8)}
                    </h3>
                    <StatusDropdown order={order} />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Customer:</span>
                      <span className="font-medium">{order.employees?.name || 'Unknown'}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-bold text-green-600">₹{order.total_amount.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Date:</span>
                      <span className="text-gray-500">{new Date(order.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="border-t pt-3">
                    <div className="text-sm font-medium text-gray-700 mb-2">Items:</div>
                    <div className="space-y-1">
                      {order.order_items.map((item) => (
                        <div key={item.id} className="text-xs text-gray-600">
                          {item.menu_items?.name || 'Unknown Item'} x{item.quantity}
                        </div>
                      ))}
                    </div>
                  </div>

                  {(order.status === 'cancel_requested' || canDeleteOrder(order.status)) && (
                    <div className="border-t pt-3">
                      <div className="flex flex-col space-y-2">
                        {order.status === 'cancel_requested' && (
                          <>
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() => handleCancelRequest(order.id, 'accept')}
                              className="text-xs w-full"
                            >
                              Accept Cancellation
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCancelRequest(order.id, 'reject')}
                              className="text-xs w-full"
                            >
                              Reject Cancellation
                            </Button>
                          </>
                        )}
                        {canDeleteOrder(order.status) && (
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => setShowDeleteConfirm({ 
                              orderId: order.id, 
                              orderNumber: order.id.slice(0, 8) 
                            })}
                            disabled={deletingOrder === order.id}
                            className="text-xs w-full"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete Order
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop Table Layout */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allOrdersSorted.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{order.id.slice(0, 8)}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.employees?.name || 'Unknown'}
                      </td>
                      <td className="hidden sm:table-cell px-6 py-4 text-sm text-gray-900">
                        <div className="space-y-1">
                          {order.order_items.map((item) => (
                            <div key={item.id} className="text-xs">
                              {item.menu_items?.name || 'Unknown Item'} x{item.quantity}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        ₹{order.total_amount.toFixed(2)}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <StatusDropdown order={order} />
                      </td>
                      <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-2">
                          {order.status === 'cancel_requested' && (
                            <>
                              <Button
                                size="sm"
                                variant="success"
                                onClick={() => handleCancelRequest(order.id, 'accept')}
                                className="text-xs"
                              >
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCancelRequest(order.id, 'reject')}
                                className="text-xs"
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          {canDeleteOrder(order.status) && (
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => setShowDeleteConfirm({ 
                                orderId: order.id, 
                                orderNumber: order.id.slice(0, 8) 
                              })}
                              disabled={deletingOrder === order.id}
                              className="text-xs"
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Delete
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>

        {allOrdersSorted.length === 0 && (
          <Card>
            <CardBody className="text-center py-8 sm:py-12">
              <List className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
              <p className="text-gray-500">Orders will appear here when customers place them.</p>
            </CardBody>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-red-100 rounded-full mr-3">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Order</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete order <span className="font-semibold">#{showDeleteConfirm.orderNumber}</span>? 
              This action cannot be undone.
            </p>
            
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1"
                disabled={deletingOrder === showDeleteConfirm.orderId}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => handleDeleteOrder(showDeleteConfirm.orderId)}
                loading={deletingOrder === showDeleteConfirm.orderId}
                className="flex-1"
              >
                Delete Order
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
