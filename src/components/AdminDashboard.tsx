import React, { useState } from "react";
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
  Edit,
  Trash2,
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
  const [activeMenuItem, setActiveMenuItem] = useState("game-coin");

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
  const coinData = [
    {
      id: 1,
      platform: "Xyz",
      inventory: "1000",
      quantity: "$50",
      selected: true,
    },
    {
      id: 2,
      platform: "Row Item",
      inventory: "Row Item",
      quantity: "Row Item",
      selected: true,
    },
    {
      id: 3,
      platform: "Row Item",
      inventory: "Row Item",
      quantity: "Row Item",
      selected: true,
    },
    {
      id: 4,
      platform: "Row Item",
      inventory: "Row Item",
      quantity: "Row Item",
      selected: true,
    },
    {
      id: 5,
      platform: "Row Item",
      inventory: "Row Item",
      quantity: "Row Item",
      selected: true,
    },
    {
      id: 6,
      platform: "Row Item",
      inventory: "Row Item",
      quantity: "Row Item",
      selected: false,
    },
    {
      id: 7,
      platform: "Row Item",
      inventory: "Row Item",
      quantity: "Row Item",
      selected: false,
    },
    {
      id: 8,
      platform: "Row Item",
      inventory: "Row Item",
      quantity: "Row Item",
      selected: false,
    },
    {
      id: 9,
      platform: "Row Item",
      inventory: "Row Item",
      quantity: "Row Item",
      selected: false,
    },
    {
      id: 10,
      platform: "Row Item",
      inventory: "Row Item",
      quantity: "Row Item",
      selected: false,
    },
  ];

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
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <h1 className="text-2xl font-bold text-pink-500 text-center">
            Game Coin Management
          </h1>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 bg-pink-500">
          {activeMenuItem === "game-coin" && (
            <div className="space-y-6">
              {/* Add New Coin Section */}
              <div className="bg-white rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-4">Add new Coin</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm mb-2">
                      Gaming Platform
                    </label>
                    <input
                      type="text"
                      placeholder="Enter name here"
                      className="w-full px-3 py-2 rounded-lg text-gray-800 placeholder-gray-500 border-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-2">Inventory</label>
                    <input
                      type="text"
                      placeholder="Enter Game inventory here"
                      className="w-full px-3 py-2 rounded-lg text-gray-800 placeholder-gray-500 border-2"
                    />
                  </div>
                  <div>
                    <label className="block  text-sm mb-2">Cost Price</label>
                    <input
                      type="text"
                      placeholder="Enter Cost price per quantity"
                      className="w-full px-3 py-2 rounded-lg text-gray-800 placeholder-gray-500 border-2"
                    />
                  </div>
                  <div className="flex items-end">
                    <button className="w-full bg-pink-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-50 hover:text-pink-500 transition-colors">
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Table Section */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="select-all"
                        className="w-4 h-4 text-pink-500 border-gray-300 rounded focus:ring-pink-500"
                      />
                      <label
                        htmlFor="select-all"
                        className="text-sm font-medium text-gray-700"
                      >
                        Select all
                      </label>
                    </div>
                    <button className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                      Delete All
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-medium text-gray-600"></th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">
                            Gaming Platform
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">
                            Inventory
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">
                            Quantity
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {coinData.map((item) => (
                          <tr
                            key={item.id}
                            className="border-b border-gray-100 hover:bg-gray-50"
                          >
                            <td className="py-3 px-4">
                              <input
                                type="checkbox"
                                checked={item.selected}
                                className="w-4 h-4 text-pink-500 border-gray-300 rounded focus:ring-pink-500"
                                readOnly
                              />
                            </td>
                            <td className="py-3 px-4 text-gray-700">
                              {item.platform}
                            </td>
                            <td className="py-3 px-4 text-gray-700">
                              {item.inventory}
                            </td>
                            <td className="py-3 px-4 text-gray-700">
                              {item.quantity}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex space-x-2">
                                <button className="p-1 text-blue-500 hover:bg-blue-50 rounded">
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button className="p-1 text-red-500 hover:bg-red-50 rounded">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Placeholder for other menu items */}
          {activeMenuItem !== "game-coin" && (
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
