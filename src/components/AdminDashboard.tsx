import React, { useState } from "react";
import EmployeePanel from "./EmployeePanel";
import GameCoinPanel from "./GameCoinPanel";
import ActivityLogPanel from "./ActivityLogPanel";
import CustomerIssuesPanel from "./CustomerIssuesPanel";
import CustomerPanel from "./CustomerPanel";
// ...existing code...
import OverviewPanel from "./OverviewPanel";
import OrderCreatePanel from "./OrderCreatePanel";
import OrderVerificationPanel from "./OrderVerificationPanel";
import {
  Home,
  Coins,
  ShoppingCart,
  Verified,
  Users,
  MessageSquare,
  UserCog,
  Activity,
  LogOut,
} from "lucide-react";
import { useAppDispatch } from "../hooks/redux";
import { logout } from "../store/authSlice";

type MenuItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
};

const AdminDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const [activeMenuItem, setActiveMenuItem] = useState("overview");

  const menuItems: MenuItem[] = [
    { id: "overview", label: "Overview", icon: Home },
    { id: "game-coin", label: "Game Coin", icon: Coins, active: true },
    {
      id: "order-create",
      label: "Order Create",
      icon: ShoppingCart,
    },
    {
      id: "order-verification",
      label: "Order Verification",
      icon: Verified,
    },
    { id: "customers", label: "Customers", icon: Users },
    { id: "customer-issues", label: "Customer Issues", icon: MessageSquare },
    { id: "employees", label: "Employees", icon: UserCog },
    { id: "activity-log", label: "Activity Log", icon: Activity },
    { id: "logout", label: "Log out", icon: LogOut },
  ];

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleMenuClick = (menuId: string) => {
    if (menuId === "logout") {
      handleLogout();
    } else {
      setActiveMenuItem(menuId);
    }
  };

  // Sample data for the table

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar - fixed */}
      <aside className="fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-40 flex flex-col">
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
                    isActive
                      ? "bg-pink-500 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* Main Content - relative to sidebar */}
      <div className="flex-1 flex flex-col ml-64 min-h-screen">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 sticky top-0 z-30">
          <h1 className="text-2xl font-bold text-pink-500 text-center">
            {menuItems.find((item) => item.id === activeMenuItem)?.label ||
              "Dashboard"}
          </h1>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 bg-pink-500 relative">
          {/* Placeholder for other menu items */}
          {activeMenuItem === "overview" && <OverviewPanel />}
          {activeMenuItem === "game-coin" && <GameCoinPanel />}
          {activeMenuItem === "employees" && <EmployeePanel />}
          {activeMenuItem === "order-create" && <OrderCreatePanel />}
          {activeMenuItem === "order-verification" && (
            <OrderVerificationPanel />
          )}
          {activeMenuItem === "activity-log" && <ActivityLogPanel />}
          {activeMenuItem === "customer-issues" && <CustomerIssuesPanel />}
          {activeMenuItem === "customers" && <CustomerPanel />}
          {activeMenuItem !== "overview" &&
            activeMenuItem !== "game-coin" &&
            activeMenuItem !== "employees" &&
            activeMenuItem !== "order-create" &&
            activeMenuItem !== "order-verification" &&
            activeMenuItem !== "activity-log" &&
            activeMenuItem !== "customer-issues" &&
            activeMenuItem !== "customers" && (
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  {menuItems.find((item) => item.id === activeMenuItem)?.label}{" "}
                  Page
                </h2>
                <p className="text-gray-600">
                  This page will be implemented later.
                </p>
              </div>
            )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
