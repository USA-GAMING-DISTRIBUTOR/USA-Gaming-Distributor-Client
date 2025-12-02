// Domain DTO types for platforms & purchase history operations
// These decouple repository input shapes from UI form state and allow
// independent evolution of persistence contracts.

export interface PlatformCreateDTO {
  platform: string;
  account_type: string;
  inventory: number;
  cost_price: number;
  low_stock_alert: number;
  is_visible_to_employee?: boolean;
}

export type PlatformUpdateDTO = Partial<PlatformCreateDTO>;

// Purchase history record DTO (write-only subset)
export interface PurchaseHistoryRecordDTO {
  platform_id: string;
  quantity: number;
  cost_per_unit: number;
  total_cost: number;
  supplier: string | null;
  notes: string | null;
  previous_inventory: number;
  new_inventory: number;
  purchased_by: string | null; // user id or null if system-generated
}

// Mapper helpers (optional, for converting from form models)
export const mapPlatformFormToCreateDTO = (form: {
  platform_name: string;
  account_type: string;
  inventory: number;
  cost_price: number;
  low_stock_alert: number;
  is_visible_to_employee?: boolean;
}): PlatformCreateDTO => ({
  platform: form.platform_name,
  account_type: form.account_type,
  inventory: form.inventory,
  cost_price: form.cost_price,
  low_stock_alert: form.low_stock_alert,
  is_visible_to_employee: form.is_visible_to_employee,
});

export const mapPlatformFormToUpdateDTO = mapPlatformFormToCreateDTO; // identical shape currently
