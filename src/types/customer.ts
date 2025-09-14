// Simplified Customer types
export interface Customer {
  id: string;
  name: string;
  contact_numbers: string[];
  created_at: string | null;
  updated_at?: string | null;
}

export interface CustomerCreateData {
  name: string;
  contact_numbers: string[];
}

export interface CustomerUpdateData extends Partial<CustomerCreateData> {
  id: string;
}

// Customer-specific pricing with quantity tiers
export interface CustomerPricing {
  id: string;
  customer_id: string;
  platform_id: string;
  min_quantity: number;
  max_quantity: number | null;
  unit_price: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  platform_name?: string;
  customer_name?: string;
}

export interface CustomerPricingCreateData {
  customer_id: string;
  platform_id: string;
  min_quantity: number;
  max_quantity?: number;
  unit_price: number;
  is_default?: boolean;
}

export interface CustomerWithPricing extends Customer {
  pricing: CustomerPricing[];
}

// Customer history aggregated data
export interface CustomerHistory {
  customer: Customer;
  total_orders: number;
  total_spent: number;
  last_order_date: string | null;
  preferred_platforms: Array<{
    platform_name: string;
    order_count: number;
  }>;
  recent_orders: OrderSummary[];
}

interface OrderSummary {
  id: string;
  order_date: string;
  total_amount: number;
  status: string;
  item_count: number;
}
