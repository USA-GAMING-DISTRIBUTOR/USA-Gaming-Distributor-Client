export interface PurchaseHistory {
  id: string;
  platform_id: string;
  quantity: number;
  cost_per_unit: number;
  total_cost: number;
  supplier: string | null;
  notes: string | null;
  previous_inventory: number;
  new_inventory: number;
  purchased_by: string | null;
  created_at: string;
  // Joined data from relations
  platform_name?: string;
  purchased_by_username?: string;
}

export interface PurchaseHistoryCreateData {
  platform_id: string;
  quantity: number;
  cost_per_unit: number;
  supplier?: string;
  notes?: string;
}
