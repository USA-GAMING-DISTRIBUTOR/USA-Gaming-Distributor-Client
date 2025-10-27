import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import type { DashboardMetrics, SalesAnalytics } from "../types/analytics";
import type {
  Order,
  OrderItem,
  PaymentMethod,
  PaymentDetails,
} from "../types/order";
import type { Customer } from "../types/customer";
import type { Platform } from "../types/platform";
import {
  TrendingUp,
  Users,
  Package,
  ShoppingCart,
  AlertTriangle,
} from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const OverviewPanel: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    total_sales: 0,
    verified_sales: 0,
    total_orders: 0,
    verified_orders: 0,
    pending_orders: 0,
    total_customers: 0,
    active_customers: 0,
    total_platforms: 0,
    low_stock_platforms: 0,
  });
  const [salesAnalytics, setSalesAnalytics] = useState<SalesAnalytics>({
    sales_by_platform: [],
    sales_by_customer: [],
    daily_sales: [],
    monthly_sales: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setError(null);

      // Fetch all required data
      const [ordersData, customersData, platformsData] = await Promise.all([
        supabase.from("orders").select("*"),
        supabase.from("customers").select("*"),
        supabase.from("game_coins").select("*"), // Still using game_coins table name
      ]);

      if (ordersData.error)
        throw new Error("Failed to fetch orders: " + ordersData.error.message);
      if (customersData.error)
        throw new Error(
          "Failed to fetch customers: " + customersData.error.message
        );
      if (platformsData.error)
        throw new Error(
          "Failed to fetch platforms: " + platformsData.error.message
        );

      const ordersRaw = ordersData.data || [];
      const customersRaw = customersData.data || [];
      const platformsRaw = platformsData.data || [];

      // Transform raw database data to match our types
      const orders: Order[] = ordersRaw.map(
        (order: Record<string, unknown>) => ({
          id: String(order.id || ""),
          customer_id: String(order.customer_id || ""),
          order_number: String(order.order_number || ""),
          created_at: String(order.created_at || new Date().toISOString()),
          created_by: String(order.created_by || ""),
          items: Array.isArray(order.items) ? (order.items as OrderItem[]) : [],
          payment_method: (order.payment_method as PaymentMethod) || "Cash",
          payment_details: (order.payment_details as PaymentDetails) || {
            type: "Cash",
          },
          total_amount: Number(order.total_amount || 0),
          discount_amount: Number(order.discount_amount || 0),
          final_amount: Number(order.final_amount || order.total_amount || 0),
          status: (order.status as Order["status"]) || "pending",
          payment_status:
            (order.payment_status as
              | "pending"
              | "completed"
              | "refunded"
              | "failed") || "pending",
          updated_at: String(order.updated_at || new Date().toISOString()),
          invoice_url: order.invoice_url ? String(order.invoice_url) : null,
          verified_at: order.verified_at ? String(order.verified_at) : null,
          verified_by: order.verified_by ? String(order.verified_by) : null,
          notes: order.notes ? String(order.notes) : null,
        })
      );

      const customers: Customer[] = customersRaw.map(
        (customer: Record<string, unknown>) => ({
          id: String(customer.id || ""),
          name: String(customer.name || ""),
          contact_info: String(
            customer.contact_info || customer.phone || customer.email || ""
          ),
          contact_numbers: customer.contact_numbers
            ? Array.isArray(customer.contact_numbers)
              ? customer.contact_numbers.map(String)
              : null
            : null,
          email: customer.email ? String(customer.email) : null,
          phone: customer.phone ? String(customer.phone) : null,
          address: customer.address ? String(customer.address) : null,
          created_at: customer.created_at ? String(customer.created_at) : null,
          updated_at: customer.updated_at ? String(customer.updated_at) : null,
        })
      );

      const platforms: Platform[] = platformsRaw.map(
        (platform: Record<string, unknown>) => ({
          id: String(platform.id || ""),
          platform: String(platform.platform_name || platform.platform || ""),
          platform_name: String(
            platform.platform_name || platform.platform || ""
          ),
          account_type:
            (platform.account_type as Platform["account_type"]) || "Standard",
          category: String(platform.category || ""),
          inventory: Number(platform.inventory || 0),
          cost_price: Number(platform.cost_price || 0),
          created_at: String(platform.created_at || new Date().toISOString()),
          updated_at: String(
            platform.updated_at ||
              platform.created_at ||
              new Date().toISOString()
          ),
          deleted_at: platform.deleted_at ? String(platform.deleted_at) : null,
        })
      );

      // Calculate metrics
      const verifiedOrders = orders.filter(
        (order) => order.status === "verified"
      );
      const pendingOrders = orders.filter(
        (order) => order.status === "pending"
      );

      // Calculate sales from verified orders only
      const totalSales = orders.reduce((sum, order) => {
        if (order.final_amount) return sum + order.final_amount;
        // Fallback to items calculation
        return (
          sum +
          order.items.reduce(
            (itemSum, item) =>
              itemSum + (item.total_price || item.unitPrice * item.quantity),
            0
          )
        );
      }, 0);

      const verifiedSales = verifiedOrders.reduce((sum, order) => {
        if (order.final_amount) return sum + order.final_amount;
        return (
          sum +
          order.items.reduce(
            (itemSum, item) =>
              itemSum + (item.total_price || item.unitPrice * item.quantity),
            0
          )
        );
      }, 0);

      // Active customers (those with orders in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const activeCustomers = new Set(
        orders
          .filter(
            (order) =>
              order.created_at && new Date(order.created_at) > thirtyDaysAgo
          )
          .map((order) => order.customer_id)
      ).size;

      // Low stock platforms (inventory < 100)
      const lowStockPlatforms = platforms.filter(
        (platform) => platform.inventory < 100
      ).length;

      const newMetrics: DashboardMetrics = {
        total_sales: totalSales,
        verified_sales: verifiedSales,
        total_orders: orders.length,
        verified_orders: verifiedOrders.length,
        pending_orders: pendingOrders.length,
        total_customers: customers.length,
        active_customers: activeCustomers,
        total_platforms: platforms.length,
        low_stock_platforms: lowStockPlatforms,
      };

      // Calculate analytics for charts
      const salesByPlatform: Record<string, { sales: number; count: number }> =
        {};
      const salesByCustomer: Record<string, { sales: number; count: number }> =
        {};

      verifiedOrders.forEach((order) => {
        // Platform sales
        order.items.forEach((item) => {
          const key = item.platform;
          if (!salesByPlatform[key]) {
            salesByPlatform[key] = { sales: 0, count: 0 };
          }
          salesByPlatform[key].sales +=
            item.total_price || item.unitPrice * item.quantity;
          salesByPlatform[key].count += 1;
        });

        // Customer sales
        const customer = customers.find((c) => c.id === order.customer_id);
        if (customer) {
          const customerKey = customer.name;
          if (!salesByCustomer[customerKey]) {
            salesByCustomer[customerKey] = { sales: 0, count: 0 };
          }
          const orderTotal =
            order.final_amount ||
            order.items.reduce(
              (sum, item) =>
                sum + (item.total_price || item.unitPrice * item.quantity),
              0
            );
          salesByCustomer[customerKey].sales += orderTotal;
          salesByCustomer[customerKey].count += 1;
        }
      });

      const newAnalytics: SalesAnalytics = {
        sales_by_platform: Object.entries(salesByPlatform)
          .map(([name, data]) => ({
            platform_name: name,
            account_type: "Standard", // Default for now
            total_sales: data.sales,
            order_count: data.count,
            percentage: (data.sales / verifiedSales) * 100,
          }))
          .sort((a, b) => b.total_sales - a.total_sales),

        sales_by_customer: Object.entries(salesByCustomer)
          .map(([name, data]) => ({
            customer_id: "", // Not needed for display
            customer_name: name,
            total_sales: data.sales,
            order_count: data.count,
            percentage: (data.sales / verifiedSales) * 100,
          }))
          .sort((a, b) => b.total_sales - a.total_sales),

        daily_sales: [], // TODO: Implement daily breakdown
        monthly_sales: [], // TODO: Implement monthly breakdown
      };

      setMetrics(newMetrics);
      setSalesAnalytics(newAnalytics);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch dashboard data"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="h-80 bg-gray-200 rounded-xl"></div>
            <div className="h-80 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
        <div className="flex items-center text-sm text-gray-500">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
          Real-time updates
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
          <p className="font-medium">Error loading dashboard data</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-pink-100 text-sm font-medium">Total Sales</p>
              <p className="text-2xl font-bold">
                ${metrics.verified_sales.toLocaleString()}
              </p>
              <p className="text-pink-200 text-xs mt-1">Verified orders only</p>
            </div>
            <TrendingUp className="h-8 w-8 text-pink-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Orders</p>
              <p className="text-2xl font-bold">{metrics.verified_orders}</p>
              <p className="text-blue-200 text-xs mt-1">
                {metrics.pending_orders} pending
              </p>
            </div>
            <ShoppingCart className="h-8 w-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Customers</p>
              <p className="text-2xl font-bold">{metrics.total_customers}</p>
              <p className="text-green-200 text-xs mt-1">
                {metrics.active_customers} active
              </p>
            </div>
            <Users className="h-8 w-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-pink-100 text-sm font-medium">Platforms</p>
              <p className="text-2xl font-bold">{metrics.total_platforms}</p>
              <p className="text-pink-200 text-xs mt-1">
                {metrics.low_stock_platforms} low stock
              </p>
            </div>
            <Package className="h-8 w-8 text-pink-200" />
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {metrics.low_stock_platforms > 0 && (
        <div className="mb-6 p-4 bg-amber-50 border-l-4 border-amber-400">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
            <p className="text-amber-800 font-medium">
              {metrics.low_stock_platforms} platform(s) have low inventory (less
              than 10 items)
            </p>
          </div>
        </div>
      )}

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sales by Platform Bar Chart */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Sales by Platform
          </h3>
          <div className="h-80">
            <Bar
              data={{
                labels: salesAnalytics.sales_by_platform
                  .slice(0, 6)
                  .map((item) => item.platform_name),
                datasets: [
                  {
                    label: "Sales ($)",
                    data: salesAnalytics.sales_by_platform
                      .slice(0, 6)
                      .map((item) => item.total_sales),
                    backgroundColor: [
                      "#ec4899",
                      "#8b5cf6",
                      "#06b6d4",
                      "#10b981",
                      "#f59e0b",
                      "#ef4444",
                    ],
                    borderRadius: 8,
                    borderSkipped: false,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: "#fff",
                    titleColor: "#374151",
                    bodyColor: "#374151",
                    borderColor: "#e5e7eb",
                    borderWidth: 1,
                  },
                },
                scales: {
                  x: {
                    grid: { display: false },
                    ticks: { color: "#6b7280", font: { size: 12 } },
                  },
                  y: {
                    grid: { color: "#f3f4f6" },
                    ticks: {
                      color: "#6b7280",
                      font: { size: 12 },
                      callback: (value) => `$${Number(value).toLocaleString()}`,
                    },
                    beginAtZero: true,
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Sales by Customer Pie Chart */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Sales by Customer
          </h3>
          <div className="h-80">
            <Pie
              data={{
                labels: salesAnalytics.sales_by_customer
                  .slice(0, 6)
                  .map((item) => item.customer_name),
                datasets: [
                  {
                    data: salesAnalytics.sales_by_customer
                      .slice(0, 6)
                      .map((item) => item.total_sales),
                    backgroundColor: [
                      "#ec4899",
                      "#8b5cf6",
                      "#06b6d4",
                      "#10b981",
                      "#f59e0b",
                      "#ef4444",
                    ],
                    borderColor: "#fff",
                    borderWidth: 2,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "right",
                    labels: {
                      color: "#374151",
                      font: { size: 12 },
                      usePointStyle: true,
                    },
                  },
                  tooltip: {
                    backgroundColor: "#fff",
                    titleColor: "#374151",
                    bodyColor: "#374151",
                    borderColor: "#e5e7eb",
                    borderWidth: 1,
                    callbacks: {
                      label: (context) => {
                        const value = context.parsed;
                        const percentage =
                          salesAnalytics.sales_by_customer[context.dataIndex]
                            ?.percentage || 0;
                        return `$${value.toLocaleString()} (${percentage.toFixed(
                          1
                        )}%)`;
                      },
                    },
                  },
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewPanel;
