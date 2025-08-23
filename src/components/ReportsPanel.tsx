import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
// You can install chart.js and react-chartjs-2 for charting
// npm install chart.js react-chartjs-2
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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const ReportsPanel: React.FC = () => {
  const [salesData, setSalesData] = useState<any[]>([]);
  const [inventoryData, setInventoryData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch sales and inventory data from Supabase
    const fetchReports = async () => {
      setError(null);
      // Example: Fetch orders grouped by game coin
      const { data: sales, error: salesError } = await supabase
        .from("orders")
        .select("game_coin_id, quantity, payment_method")
        .order("game_coin_id", { ascending: true });
      if (salesError) {
        setError("Failed to fetch sales data: " + salesError.message);
        return;
      }
      setSalesData(sales || []);
      // Example: Fetch inventory movement (dummy, replace with your table)
      const { data: inventory, error: inventoryError } = await supabase
        .from("game_coins")
        .select("platform, inventory")
        .order("platform", { ascending: true });
      if (inventoryError) {
        setError("Failed to fetch inventory data: " + inventoryError.message);
        return;
      }
      setInventoryData(inventory || []);
    };
    fetchReports();
  }, []);

  // Prepare chart data
  const salesByCoin = salesData.reduce((acc: any, curr: any) => {
    acc[curr.game_coin_id] = (acc[curr.game_coin_id] || 0) + curr.quantity;
    return acc;
  }, {});
  const salesLabels = Object.keys(salesByCoin);
  const salesValues = Object.values(salesByCoin);

  const inventoryLabels = inventoryData.map((item: any) => item.platform);
  const inventoryValues = inventoryData.map((item: any) => item.inventory);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <h2 className="text-lg font-semibold mb-4">Reports & Analytics</h2>
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-md font-bold mb-2">Sales by Game Coin</h3>
          <Bar
            data={{
              labels: salesLabels,
              datasets: [
                {
                  label: "Sales Quantity",
                  data: salesValues,
                  backgroundColor: "#ec4899",
                },
              ],
            }}
            options={{ responsive: true, plugins: { legend: { display: false } } }}
          />
        </div>
        <div>
          <h3 className="text-md font-bold mb-2">Inventory by Platform</h3>
          <Pie
            data={{
              labels: inventoryLabels,
              datasets: [
                {
                  label: "Inventory",
                  data: inventoryValues,
                  backgroundColor: ["#ec4899", "#fbbf24", "#34d399", "#60a5fa", "#f87171"],
                },
              ],
            }}
            options={{ responsive: true, plugins: { legend: { position: "bottom" } } }}
          />
        </div>
      </div>
    </div>
  );
};

export default ReportsPanel;
