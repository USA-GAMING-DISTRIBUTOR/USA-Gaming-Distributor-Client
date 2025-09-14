// Analytics and Dashboard types
export interface DashboardMetrics {
  total_sales: number;
  verified_sales: number;
  total_orders: number;
  verified_orders: number;
  pending_orders: number;
  total_customers: number;
  active_customers: number; // Customers with orders in last 30 days
  total_platforms: number;
  low_stock_platforms: number; // Platforms with inventory < 10
}

export interface SalesAnalytics {
  sales_by_platform: Array<{
    platform_name: string;
    account_type: string;
    total_sales: number;
    order_count: number;
    percentage: number;
  }>;
  sales_by_customer: Array<{
    customer_id: string;
    customer_name: string;
    total_sales: number;
    order_count: number;
    percentage: number;
  }>;
  daily_sales: Array<{
    date: string;
    total_sales: number;
    order_count: number;
  }>;
  monthly_sales: Array<{
    month: string;
    total_sales: number;
    order_count: number;
  }>;
}

export interface InventoryAlert {
  id: string;
  platform_id: string;
  platform_name: string;
  current_inventory: number;
  minimum_threshold: number;
  alert_type: 'Low Stock' | 'Out of Stock' | 'Overstocked';
  created_at: string;
  acknowledged: boolean;
}

// Real-time updates
export interface RealtimeUpdate {
  type: 'order_created' | 'order_verified' | 'inventory_updated' | 'customer_added' | 'issue_created';
  data: Record<string, unknown>;
  timestamp: string;
}

// Chart data structures
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface BarChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor: string[];
    borderColor: string[];
  }>;
}

export interface PieChartData {
  labels: string[];
  datasets: Array<{
    data: number[];
    backgroundColor: string[];
    borderColor: string[];
  }>;
}
