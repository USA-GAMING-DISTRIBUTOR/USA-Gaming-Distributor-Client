import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../hooks/redux";
import { logout } from "../store/authSlice";
import {
  Menu,
  X,
  Home,
  Users,
  Package,
  ShoppingCart,
  FileText,
  Activity,
  Shield,
  Power,
  UserCheck,
} from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentPage?: string;
}

interface NavItem {
  name: string;
  icon: React.ReactNode;
  path: string;
  roles: string[];
}

const navigationItems: NavItem[] = [
  {
    name: "Overview",
    icon: <Home className="h-5 w-5" />,
    path: "/dashboard",
    roles: ["SuperAdmin", "Admin", "Employee"],
  },
  {
    name: "Users",
    icon: <Users className="h-5 w-5" />,
    path: "/users",
    roles: ["SuperAdmin"],
  },
  {
    name: "Platforms",
    icon: <Package className="h-5 w-5" />,
    path: "/platforms",
    roles: ["SuperAdmin", "Admin"],
  },
  {
    name: "Orders",
    icon: <ShoppingCart className="h-5 w-5" />,
    path: "/orders",
    roles: ["SuperAdmin", "Admin", "Employee"],
  },
  {
    name: "Customers",
    icon: <Users className="h-5 w-5" />,
    path: "/customers",
    roles: ["SuperAdmin", "Admin"],
  },
  {
    name: "Usernames",
    icon: <UserCheck className="h-5 w-5" />,
    path: "/usernames",
    roles: ["SuperAdmin", "Admin"],
  },
  {
    name: "Reports",
    icon: <FileText className="h-5 w-5" />,
    path: "/reports",
    roles: ["SuperAdmin", "Admin"],
  },
  {
    name: "Activity Logs",
    icon: <Activity className="h-5 w-5" />,
    path: "/logs",
    roles: ["SuperAdmin"],
  },
];

/**
 * Dashboard layout with your original purple theme
 */
const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const handleLogout = () => {
    dispatch(logout());
  };

  // Filter navigation items based on user role
  const filteredNavItems = navigationItems.filter((item) =>
    user?.role ? item.roles.includes(user.role) : false
  );

  return (
    <div className="min-h-screen bg-pink-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <div className="flex flex-col h-full">
          {/* Brand */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-pink-200">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-pink-600 mr-3" />
              <span className="text-lg font-semibold text-pink-900">
                USA Gaming
              </span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {filteredNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`
                    flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                    ${
                      isActive
                        ? "bg-pink-100 text-pink-700"
                        : "text-gray-700 hover:bg-pink-100 hover:text-pink-700"
                    }
                  `}
                >
                  {item.icon}
                  <span className="ml-3">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout button with username and role at bottom */}
          <div className="border-t border-pink-200 p-4 mt-auto">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2 text-pink-700 hover:text-pink-900 hover:bg-pink-100 rounded-md transition-colors border border-pink-200 hover:border-pink-300"
              title="Logout"
            >
              <div className="w-8 h-8 bg-pink-200 rounded-full flex items-center justify-center mr-3">
                <span className="text-pink-700 font-medium text-xs">
                  {user?.username?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-pink-900">
                  {user?.username}
                </p>
                <p className="text-xs text-pink-600">{user?.role}</p>
              </div>
              <Power className="h-5 w-5 ml-2" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
        {/* Mobile menu button */}
        <div className="lg:hidden bg-white border-b border-pink-200 p-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-500 hover:text-gray-700"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
