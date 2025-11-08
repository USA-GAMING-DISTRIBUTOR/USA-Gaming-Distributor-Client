import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
// You can install chart.js and react-chartjs-2 for charting
// npm install chart.js react-chartjs-2
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

type SalesRow = {
  game_coin_id: string;
  quantity: number;
  payment_method: string;
};
type InventoryRow = { platform: string; inventory: number };

const ReportsPanel: React.FC = () => {
  const [salesData, setSalesData] = useState<SalesRow[]>([]);
  const [inventoryData, setInventoryData] = useState<InventoryRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch sales and inventory data from Supabase
    const fetchReports = async () => {
      setError(null);
      // Example: Fetch orders grouped by game coin
      // NOTE: The current schema does not have game_coin_id/quantity on orders.
      // Replace with a proper aggregation from order_items if needed.
      const { data: sales, error: salesError } = await supabase
        .from('order_items')
        .select('platform_id, quantity')
        .order('platform_id', { ascending: true });
      if (salesError) {
        setError('Failed to fetch sales data: ' + salesError.message);
        return;
      }
      // Map to SalesRow shape (payment_method not available at item-level here)
      setSalesData(
        (sales || []).map((r: { platform_id: string; quantity: number }) => ({
          game_coin_id: r.platform_id,
          quantity: r.quantity,
          payment_method: 'N/A',
        })),
      );
      // Example: Fetch inventory movement (dummy, replace with your table)
      const { data: inventory, error: inventoryError } = await supabase
        .from('game_coins')
        .select('platform, inventory')
        .order('platform', { ascending: true });
      if (inventoryError) {
        setError('Failed to fetch inventory data: ' + inventoryError.message);
        return;
      }
      setInventoryData((inventory || []) as InventoryRow[]);
    };
    fetchReports();
  }, []);

  // Prepare chart data
  const salesByCoin = salesData.reduce<Record<string, number>>((acc, curr) => {
    acc[curr.game_coin_id] = (acc[curr.game_coin_id] || 0) + Number(curr.quantity || 0);
    return acc;
  }, {});
  const salesLabels = Object.keys(salesByCoin);
  const salesValues = Object.values(salesByCoin);

  const inventoryLabels = inventoryData.map((item) => item.platform);
  const inventoryValues = inventoryData.map((item) => item.inventory);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <h2 className="text-lg font-semibold mb-4">Reports & Analytics</h2>
      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-md font-bold mb-2">Sales by Platform</h3>
          <Bar
            data={{
              labels: salesLabels,
              datasets: [
                {
                  label: 'Sales Quantity',
                  data: salesValues,
                  backgroundColor: '#ec4899',
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: { legend: { display: false } },
            }}
          />
        </div>
        <div>
          <h3 className="text-md font-bold mb-2">Inventory by Platform</h3>
          <Pie
            data={{
              labels: inventoryLabels,
              datasets: [
                {
                  label: 'Inventory',
                  data: inventoryValues,
                  backgroundColor: ['#ec4899', '#fbbf24', '#34d399', '#60a5fa', '#f87171'],
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: { legend: { position: 'bottom' } },
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ReportsPanel;
