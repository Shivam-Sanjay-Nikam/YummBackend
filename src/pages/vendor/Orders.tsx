import React, { useEffect, useState, useMemo, useCallback, memo } from 'react';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { SearchInput } from '../../components/ui/SearchInput';
import { DateRangeFilter } from '../../components/ui/DateRangeFilter';
import { FilterBar } from '../../components/ui/FilterBar';
import { Clock, CheckCircle, XCircle, List, ChevronDown, Trash2, Menu, X, MessageSquare } from 'lucide-react';
import { Order, OrderStatus } from '../../types';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useRealtimeOrders } from '../../hooks/useRealtimeData';
import { useSearchAndFilter } from '../../hooks/useSearchAndFilter';
import toast from 'react-hot-toast';

// ---------- StatusDropdown at module scope ----------
type StatusDropdownProps = {
  orderId: string;
  status: OrderStatus;
  isUpdating: boolean;
  onStatusChange: (orderId: string, status: OrderStatus) => void;
};

export const StatusDropdown = memo<StatusDropdownProps>(({ orderId, status, isUpdating, onStatusChange }) => {
  const handleDropdownChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    const newStatus = e.target.value as OrderStatus;
    if (newStatus !== status) {
      // Call the handler immediately for instant UI update
      onStatusChange(orderId, newStatus);
    }
  }, [orderId, onStatusChange, status]);

  // Prevent parent click handlers from closing the select preemptively
  const stop = useCallback((e: React.MouseEvent) => e.stopPropagation(), []);

  return (
    <div className="relative inline-block" onClick={stop} onMouseDown={stop}>
      <select
        value={status}
        onChange={handleDropdownChange}
        onClick={stop}
        onMouseDown={stop}
        disabled={isUpdating}
        aria-label={`Change status for order ${orderId}`}
        className={`appearance-none bg-white border rounded-md px-2 sm:px-3 py-1.5 pr-6 sm:pr-8 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-0 transition-all duration-150 ${
          isUpdating 
            ? 'opacity-50 cursor-not-allowed border-blue-300 bg-blue-50' 
            : 'border-gray-300 hover:border-blue-400'
        }`}
      >
        <option value="placed">Placed</option>
        <option value="preparing">Preparing</option>
        <option value="prepared">Prepared</option>
        <option value="given">Given</option>
        <option value="cancelled">Cancelled</option>
        <option value="cancel_requested">Cancel Requested</option>
      </select>

      {isUpdating ? (
        <div className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-blue-500 border-t-transparent" />
        </div>
      ) : (
        <ChevronDown className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-gray-400 pointer-events-none" />
      )}
    </div>
  );
});

