import React from 'react';
import { ShoppingBag, LogOut, User, ShoppingCart } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const totalItems = useCartStore((state) => state.getTotalItems());

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

  if (!user) return null;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <img 
              src="/YummLogo.png" 
              alt="Yuum Logo" 
              className="h-8 w-8 object-contain"
            />
            <span className="text-xl font-bold text-gray-900">Yuum</span>
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
              className="p-2 text-gray-700 hover:text-red-500 transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
