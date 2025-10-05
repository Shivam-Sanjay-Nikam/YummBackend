import React from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-3 sm:p-4 lg:p-6 lg:ml-64 pb-20 lg:pb-6">
          <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">{children}</div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
};