export const VendorOrders: React.FC = () => {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ orderId: string; orderNumber: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'placed' | 'preparing' | 'prepared' | 'given' | 'cancelled' | 'cancel_requested'>('all');
  const [currentView, setCurrentView] = useState<'dashboard' | 'orders'>('dashboard');
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(10);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isTabLoading, setIsTabLoading] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [orderFeedback, setOrderFeedback] = useState<Record<string, any>>({});
  const [feedbackLoaded, setFeedbackLoaded] = useState(false);
  const [showAllFeedback, setShowAllFeedback] = useState(false);
  const [allFeedback, setAllFeedback] = useState<any[]>([]);

  // Search and filter state
  const { state, updateFilter, clearAllFilters, hasActiveFilters } = useSearchAndFilter();
  
  // Debounced search term to prevent excessive filtering
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(state.searchTerm);
  
  useEffect(() => {
    // Show search loading when user starts typing
    if (state.searchTerm && state.searchTerm !== debouncedSearchTerm) {
      setIsSearchLoading(true);
    }
    
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(state.searchTerm);
      setIsSearchLoading(false);
    }, 300); // 300ms delay
    
    return () => clearTimeout(timer);
  }, [state.searchTerm, debouncedSearchTerm]);

  // Handle tab switching with loading state
  const handleTabChange = useCallback((tab: typeof activeTab) => {
    if (tab === activeTab) return;
    
    setIsTabLoading(true);
    setActiveTab(tab);
    
    // Simulate loading time for better UX
    setTimeout(() => {
      setIsTabLoading(false);
    }, 200);
  }, [activeTab]);

  // Handle date range changes with loading state
  const handleDateRangeChange = useCallback((from: Date | null, to: Date | null) => {
    setIsFilterLoading(true);
    updateFilter('dateFrom', from);
    updateFilter('dateTo', to);
    
    // Simulate loading time for better UX
    setTimeout(() => {
      setIsFilterLoading(false);
    }, 300);
  }, [updateFilter]);

  // Feedback handling functions - Read Only for Vendors
  const handleToggleOrderExpansion = useCallback((orderId: string) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
    } else {
      setExpandedOrder(orderId);
    }
  }, [expandedOrder]);

  const handleViewAllFeedback = useCallback(async () => {
    setShowAllFeedback(!showAllFeedback);
    if (!showAllFeedback && allFeedback.length === 0) {
      try {
        // const response = await api.feedback.get();
        // if (response.data?.data?.feedback) {
        //   setAllFeedback(response.data.data.feedback);
        // }
        setAllFeedback([]); // No feedback functionality
      } catch (error) {
        console.error('Error loading all feedback:', error);
        toast.error('Failed to load feedback');
      }
    }
  }, [showAllFeedback, allFeedback.length]);

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  // Set up real-time subscription for orders
  useRealtimeOrders(() => {
    if (user) {
      loadOrders();
    }
  });

  const loadOrders = useCallback(async () => {
    if (!user?.email) return;
    
    try {
      const { data, error } = await api.data.getOrders('vendor', user.email);
      if (error) throw error;
      setOrders(data || []);
      // Load feedback for all orders at once
      loadAllFeedback(data || []);
    } catch (error: any) {
      toast.error('Failed to load orders');
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  const loadAllFeedback = useCallback(async (_orders: Order[]) => {
    if (!user?.email || feedbackLoaded) return;
    
    try {
      // const orderIds = orders.map(order => order.id);
      // const response = await api.feedback.get();
      
      // if (response.data?.data?.feedback) {
      //   const feedbackMap: Record<string, any> = {};
      //   response.data.data.feedback.forEach((feedback: any) => {
      //     if (orderIds.includes(feedback.order_id)) {
      //       feedbackMap[feedback.order_id] = feedback;
      //     }
      //   });
      //   setOrderFeedback(feedbackMap);
      //   setFeedbackLoaded(true);
      // }
      setOrderFeedback({}); // No feedback functionality
      setFeedbackLoaded(true);
    } catch (error) {
      console.error('Error loading feedback:', error);
    }
  }, [user?.email, feedbackLoaded]);

  const handleUpdateStatus = useCallback(async (orderId: string, status: OrderStatus) => {
    setUpdatingStatus(orderId);
    
    // Optimistic update - update UI immediately
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId 
          ? { ...order, status, updated_at: new Date().toISOString() }
          : order
      )
    );

    try {
      const response = await api.vendor.updateOrderStatus({ order_id: orderId, status });

      // Check if the response indicates an error
      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast.success('Order status updated successfully');
      
      // Reload orders in background to ensure data consistency
      setTimeout(() => loadOrders(), 1000);
    } catch (error: any) {
      console.error('Status update error:', error);
      toast.error(error.message || error.response?.data?.error || 'Failed to update order status');
      
      // Revert optimistic update on error
      loadOrders();
    } finally {
      setUpdatingStatus(null);
    }
  }, [loadOrders]);

  const handleQuickStatusUpdate = useCallback(async (orderId: string, status: OrderStatus) => {
    if (updatingStatus === orderId) return; // Prevent multiple simultaneous updates

    setUpdatingStatus(orderId);
    try {
      await api.vendor.updateOrderStatus({ order_id: orderId, status });

      // Optimistic update - update UI immediately
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status, updated_at: new Date().toISOString() }
            : order
        )
      );

      // Show success toast
      const statusText = status === 'prepared' ? 'Prepared' :
                        status === 'given' ? 'Given' :
                        status === 'preparing' ? 'Preparing' : status;
      toast.success(`Order marked as ${statusText}`);

      // Reload orders in background to ensure data consistency
      setTimeout(() => loadOrders(), 1000);
    } catch (error: any) {
      console.error('Quick status update error:', error);
      toast.error(error.message || error.response?.data?.error || 'Failed to update order status');
      
      // Revert optimistic update on error
      loadOrders();
    } finally {
      setUpdatingStatus(null);
    }
  }, [updatingStatus, setOrders, loadOrders]);

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

  const canDeleteOrder = () => {
    return true; // Allow deletion of orders with any status
  };

  // Get active orders (placed, preparing, prepared)
  const activeOrders = useMemo(() => {
    if (!orders.length) return [];
    
    const activeStatuses = ['placed', 'preparing', 'prepared'];
    return orders
      .filter(order => activeStatuses.includes(order.status))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [orders]);

  // Filter and search orders - optimized
  const filteredOrders = useMemo(() => {
    if (!orders.length) return [];

    let filtered = orders;

    // Status filter (from active tab)
    if (activeTab !== 'all') {
      filtered = filtered.filter(order => order.status === activeTab);
    }

    // Search filter - only if search term exists (using debounced term)
    if (debouncedSearchTerm?.trim()) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(searchLower) ||
        order.employees?.name?.toLowerCase().includes(searchLower) ||
        order.employees?.email?.toLowerCase().includes(searchLower)
      );
    }

    // Date range filter - only if dates exist
    if (state.dateFrom || state.dateTo) {
      const fromTime = state.dateFrom ? new Date(state.dateFrom).getTime() : 0;
      const toTime = state.dateTo ? new Date(state.dateTo).getTime() : Infinity;
      
      filtered = filtered.filter(order => {
        const orderTime = new Date(order.created_at).getTime();
        return orderTime >= fromTime && orderTime <= toTime;
      });
    }

    // Sort by newest first (optimized)
    return filtered.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [orders, activeTab, debouncedSearchTerm, state.dateFrom, state.dateTo]);

  // Pagination logic
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * ordersPerPage;
    return filteredOrders.slice(startIndex, startIndex + ordersPerPage);
  }, [filteredOrders, currentPage, ordersPerPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, debouncedSearchTerm, state.dateFrom, state.dateTo]);



  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Get order counts for each tab (using original orders, not filtered)
  const getOrderCounts = () => {
    return {
      all: orders.length,
      placed: orders.filter(o => o.status === 'placed').length,
      preparing: orders.filter(o => o.status === 'preparing').length,
      prepared: orders.filter(o => o.status === 'prepared').length,
      given: orders.filter(o => o.status === 'given').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
      cancel_requested: orders.filter(o => o.status === 'cancel_requested').length,
    };
  };

  const orderCounts = getOrderCounts();

  const handleTabSelect = (tabKey: typeof activeTab) => {
    setActiveTab(tabKey);
    setIsMobileNavOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="px-1">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Orders</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Manage your orders efficiently</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'dashboard'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setCurrentView('orders')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'orders'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All Orders
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Active Orders Quick View - Dashboard Only */}
      {currentView === 'dashboard' && activeOrders.length > 0 && (
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-blue-600" />
                Active Orders ({activeOrders.length})
              </h2>
              <Badge variant="primary" className="text-sm">
                {activeOrders.filter(o => o.status === 'placed').length} New
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeOrders.map((order) => (
                <div key={order.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200 hover:shadow-md transition-all duration-200 transform hover:scale-[1.02]">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">#{order.id.slice(0, 8)}</p>
                      <p className="text-xs text-gray-600">{order.employees?.name || 'Unknown'}</p>
                    </div>
                    <Badge 
                      variant={order.status === 'placed' ? 'primary' : order.status === 'preparing' ? 'warning' : 'success'}
                      className="text-xs"
                    >
                      {order.status === 'placed' ? 'New' : order.status === 'preparing' ? 'Preparing' : 'Prepared'}
                    </Badge>
                  </div>
                  
                  <div className="text-xs text-gray-600 mb-3">
                    {order.order_items?.slice(0, 2).map((item) => (
                      <div key={item.id}>
                        {item.menu_items?.name} x{item.quantity}
                      </div>
                    ))}
                    {order.order_items && order.order_items.length > 2 && (
                      <div>+{order.order_items.length - 2} more items</div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-green-600">
                      ₹{order.total_amount.toFixed(2)}
                    </span>
                    <div className="flex space-x-1">
                      {/* Button 1: Mark Ready (for placed/preparing orders) */}
                      {(order.status === 'placed' || order.status === 'preparing') && (
                        <button
                          type="button"
                          onClick={() => handleQuickStatusUpdate(order.id, 'prepared')}
                          disabled={updatingStatus === order.id}
                          className="px-2 py-1 text-xs bg-orange-500 hover:bg-orange-600 text-white rounded disabled:opacity-50 transition-colors duration-150"
                        >
                          {updatingStatus === order.id ? '...' : 'Ready'}
                        </button>
                      )}
                      
                      {/* Button 2: Mark Given (for prepared orders) */}
                      {order.status === 'prepared' && (
                        <button
                          type="button"
                          onClick={() => handleQuickStatusUpdate(order.id, 'given')}
                          disabled={updatingStatus === order.id}
                          className="px-2 py-1 text-xs bg-green-500 hover:bg-green-600 text-white rounded disabled:opacity-50 transition-colors duration-150"
                        >
                          {updatingStatus === order.id ? '...' : 'Given'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 text-center">
              <button
                onClick={() => setCurrentView('orders')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View all {orders.length} orders →
              </button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Search and Filter Bar - Orders View Only */}
      {currentView === 'orders' && (
        <FilterBar onClear={clearAllFilters} showClearButton={hasActiveFilters}>
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-5">
              <h4 className="text-base font-semibold text-gray-900">Search Orders</h4>
              <SearchInput
                placeholder="Search by order number or employee name..."
                value={state.searchTerm}
                onChange={(value) => updateFilter('searchTerm', value)}
                size="md"
                isLoading={isSearchLoading}
              />
            </div>
            <div className="space-y-5">
              <h4 className="text-base font-semibold text-gray-900">Date Range</h4>
              <DateRangeFilter
                fromDate={state.dateFrom}
                toDate={state.dateTo}
                onFromDateChange={(date) => handleDateRangeChange(date ? new Date(date) : null, state.dateTo ? new Date(state.dateTo) : null)}
                onToDateChange={(date) => handleDateRangeChange(state.dateFrom ? new Date(state.dateFrom) : null, date ? new Date(date) : null)}
                onClear={() => {
                  updateFilter('dateFrom', '');
                  updateFilter('dateTo', '');
                }}
                size="md"
                isLoading={isFilterLoading}
              />
            </div>
          </div>
          <div className="flex items-center justify-between pt-6 border-t border-gray-100">
            <div className="text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{filteredOrders.length}</span> of <span className="font-semibold text-gray-900">{orders.length}</span> orders
            </div>
          </div>
        </div>
      </FilterBar>
      )}

      {/* Mobile Tab Navigation - Orders View Only */}
      {currentView === 'orders' && (
        <div className="sm:hidden">
        {/* Mobile Tab Header */}
        <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <List className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {[
                  { key: 'all', label: 'All Orders' },
                  { key: 'placed', label: 'Placed Orders' },
                  { key: 'preparing', label: 'Preparing Orders' },
                  { key: 'prepared', label: 'Prepared Orders' },
                  { key: 'given', label: 'Given Orders' },
                  { key: 'cancelled', label: 'Cancelled Orders' },
                  { key: 'cancel_requested', label: 'Cancel Requests' },
                ].find(tab => tab.key === activeTab)?.label}
              </h3>
              <p className="text-xs text-gray-500">
                {orderCounts[activeTab]} order{orderCounts[activeTab] !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {isMobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Tab Menu */}
        {isMobileNavOpen && (
          <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg">
            <div className="p-2">
              {[
                { key: 'placed', label: 'Placed', count: orderCounts.placed, icon: Clock, color: 'blue' },
                { key: 'preparing', label: 'Preparing', count: orderCounts.preparing, icon: Clock, color: 'orange' },
                { key: 'prepared', label: 'Prepared', count: orderCounts.prepared, icon: CheckCircle, color: 'orange' },
                { key: 'given', label: 'Given', count: orderCounts.given, icon: CheckCircle, color: 'green' },
                { key: 'cancelled', label: 'Cancelled', count: orderCounts.cancelled, icon: XCircle, color: 'red' },
                { key: 'cancel_requested', label: 'Cancel Requests', count: orderCounts.cancel_requested, icon: XCircle, color: 'orange' },
                { key: 'all', label: 'All Orders', count: orderCounts.all, icon: List, color: 'gray' },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => handleTabSelect(tab.key as any)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        isActive ? 'bg-blue-100' : `bg-${tab.color}-100`
                      }`}>
                        <Icon className={`w-4 h-4 ${
                          isActive ? 'text-blue-600' : `text-${tab.color}-600`
                        }`} />
                      </div>
                      <span className="text-sm font-medium">{tab.label}</span>
                    </div>
                    {tab.count > 0 && (
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        isActive
                          ? 'bg-blue-200 text-blue-800'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
      )}

      {/* Desktop Tab Navigation - Orders View Only */}
      {currentView === 'orders' && (
        <div className="hidden sm:block border-b border-gray-200">
        <nav className="-mb-px flex space-x-4 lg:space-x-8">
          {[
            { key: 'placed', label: 'Placed', count: orderCounts.placed },
            { key: 'preparing', label: 'Preparing', count: orderCounts.preparing },
            { key: 'prepared', label: 'Prepared', count: orderCounts.prepared },
            { key: 'given', label: 'Given', count: orderCounts.given },
            { key: 'cancelled', label: 'Cancelled', count: orderCounts.cancelled },
            { key: 'cancel_requested', label: 'Cancel Requests', count: orderCounts.cancel_requested },
            { key: 'all', label: 'All Orders', count: orderCounts.all },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key as any)}
              disabled={isTabLoading}
              className={`py-2 px-3 lg:px-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } ${isTabLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                  activeTab === tab.key
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>
      )}

      {/* Orders Table - Mobile Friendly */}
      {currentView === 'orders' && (
      <div className="space-y-4">
        <Card>
          <CardBody className="p-2 sm:p-4 lg:p-6">
            {/* Mobile Card Layout */}
            <div className="block sm:hidden space-y-3">
              {paginatedOrders.map((order) => (
                <div key={order.id} className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        Order #{order.id.slice(0, 8)}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                    <div className="ml-2 flex-shrink-0">
                      <StatusDropdown 
                        orderId={order.id}
                        status={order.status}
                        isUpdating={updatingStatus === order.id}
                        onStatusChange={handleUpdateStatus}
                      />
                    </div>
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
                      {order.order_items?.map((item) => (
                        <div key={item.id} className="text-xs text-gray-600">
                          {item.menu_items?.name || 'Unknown Item'} x{item.quantity}
                        </div>
                      ))}
                    </div>
                  </div>

                  {(order.status === 'cancel_requested' || canDeleteOrder()) && (
                    <div className="border-t pt-3">
                      <div className="flex flex-col space-y-2">
                        {order.status === 'cancel_requested' && (
                          <>
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() => handleCancelRequest(order.id, 'accept')}
                              className="text-xs w-full h-10"
                            >
                              Accept Cancellation
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCancelRequest(order.id, 'reject')}
                              className="text-xs w-full h-10"
                            >
                              Reject Cancellation
                            </Button>
                          </>
                        )}
                        {canDeleteOrder() && (
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => setShowDeleteConfirm({ 
                              orderId: order.id, 
                              orderNumber: order.id.slice(0, 8) 
                            })}
                            disabled={deletingOrder === order.id}
                            className="text-xs w-full h-10"
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

            {/* Simplified Orders List */}
            <div className="space-y-3 relative">
              {/* Tab Loading Overlay */}
              {isTabLoading && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                    <span className="text-sm font-medium">
                      {activeTab === 'all' ? 'Loading all orders...' : 
                       activeTab === 'placed' ? 'Loading new orders...' :
                       activeTab === 'preparing' ? 'Loading preparing orders...' :
                       activeTab === 'prepared' ? 'Loading ready orders...' :
                       activeTab === 'given' ? 'Loading completed orders...' :
                       activeTab === 'cancelled' ? 'Loading cancelled orders...' :
                       activeTab === 'cancel_requested' ? 'Loading cancel requests...' :
                       'Loading orders...'}
                    </span>
                  </div>
                </div>
              )}
              
              {paginatedOrders.map((order) => (
                <Card key={order.id} className="hover:shadow-md transition-all duration-300 transform hover:scale-[1.02]">
                  <CardBody className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-sm font-semibold text-gray-900">
                            #{order.id.slice(0, 8)}
                          </h3>
                          <Badge 
                            variant={order.status === 'placed' ? 'primary' : 
                                   order.status === 'preparing' ? 'warning' : 
                                   order.status === 'prepared' ? 'warning' : 
                                   order.status === 'given' ? 'success' : 
                                   order.status === 'cancelled' ? 'danger' : 'warning'}
                            className="text-xs"
                          >
                            {order.status === 'placed' ? 'New' : 
                             order.status === 'preparing' ? 'Preparing' : 
                             order.status === 'prepared' ? 'Ready' : 
                             order.status === 'given' ? 'Given' : 
                             order.status === 'cancelled' ? 'Cancelled' : 'Cancel Requested'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          {order.employees?.name || 'Unknown Customer'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">
                          ₹{order.total_amount.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="mb-4">
                      <div className="text-xs text-gray-600 space-y-1">
                        {order.order_items?.map((item) => (
                          <div key={item.id} className="flex justify-between">
                            <span>{item.menu_items?.name || 'Unknown Item'}</span>
                            <span>x{item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons - Only 2 buttons */}
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-2">
                        {/* Button 1: Mark Ready (for placed/preparing orders) */}
                        {(order.status === 'placed' || order.status === 'preparing') && (
                          <button
                            type="button"
                            onClick={() => handleQuickStatusUpdate(order.id, 'prepared')}
                            disabled={updatingStatus === order.id}
                            className="px-3 py-1 text-xs bg-orange-500 hover:bg-orange-600 text-white rounded disabled:opacity-50 transition-colors duration-150"
                          >
                            {updatingStatus === order.id ? 'Updating...' : 'Mark Ready'}
                          </button>
                        )}
                        
                        {/* Button 2: Mark Given (for prepared orders) */}
                        {order.status === 'prepared' && (
                          <button
                            type="button"
                            onClick={() => handleQuickStatusUpdate(order.id, 'given')}
                            disabled={updatingStatus === order.id}
                            className="px-3 py-1 text-xs bg-green-500 hover:bg-green-600 text-white rounded disabled:opacity-50 transition-colors duration-150"
                          >
                            {updatingStatus === order.id ? 'Updating...' : 'Mark Given'}
                          </button>
                        )}
                      </div>

                      {/* Status Dropdown and Actions */}
                      <div className="flex items-center space-x-2">
                        <StatusDropdown 
                          orderId={order.id}
                          status={order.status}
                          isUpdating={updatingStatus === order.id}
                          onStatusChange={handleUpdateStatus}
                        />
                        
                        {/* Feedback Button - Read Only for Vendors */}
                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => handleToggleOrderExpansion(order.id)}
                            className={`relative p-1 transition-colors ${
                              expandedOrder === order.id
                                ? 'text-blue-500 hover:text-blue-600'
                                : orderFeedback[order.id] 
                                  ? 'text-blue-500 hover:text-blue-600' 
                                  : 'text-gray-400 hover:text-gray-500'
                            }`}
                            title={expandedOrder === order.id ? "Hide feedback" : orderFeedback[order.id] ? "View feedback" : "No feedback available"}
                          >
                            <MessageSquare className="w-4 h-4" />
                            {orderFeedback[order.id] && (
                              <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></div>
                            )}
                          </button>
                        </div>
                        
                        {canDeleteOrder() && (
                          <button
                            onClick={() => setShowDeleteConfirm({ 
                              orderId: order.id, 
                              orderNumber: order.id.slice(0, 8) 
                            })}
                            disabled={deletingOrder === order.id}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                            title="Delete order"
                            type="button"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Feedback Section - Expandable (Read Only for Vendors) */}
                    {expandedOrder === order.id && (
                      <div className="border-t border-gray-200 pt-4 mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Feedback</h4>
                        {orderFeedback[order.id] ? (
                          <div className="border border-gray-200 rounded-lg p-4">
                            <p className="text-sm text-gray-600">Feedback functionality has been removed.</p>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-lg">
                            <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                            <p>No feedback available for this order</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardBody>
                </Card>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Pagination Controls */}
        {filteredOrders.length > ordersPerPage && (
          <Card>
            <CardBody className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {((currentPage - 1) * ordersPerPage) + 1} to {Math.min(currentPage * ordersPerPage, filteredOrders.length)} of {filteredOrders.length} orders
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1 text-sm rounded-md ${
                            currentPage === pageNum
                              ? 'bg-blue-500 text-white'
                              : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    {totalPages > 5 && (
                      <>
                        <span className="text-gray-400">...</span>
                        <button
                          onClick={() => setCurrentPage(totalPages)}
                          className={`px-3 py-1 text-sm rounded-md ${
                            currentPage === totalPages
                              ? 'bg-blue-500 text-white'
                              : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                  </div>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {filteredOrders.length === 0 && (
          <Card>
            <CardBody className="text-center py-8 sm:py-12">
              <List className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {activeTab === 'all' ? 'No orders yet' : `No ${activeTab.replace('_', ' ')} orders`}
              </h3>
              <p className="text-gray-500">
                {activeTab === 'all' 
                  ? 'Orders will appear here when customers place them.'
                  : `No orders with "${activeTab.replace('_', ' ')}" status found.`
                }
              </p>
            </CardBody>
          </Card>
        )}
      </div>
      )}

      {/* All Feedback Section */}
      {showAllFeedback && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">All Customer Feedback</h3>
              <Button
                onClick={handleViewAllFeedback}
                size="sm"
                variant="outline"
                className="flex items-center space-x-1"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Refresh</span>
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            {allFeedback.length > 0 ? (
              <div className="space-y-4">
                {allFeedback.map((feedback) => (
                  <div key={feedback.id} className="border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Feedback functionality has been removed.</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No feedback received yet</p>
              </div>
            )}
          </CardBody>
        </Card>
      )}

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

