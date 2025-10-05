import React, { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { StaffDashboard } from './pages/staff/Dashboard';
import { StaffSales } from './pages/staff/Sales';
import { StaffEmployees } from './pages/staff/Employees';
import { StaffVendors } from './pages/staff/Vendors';
import { StaffManagement } from './pages/staff/StaffManagement';
import { OrganizationSettings } from './pages/staff/OrganizationSettings';
import { EmployeeBrowse } from './pages/employee/Browse';
import { EmployeeCart } from './pages/employee/Cart';
import { EmployeeOrders } from './pages/employee/Orders';
import { VendorDashboard } from './pages/vendor/Dashboard';
import { VendorMenu } from './pages/vendor/Menu';
import { VendorOrders } from './pages/vendor/Orders';

export const Router: React.FC = () => {
  const { user, loading, initialize, refreshUser } = useAuthStore();

  useEffect(() => {
    (async () => {
      await initialize();
    })();
  }, [initialize]);

  // Check session persistence on window focus
  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        refreshUser();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user, refreshUser]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    const path = window.location.pathname;
    if (path === '/login') {
      return <Login />;
    }
    if (path === '/register') {
      return <Register />;
    }
    return <Home />;
  }

  const path = window.location.pathname;

  const renderRoute = () => {
    if (user.role === 'organization_staff') {
      if (path === '/staff/dashboard') {
        return (
          <ProtectedRoute allowedRoles={['organization_staff']}>
            <Layout>
              <StaffDashboard />
            </Layout>
          </ProtectedRoute>
        );
      }
      if (path === '/staff/sales') {
        return (
          <ProtectedRoute allowedRoles={['organization_staff']}>
            <Layout>
              <StaffSales />
            </Layout>
          </ProtectedRoute>
        );
      }
      if (path === '/staff/employees') {
        return (
          <ProtectedRoute allowedRoles={['organization_staff']}>
            <Layout>
              <StaffEmployees />
            </Layout>
          </ProtectedRoute>
        );
      }
      if (path === '/staff/vendors') {
        return (
          <ProtectedRoute allowedRoles={['organization_staff']}>
            <Layout>
              <StaffVendors />
            </Layout>
          </ProtectedRoute>
        );
      }
      if (path === '/staff/management') {
        return (
          <ProtectedRoute allowedRoles={['organization_staff']}>
            <Layout>
              <StaffManagement />
            </Layout>
          </ProtectedRoute>
        );
      }
      if (path === '/staff/settings') {
        return (
          <ProtectedRoute allowedRoles={['organization_staff']}>
            <Layout>
              <OrganizationSettings />
            </Layout>
          </ProtectedRoute>
        );
      }
      // Default redirect to staff dashboard
      window.location.href = '/staff/dashboard';
      return null;
    }

    if (user.role === 'employee') {
      if (path === '/employee/dashboard') {
        return (
          <ProtectedRoute allowedRoles={['employee']}>
            <Layout>
              <EmployeeBrowse />
            </Layout>
          </ProtectedRoute>
        );
      }
      if (path === '/employee/cart') {
        return (
          <ProtectedRoute allowedRoles={['employee']}>
            <Layout>
              <EmployeeCart />
            </Layout>
          </ProtectedRoute>
        );
      }
      if (path === '/employee/orders') {
        return (
          <ProtectedRoute allowedRoles={['employee']}>
            <Layout>
              <EmployeeOrders />
            </Layout>
          </ProtectedRoute>
        );
      }
      // Default redirect to employee dashboard
      window.location.href = '/employee/dashboard';
      return null;
    }

    if (user.role === 'vendor') {
      if (path === '/vendor/dashboard') {
        return (
          <ProtectedRoute allowedRoles={['vendor']}>
            <Layout>
              <VendorDashboard />
            </Layout>
          </ProtectedRoute>
        );
      }
      if (path === '/vendor/menu') {
        return (
          <ProtectedRoute allowedRoles={['vendor']}>
            <Layout>
              <VendorMenu />
            </Layout>
          </ProtectedRoute>
        );
      }
      if (path === '/vendor/orders') {
        return (
          <ProtectedRoute allowedRoles={['vendor']}>
            <Layout>
              <VendorOrders />
            </Layout>
          </ProtectedRoute>
        );
      }
      // Default redirect to vendor dashboard
      window.location.href = '/vendor/dashboard';
      return null;
    }

    return <Login />;
  };

  return renderRoute();
};
