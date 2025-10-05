import React from 'react';
import { LayoutDashboard, Users, Store, ShoppingBag, ShoppingCart, UtensilsCrossed, UserCog, Settings, BarChart3 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export const Sidebar: React.FC = () => {
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
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-200 hidden lg:block">
      <nav className="p-4 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = window.location.pathname === link.href;

          return (
            <a
              key={link.href}
              href={link.href}
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
    </aside>
  );
};
