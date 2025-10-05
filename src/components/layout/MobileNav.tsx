import React, { useState } from 'react';
import { LayoutDashboard, Users, Store, ShoppingBag, ShoppingCart, UtensilsCrossed, Menu, X, UserCog, Settings } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export const MobileNav: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const user = useAuthStore((state) => state.user);

  if (!user) return null;

  const staffLinks = [
    { name: 'Dashboard', href: '/staff/dashboard', icon: LayoutDashboard },
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
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed bottom-6 right-6 z-50 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-200 transform hover:scale-105 active:scale-95"
        aria-label="Open mobile menu"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile menu overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl transform transition-transform duration-300 ease-in-out max-h-[80vh] overflow-hidden">
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
            </div>
            
            <div className="p-6 pb-8 overflow-y-auto max-h-[calc(80vh-2rem)]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Menu</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <nav className="space-y-3">
                {links.map((link) => {
                  const Icon = link.icon;
                  const isActive = window.location.pathname === link.href;

                  return (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center space-x-4 px-4 py-4 rounded-xl transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 font-semibold shadow-sm'
                          : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${isActive ? 'bg-blue-200' : 'bg-gray-100'}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-base">{link.name}</span>
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
