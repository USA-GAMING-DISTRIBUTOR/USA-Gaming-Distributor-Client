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
  const [orders, setOrders] = useState<any[]>([]);
  const [coins, setCoins] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setError(null);
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*");
      if (ordersError) {
        setError("Failed to fetch orders: " + ordersError.message);
        return;
      }
      setOrders(ordersData || []);
      const { data: coinsData } = await supabase
        .from("game_coins")
        .select("id, platform");
      setCoins(coinsData || []);
      const { data: customersData } = await supabase
        .from("customers")
        .select("id, name");
      setCustomers(customersData || []);
    };
    fetchData();
  }, []);

  // Only include verified orders
  const verifiedOrders = orders.filter((order) => order.status === "verified");

  // Metrics
  // Use only item.price (not item.price * item.quantity)
  const totalSales = verifiedOrders.reduce(
    (sum, order) =>
      sum + order.items.reduce((s: number, i: any) => s + i.price, 0),
    0
  );
  const totalOrders = verifiedOrders.length;
  const totalCustomers = customers.length;
  const totalCoins = coins.length;

  // Sales by coin
  const salesByCoin: Record<string, number> = {};
  verifiedOrders.forEach((order) => {
    order.items.forEach((item: any) => {
      salesByCoin[item.coin_id] = (salesByCoin[item.coin_id] || 0) + item.price;
    });
  });
  const coinLabels = Object.keys(salesByCoin).map(
    (cid) => coins.find((c: any) => c.id === cid)?.platform || cid
  );
  const coinSales = Object.values(salesByCoin);

  // Sales by customer
  const salesByCustomer: Record<string, number> = {};
  verifiedOrders.forEach((order) => {
    salesByCustomer[order.customer_id] =
      (salesByCustomer[order.customer_id] || 0) +
      order.items.reduce((s: number, i: any) => s + i.price, 0);
  });
  const customerLabels = Object.keys(salesByCustomer).map(
    (cid) => customers.find((c: any) => c.id === cid)?.name || cid
  );
  const customerSales = Object.values(salesByCustomer);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <h2 className="text-lg font-semibold mb-4">Overview & Metrics</h2>
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-pink-100 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-pink-600">
            ${totalSales.toLocaleString()}
          </div>
          <div className="text-xs text-pink-700 mt-1">Total Sales</div>
        </div>
        <div className="bg-blue-100 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{totalOrders}</div>
          <div className="text-xs text-blue-700 mt-1">Total Orders</div>
        </div>
        <div className="bg-green-100 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {totalCustomers}
          </div>
          <div className="text-xs text-green-700 mt-1">Customers</div>
        </div>
        <div className="bg-yellow-100 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{totalCoins}</div>
          <div className="text-xs text-yellow-700 mt-1">Game Coins</div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
          <h3 className="text-md font-bold mb-4 text-pink-600">
            Sales by Game Coin
          </h3>
          <Bar
            data={{
              labels: coinLabels,
              datasets: [
                {
                  label: "Sales ($)",
                  data: coinSales,
                  backgroundColor: [
                    "#ec4899",
                    "#fbbf24",
                    "#34d399",
                    "#60a5fa",
                    "#f87171",
                    "#a3e635",
                    "#f472b6",
                  ],
                  borderRadius: 6,
                  borderSkipped: false,
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  display: true,
                  position: "top",
                  labels: { color: "#333", font: { size: 12 } },
                },
                tooltip: {
                  enabled: true,
                  backgroundColor: "#fff",
                  titleColor: "#ec4899",
                  bodyColor: "#333",
                  borderColor: "#ec4899",
                  borderWidth: 1,
                },
                title: { display: false },
              },
              scales: {
                x: {
                  grid: { display: false },
                  ticks: { color: "#888", font: { size: 12 } },
                },
                y: {
                  grid: { color: "#f3f4f6" },
                  ticks: { color: "#888", font: { size: 12 } },
                  beginAtZero: true,
                },
              },
            }}
            height={260}
          />
        </div>
        <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
          <h3 className="text-md font-bold mb-4 text-blue-600">
            Sales by Customer
          </h3>
          <Pie
            data={{
              labels: customerLabels,
              datasets: [
                {
                  label: "Sales ($)",
                  data: customerSales,
                  backgroundColor: [
                    "#ec4899",
                    "#fbbf24",
                    "#34d399",
                    "#60a5fa",
                    "#f87171",
                    "#a3e635",
                    "#f472b6",
                  ],
                  borderColor: "#fff",
                  borderWidth: 2,
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: "right",
                  labels: { color: "#333", font: { size: 12 } },
                },
                tooltip: {
                  enabled: true,
                  backgroundColor: "#fff",
                  titleColor: "#2563eb",
                  bodyColor: "#333",
                  borderColor: "#2563eb",
                  borderWidth: 1,
                },
                title: { display: false },
              },
            }}
            height={260}
          />
        </div>
      </div>
    </div>
  );
};

export default OverviewPanel;
