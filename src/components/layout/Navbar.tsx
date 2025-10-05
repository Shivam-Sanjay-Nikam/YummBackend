import React, { useEffect, useState } from 'react';
import { LogOut, User, ShoppingCart, Building2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { confirmManager } from '../ui/ConfirmDialog';

export const Navbar: React.FC = () => {
  const { user, logout, setUser } = useAuthStore();
  const totalItems = useCartStore((state) => state.getTotalItems());
  const [orgName, setOrgName] = useState<string>('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Load organization name when user changes
  useEffect(() => {
    const loadOrgName = async () => {
      if (user?.email && !user.org_name) {
        try {
          const { data, error } = await api.data.getOrganization(user.email);
          if (data && !error) {
            setOrgName(data.name);
            // Update user in store with org name
            const updatedUser = { ...user, org_name: data.name };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
          }
        } catch (error) {
          console.error('Error loading organization name:', error);
        }
      } else if (user?.org_name) {
        setOrgName(user.org_name);
      }
    };

    loadOrgName();
  }, [user, setUser]);

  // Listen for organization updates
  useEffect(() => {
    const handleOrgUpdate = () => {
      if (user?.email) {
        loadOrgName();
      }
    };

    // Listen for custom event when organization is updated
    window.addEventListener('organizationUpdated', handleOrgUpdate);
    return () => window.removeEventListener('organizationUpdated', handleOrgUpdate);
  }, [user]);

  // Listen for user updates (when staff name is changed)
  useEffect(() => {
    const handleUserUpdate = async () => {
      if (user?.email) {
        try {
          // Refresh user data from the server
          const { data, error } = await api.data.getOrganizationStaff(user.email);
          if (data && !error) {
            // Find the current user in the staff list
            const currentUser = data.find(staff => staff.email === user.email);
            if (currentUser) {
              // Update user in store with new name
              const updatedUser = { ...user, name: currentUser.name };
              setUser(updatedUser);
              localStorage.setItem('user', JSON.stringify(updatedUser));
            }
          }
        } catch (error) {
          console.error('Error refreshing user data:', error);
        }
      }
    };

    // Listen for custom event when user is updated
    window.addEventListener('userUpdated', handleUserUpdate);
    return () => window.removeEventListener('userUpdated', handleUserUpdate);
  }, [user, setUser]);

  const loadOrgName = async () => {
    if (user?.email) {
      try {
        const { data, error } = await api.data.getOrganization(user.email);
        if (data && !error) {
          setOrgName(data.name);
          // Update user in store with org name
          const updatedUser = { ...user, org_name: data.name };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      } catch (error) {
        console.error('Error loading organization name:', error);
      }
    }
  };

  const handleLogout = async () => {
    // Show beautiful confirmation dialog
    const confirmed = await confirmManager.confirm({
      title: 'Logout Confirmation',
      message: 'Are you sure you want to log out? You will need to sign in again to access your account.',
      type: 'warning',
      confirmText: 'Logout',
      cancelText: 'Stay Logged In'
    });
    
    if (!confirmed) return;

    setIsLoggingOut(true);
    
    // Show loading toast
    toast.loading('Logging out...', { id: 'logout' });
    
    // Add a small delay for smooth transition
    setTimeout(() => {
      logout();
      toast.success('Logged out successfully', { id: 'logout' });
    }, 500);
  };

  if (!user) return null;

  return (
    <>
      {/* Logout overlay */}
      {isLoggingOut && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3 shadow-xl">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="text-gray-700 font-medium">Logging out...</span>
          </div>
        </div>
      )}
      
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <img 
              src="/YummLogo.png" 
              alt="Yuum Logo" 
              className="h-8 w-8 object-contain"
            />
            <div className="flex flex-col">
              <span className="text-xl font-bold text-gray-900">Yuum</span>
              {orgName && (
                <span className="text-xs text-gray-500 flex items-center">
                  <Building2 className="w-3 h-3 mr-1" />
                  {orgName}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {user.role === 'employee' && (
              <button className="relative p-2 text-gray-700 hover:text-blue-500 transition-colors">
                <ShoppingCart className="w-6 h-6" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>
            )}

            <div className="flex items-center space-x-2 text-gray-700">
              <User className="w-5 h-5" />
              <span className="text-sm font-medium">{user.name || user.email}</span>
              {user.role === 'employee' && user.balance !== undefined && (
                <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                  ₹{user.balance.toFixed(2)}
                </span>
              )}
            </div>

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className={`p-2 text-gray-700 hover:text-red-500 transition-all duration-200 ${
                isLoggingOut 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-red-50 rounded-lg'
              }`}
              title={isLoggingOut ? "Logging out..." : "Logout"}
            >
              <LogOut className={`w-5 h-5 ${isLoggingOut ? 'animate-pulse' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </nav>
    </>
  );
};
