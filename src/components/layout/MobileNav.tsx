import React, { useState } from 'react';
import { LayoutDashboard, Users, Store, ShoppingBag, ShoppingCart, UtensilsCrossed, Menu, X, UserCog, Settings, BarChart3 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export const MobileNav: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const user = useAuthStore((state) => state.user);

  if (!user) return null;

  const staffLinks = [
    { name: 'Dashboard', href: '/staff/dashboard', icon: LayoutDashboard },
    { name: 'Sales', href: '/staff/sales', icon: BarChart3 },
    { name: 'Staff Management', href: '/staff/management', icon: UserCog },
    { name: 'Employees', href: '/staff/employees', icon: Users },
    { name: 'Vendors', href: '/staff/vendors', icon: Store },
    { name: 'Organization Settings', href: '/staff/settings', icon: Settings },
  ];

  const employeeLinks = [
    { name: 'Browse', href: '/employee/dashboard', icon: ShoppingBag },
    { name: 'Cart', href: '/employee/cart', icon: ShoppingCart },
    { name: 'Orders', href: '/employee/orders', icon: ShoppingBag },
  ];

  const vendorLinks = [
    { name: 'Dashboard', href: '/vendor/dashboard', icon: LayoutDashboard },
    { name: 'Orders', href: '/vendor/orders', icon: ShoppingBag },
    { name: 'Menu', href: '/vendor/menu', icon: UtensilsCrossed },
  ];

  const links = user.role === 'organization_staff' ? staffLinks : user.role === 'employee' ? employeeLinks : vendorLinks;

  return (
    <>
      {/* Mobile menu button - more subtle design */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed bottom-4 right-4 z-50 bg-white text-gray-700 p-3 rounded-full shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95"
        aria-label="Open mobile menu"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile menu overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-30 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl transform transition-transform duration-300 ease-in-out max-h-[75vh] overflow-hidden">
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-8 h-1 bg-gray-300 rounded-full"></div>
            </div>
            
            <div className="p-4 pb-6 overflow-y-auto max-h-[calc(75vh-1rem)]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Navigation</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <nav className="space-y-2">
                {links.map((link) => {
                  const Icon = link.icon;
                  const isActive = window.location.pathname === link.href;

                  return (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-medium border border-blue-200'
                          : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                      }`}
                    >
                      <div className={`p-1.5 rounded-md ${isActive ? 'bg-blue-100' : 'bg-gray-100'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium">{link.name}</span>
                    </a>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
