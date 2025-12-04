import React, { useState } from 'react';
import UsernamesPanel from './UsernamesPanel';
import OrderPanel from './OrderPanel';
import CustomerIssuesPanel from './CustomerIssuesPanel';
import { Home, LogOut, UserCheck, ShoppingCart, MessageSquare } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { logout } from '../store/authSlice';

type MenuItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const EmployeeDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [activeMenuItem, setActiveMenuItem] = useState('orders');

  const menuItems: MenuItem[] = [
    { id: 'orders', label: 'Order Management', icon: ShoppingCart },
    { id: 'customer-issues', label: 'Customer Issues', icon: MessageSquare },
    { id: 'usernames', label: 'Usernames', icon: UserCheck },
  ];

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleMenuClick = (menuId: string) => {
    setActiveMenuItem(menuId);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg flex flex-col">
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
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <h1 className="text-2xl font-bold text-pink-500 text-center">
            {menuItems.find((item) => item.id === activeMenuItem)?.label || 'Employee Dashboard'}
          </h1>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 bg-gray-50 overflow-y-auto bg-pink-500">
          {activeMenuItem === 'orders' && <OrderPanel />}
          {activeMenuItem === 'customer-issues' && <CustomerIssuesPanel />}
          {activeMenuItem === 'usernames' && <UsernamesPanel />}
        </main>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
