import React, { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Users, Store, IndianRupee, ShoppingCart, RefreshCw } from 'lucide-react';
import { DashboardStats } from '../../types';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

export const StaffDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({
    total_orders: 0,
    total_revenue: 0,
    total_employees: 0,
    total_vendors: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    if (!user?.email) return;
    
    try {
      // Get employees count
      const { data: employees, error: employeesError } = await api.data.getEmployees(user.email);
      if (employeesError) throw employeesError;

      // Get vendors count
      const { data: vendors, error: vendorsError } = await api.data.getVendorsForStaff(user.email);
      if (vendorsError) throw vendorsError;

      // Get orders count and revenue
      const { data: orders, error: ordersError } = await api.data.getOrders('organization_staff', user.email);
      if (ordersError) throw ordersError;

      const totalRevenue = orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0;

      setStats({
        total_orders: orders?.length || 0,
        total_revenue: totalRevenue,
        total_employees: employees?.length || 0,
        total_vendors: vendors?.length || 0,
      });
    } catch (error: any) {
      toast.error('Failed to load dashboard stats');
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Orders',
      value: stats.total_orders,
      icon: ShoppingCart,
      color: 'blue',
    },
    {
      title: 'Total Revenue',
      value: `₹${stats.total_revenue.toFixed(2)}`,
      icon: IndianRupee,
      color: 'green',
    },
    {
      title: 'Total Employees',
      value: stats.total_employees,
      icon: Users,
      color: 'orange',
    },
    {
      title: 'Total Vendors',
      value: stats.total_vendors,
      icon: Store,
      color: 'purple',
    },
  ];

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    purple: 'bg-purple-100 text-purple-600',
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of your organization</p>
        </div>
        <Button 
          onClick={loadStats} 
          variant="outline" 
          size="sm"
          loading={loading}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        </CardHeader>
        <CardBody className="space-y-3">
          <QuickActionButton icon={Users} text="Add Employee" href="/staff/employees" />
          <QuickActionButton icon={Store} text="Add Vendor" href="/staff/vendors" />
        </CardBody>
      </Card>
    </div>
  );
};

const QuickActionButton: React.FC<{ icon: any; text: string; href: string }> = ({
  icon: Icon,
  text,
  href,
}) => {
  return (
    <a
      href={href}
      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
    >
      <Icon className="w-5 h-5 text-gray-600" />
      <span className="text-sm font-medium text-gray-900">{text}</span>
    </a>
  );
};
