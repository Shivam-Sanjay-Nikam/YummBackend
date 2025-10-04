import React, { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { StaffDashboard } from './pages/staff/Dashboard';
import { StaffEmployees } from './pages/staff/Employees';
import { StaffVendors } from './pages/staff/Vendors';
import { EmployeeBrowse } from './pages/employee/Browse';
import { EmployeeCart } from './pages/employee/Cart';
import { EmployeeOrders } from './pages/employee/Orders';
import { VendorDashboard } from './pages/vendor/Dashboard';
import { VendorMenu } from './pages/vendor/Menu';

export const Router: React.FC = () => {
  const { user, loading, initialize } = useAuthStore();

  useEffect(() => {
    (async () => {
      await initialize();
    })();
  }, [initialize]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const path = window.location.pathname;

  const renderRoute = () => {
    if (user.role === 'organization_staff') {
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
      return (
        <ProtectedRoute allowedRoles={['organization_staff']}>
          <Layout>
            <StaffDashboard />
          </Layout>
        </ProtectedRoute>
      );
    }

    if (user.role === 'employee') {
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
      return (
        <ProtectedRoute allowedRoles={['employee']}>
          <Layout>
            <EmployeeBrowse />
          </Layout>
        </ProtectedRoute>
      );
    }

    if (user.role === 'vendor') {
      if (path === '/vendor/menu') {
        return (
          <ProtectedRoute allowedRoles={['vendor']}>
            <Layout>
              <VendorMenu />
            </Layout>
          </ProtectedRoute>
        );
      }
      return (
        <ProtectedRoute allowedRoles={['vendor']}>
          <Layout>
            <VendorDashboard />
          </Layout>
        </ProtectedRoute>
      );
    }

    return <Login />;
  };

  return renderRoute();
};
