import React, { useState, useEffect } from 'react';

import EmployeePanel from './EmployeePanel';
import PlatformPanel from './PlatformPanel';
import CustomerIssuesPanel from './CustomerIssuesPanel';
import CustomerPanel from './CustomerPanel';
import OverviewPanel from './OverviewPanel';
import OrderPanel from './OrderPanel';
import UsernamesPanel from './UsernamesPanel';
import {
  Home,
  Coins,
  ShoppingCart,
  Users,
  MessageSquare,
  UserCog,
  LogOut,
  UserCheck,
  BarChart,
} from 'lucide-react';
import ReportsPanel from './ReportsPanel';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { logout } from '../store/authSlice';

type MenuItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
};

const AdminDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [activeMenuItem, setActiveMenuItem] = useState('overview');

  const menuItems: MenuItem[] = [
    { id: 'reports', label: 'Reports', icon: BarChart, active: true },
    // { id: 'overview', label: 'Overview', icon: Home, active: true },
    { id: 'platform', label: 'Platform', icon: Coins },

    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'usernames', label: 'Usernames', icon: UserCheck },
    {
      id: 'orders',
      label: 'Order Management',
      icon: ShoppingCart,
    },
    { id: 'customer-issues', label: 'Customer Issues', icon: MessageSquare },
    { id: 'employees', label: 'Employees', icon: UserCog },
  ];

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleMenuClick = (menuId: string) => {
    setActiveMenuItem(menuId);
    try {
      localStorage.setItem('admin:lastMenu', menuId);
    } catch {
      // ignore
    }
  };

  // Restore last selected menu from localStorage, default admins to 'reports'
  useEffect(() => {
    try {
      const last = localStorage.getItem('admin:lastMenu');
      if (last) setActiveMenuItem(last);
      else if (user?.role === 'Admin') setActiveMenuItem('reports');
    } catch {
      // ignore
    }
  }, [user]);

  // Sample data for the table

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar - fixed */}
      <aside className="fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-40 flex flex-col">
        {/* Navigation Menu */}
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeMenuItem === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleMenuClick(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 text-left text-sm font-medium rounded-lg transition-colors ${
                    isActive ? 'bg-pink-500 text-white' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Logout button with username and role at bottom */}
        <div className="border-t border-gray-200 p-4 mt-auto">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 text-gray-700 hover:text-pink-700 hover:bg-pink-50 rounded-md transition-colors border border-gray-200 hover:border-pink-300"
            title="Logout"
          >
            <div className="w-8 h-8 bg-pink-200 rounded-full flex items-center justify-center mr-3">
              <span className="text-pink-700 font-medium text-xs">
                {user?.username?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-gray-900">{user?.username}</p>
              <p className="text-xs text-gray-600">{user?.role}</p>
            </div>
            <LogOut className="h-5 w-5 ml-2" />
          </button>
        </div>
      </aside>

      {/* Main Content - relative to sidebar */}
      <div className="flex-1 flex flex-col ml-64 min-h-screen">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 sticky top-0 z-30">
          <h1 className="text-2xl font-bold text-pink-500 text-center">
            {menuItems.find((item) => item.id === activeMenuItem)?.label || 'Dashboard'}
          </h1>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 bg-pink-500 relative">
          {/* Placeholder for other menu items */}
          {/* {activeMenuItem === 'overview' && <OverviewPanel />} */}
          {activeMenuItem === 'reports' && <ReportsPanel />}
          {activeMenuItem === 'platform' && <PlatformPanel />}
          {activeMenuItem === 'employees' && <EmployeePanel />}
          {activeMenuItem === 'orders' && <OrderPanel />}
          {activeMenuItem === 'customer-issues' && <CustomerIssuesPanel />}
          {activeMenuItem === 'customers' && <CustomerPanel />}
          {activeMenuItem === 'usernames' && <UsernamesPanel />}
          {activeMenuItem !== 'overview' &&
            activeMenuItem !== 'platform' &&
            activeMenuItem !== 'reports' &&
            activeMenuItem !== 'employees' &&
            activeMenuItem !== 'orders' &&
            activeMenuItem !== 'customer-issues' &&
            activeMenuItem !== 'customers' &&
            activeMenuItem !== 'usernames' && (
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  {menuItems.find((item) => item.id === activeMenuItem)?.label} Page
                </h2>
                <p className="text-gray-600">This page will be implemented later.</p>
              </div>
            )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
