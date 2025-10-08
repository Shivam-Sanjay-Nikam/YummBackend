import React, { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { 
  BarChart3, 
  Download, 
  Calendar, 
  Filter, 
  TrendingUp, 
  Store, 
  Users, 
  IndianRupee,
  FileSpreadsheet,
  RefreshCw
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

interface SalesData {
  vendor_id: string;
  vendor_name: string;
  total_sales: number;
  order_count: number;
  transactions: Transaction[];
}

interface Transaction {
  id: string;
  employee_email: string;
  vendor_name: string;
  amount: number;
  order_date: string;
  status: string;
}

interface SummaryData {
  total_sales: number;
  total_orders: number;
  active_vendors: number;
  date_range: {
    from: string;
    to: string;
  };
}

export const StaffSales: React.FC = () => {
  const { user } = useAuthStore();
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<string>('all');
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    if (user) {
      // Set default date range (last 30 days)
      const today = new Date();
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      const todayStr = today.toISOString().split('T')[0];
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
      
      console.log('Setting default dates:', { from: thirtyDaysAgoStr, to: todayStr });
      
      setDateTo(todayStr);
      setDateFrom(thirtyDaysAgoStr);
      
      // Load data with the set dates
      loadSalesDataWithDates(thirtyDaysAgoStr, todayStr);
    }
  }, [user]);

  const loadSalesDataWithDates = async (fromDate: string, toDate: string) => {
    if (!user?.email) {
      console.log('No user email found');
      return;
    }
    
    console.log('Loading sales data for user:', user.email, 'role:', user.role);
    
    setLoading(true);
    try {
      const vendorFilter = selectedVendor === 'all' ? undefined : selectedVendor;
      const { data, error } = await api.data.getSalesData(user.email, fromDate, toDate, vendorFilter);
      if (error) {
        console.error('Sales data error:', error);
        toast.error(`Failed to load sales data: ${error}`);
        return;
      }
      console.log('Sales data loaded successfully:', data);
      console.log('Sales data array:', data?.sales_data);
      console.log('Is sales_data an array?', Array.isArray(data?.sales_data));
      setSalesData(data?.sales_data || []);
      setSummaryData(data?.summary || null);
    } catch (error: any) {
      toast.error('Failed to load sales data');
      console.error('Error loading sales data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSalesData = async () => {
    if (!user?.email || !dateFrom || !dateTo) return;
    
    setLoading(true);
    try {
      const vendorFilter = selectedVendor === 'all' ? undefined : selectedVendor;
      const { data, error } = await api.data.getSalesData(user.email, dateFrom, dateTo, vendorFilter);
      if (error) throw error;
      setSalesData(data || []);
    } catch (error: any) {
      toast.error('Failed to load sales data');
      console.error('Error loading sales data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateFilter = () => {
    if (!dateFrom || !dateTo) {
      toast.error('Please select both start and end dates');
      return;
    }
    if (new Date(dateFrom) > new Date(dateTo)) {
      toast.error('Start date cannot be after end date');
      return;
    }
    loadSalesData();
  };

  const generateReport = () => {
    const allTransactions = salesData.flatMap(vendor => vendor.transactions);
    
    if (allTransactions.length === 0) {
      toast.error('No transactions found for the selected period');
      return;
    }

    // Create CSV content
    const csvContent = [
      'Employee Email,Vendor Name,Amount,Order Date,Status',
      ...allTransactions.map(transaction => 
        `"${transaction.employee_email}","${transaction.vendor_name}","${transaction.amount}","${transaction.order_date}","${transaction.status}"`
      )
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sales-report-${dateFrom}-to-${dateTo}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast.success('Sales report downloaded successfully');
  };

  const filteredSalesData = selectedVendor === 'all' 
    ? (Array.isArray(salesData) ? salesData : [])
    : (Array.isArray(salesData) ? salesData.filter(vendor => vendor.vendor_id === selectedVendor) : []);
  
  console.log('Current salesData:', salesData);
  console.log('Is salesData an array?', Array.isArray(salesData));
  console.log('Filtered sales data:', filteredSalesData);

  // Use summary data for 'all' vendors, calculate for specific vendor
  const totalSales = selectedVendor === 'all' && summaryData 
    ? summaryData.total_sales 
    : filteredSalesData.reduce((sum, vendor) => sum + vendor.total_sales, 0);
  
  const totalOrders = selectedVendor === 'all' && summaryData 
    ? summaryData.total_orders 
    : filteredSalesData.reduce((sum, vendor) => sum + vendor.order_count, 0);
  
  const activeVendors = selectedVendor === 'all' && summaryData 
    ? summaryData.active_vendors 
    : filteredSalesData.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales Analytics</h1>
          <p className="text-gray-600 mt-1">Vendor-wise sales performance and detailed reports</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button
            onClick={generateReport}
            className="flex items-center space-x-2"
            disabled={salesData.length === 0}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Generate Report</span>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardBody className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-gray-900">₹{totalSales.toFixed(2)}</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-center space-x-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-center space-x-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Store className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Active Vendors</p>
              <p className="text-2xl font-bold text-gray-900">{activeVendors}</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
              <select
                value={selectedVendor}
                onChange={(e) => setSelectedVendor(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Vendors</option>
                {Array.isArray(salesData) && salesData.map(vendor => (
                  <option key={vendor.vendor_id} value={vendor.vendor_id}>
                    {vendor.vendor_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleDateFilter} className="w-full">
                <Filter className="w-4 h-4 mr-2" />
                Apply Filter
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Sales Data */}
      <div className="space-y-4">
        {filteredSalesData.map((vendor) => (
          <Card key={vendor.vendor_id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Store className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{vendor.vendor_name}</h3>
                    <p className="text-sm text-gray-600">{vendor.order_count} orders</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">₹{vendor.total_sales.toFixed(2)}</p>
                  <p className="text-sm text-gray-500">Total Sales</p>
                </div>
              </div>
            </CardHeader>
            <CardBody>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 font-medium text-gray-700">Employee Email</th>
                      <th className="text-left py-2 font-medium text-gray-700">Amount</th>
                      <th className="text-left py-2 font-medium text-gray-700">Date</th>
                      <th className="text-left py-2 font-medium text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendor.transactions.map((transaction) => (
                      <tr key={transaction.id} className="border-b border-gray-100">
                        <td className="py-2 text-gray-900">{transaction.employee_email}</td>
                        <td className="py-2 font-medium text-green-600">₹{transaction.amount.toFixed(2)}</td>
                        <td className="py-2 text-gray-600">{new Date(transaction.order_date).toLocaleDateString()}</td>
                        <td className="py-2">
                          <Badge variant={transaction.status === 'given' ? 'success' : 'warning'}>
                            {transaction.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {filteredSalesData.length === 0 && (
        <Card>
          <CardBody className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No sales data found</h3>
            <p className="text-gray-500 mb-6">Try adjusting your date range or filters</p>
            <Button onClick={loadSalesData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Data
            </Button>
          </CardBody>
        </Card>
      )}
    </div>
  );
};
