// Platform types (renamed from Game Coin)
export interface Platform {
  id: string;
  platform: string; // e.g., PlayStation, Xbox
  account_type: string; // Free text input for account types
  inventory: number;
  cost_price: number;
  low_stock_alert: number; // Low stock alert threshold
  is_visible_to_employee: boolean;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null; // Soft delete timestamp
}

export interface PlatformCreateData {
  platform_name: string;
  account_type: string;
  inventory: number;
  cost_price: number;
  low_stock_alert: number;
  is_visible_to_employee?: boolean;
}

export interface PlatformUpdateData extends Partial<PlatformCreateData> {
  id: string;
  deleted_at?: string | null; // For soft delete operations
}

// Purchase Order for increasing inventory
export interface PurchaseOrder {
  id: string;
  platform_id: string;
  quantity: number;
  cost_per_unit: number;
  total_cost: number;
  supplier: string;
  order_date: string;
  received_date: string | null;
  status: 'Pending' | 'Received' | 'Cancelled';
  notes: string | null;
  created_by: string;
  created_at: string;
}

export interface PurchaseOrderCreateData {
  platform_id: string;
  quantity: number;
  cost_per_unit: number;
  supplier: string;
  notes?: string;
}
