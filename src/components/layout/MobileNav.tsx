import React, { useState } from 'react';
import { LayoutDashboard, Users, Store, ShoppingBag, ShoppingCart, UtensilsCrossed, Menu, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export const MobileNav: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const user = useAuthStore((state) => state.user);

  if (!user) return null;

  const staffLinks = [
    { name: 'Dashboard', href: '/staff/dashboard', icon: LayoutDashboard },
    { name: 'Employees', href: '/staff/employees', icon: Users },
    { name: 'Vendors', href: '/staff/vendors', icon: Store },
  ];

  const employeeLinks = [
    { name: 'Browse', href: '/employee/dashboard', icon: ShoppingBag },
    { name: 'Cart', href: '/employee/cart', icon: ShoppingCart },
    { name: 'Orders', href: '/employee/orders', icon: ShoppingBag },
  ];

  const vendorLinks = [
    { name: 'Dashboard', href: '/vendor/dashboard', icon: LayoutDashboard },
    { name: 'Menu', href: '/vendor/menu', icon: UtensilsCrossed },
  ];

  const links = user.role === 'organization_staff' ? staffLinks : user.role === 'employee' ? employeeLinks : vendorLinks;

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed bottom-6 right-6 z-50 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile menu overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setIsOpen(false)}>
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl transform transition-transform duration-300 ease-in-out">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Navigation</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600"
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
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{link.name}</span>
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
