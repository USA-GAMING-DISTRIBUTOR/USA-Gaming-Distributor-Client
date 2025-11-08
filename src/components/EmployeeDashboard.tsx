import React, { useState } from 'react';
import { Home, LogOut } from 'lucide-react';
import { useAppDispatch } from '../hooks/redux';
import { logout } from '../store/authSlice';

type MenuItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const EmployeeDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const [activeMenuItem, setActiveMenuItem] = useState('overview');

  const menuItems: MenuItem[] = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'logout', label: 'Log out', icon: LogOut },
  ];

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleMenuClick = (menuId: string) => {
    if (menuId === 'logout') {
      handleLogout();
    } else {
      setActiveMenuItem(menuId);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6">
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
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <h1 className="text-2xl font-bold text-pink-500 text-center">Employee Dashboard</h1>
        </header>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
