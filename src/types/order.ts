// Enhanced Order types with comprehensive payment methods
export interface Order {
  id: string;
  customer_id: string | null;
  items: OrderItem[];
  payment_method: PaymentMethod;
  payment_details: PaymentDetails;
  status: 'Pending' | 'Verified' | 'Fulfilled' | 'Cancelled' | 'Refunded';
  total_amount: number;
  discount_amount: number;
  final_amount: number;
  invoice_url: string | null;
  created_at: string | null;
  created_by: string | null;
  verified_at: string | null;
  verified_by: string | null;
  notes: string | null;
}

export interface OrderItem {
  id: string;
  platform_id: string;
  platform_name: string;
  account_type: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export type PaymentMethod = 'Crypto' | 'Bank Transfer' | 'Cash';

// Payment Details - discriminated union
export type PaymentDetails = CryptoPaymentDetails | BankTransferDetails | CashPaymentDetails;

export interface CryptoPaymentDetails {
  type: 'Crypto';
  currency: 'USDT' | 'BTC';
  username: string;
  pay_id: string;
  network: 'TRC20' | 'BEP20' | 'Bitcoin';
  transaction_hash?: string;
  wallet_address?: string;
}

export interface BankTransferDetails {
  type: 'Bank Transfer';
  transaction_reference: string;
  sender_name: string;
  sender_bank?: string;
  transaction_time: string; // Manual entry
  exchange_rate?: number;
  currency: string;
  amount_in_currency: number;
}

export interface CashPaymentDetails {
  type: 'Cash';
  received_by: string;
  receipt_number?: string;
  notes?: string;
}

// Order creation and update types
export interface OrderCreateData {
  customer_id: string;
  items: OrderItemCreateData[];
  payment_method: PaymentMethod;
  payment_details: PaymentDetails;
  discount_amount?: number;
  notes?: string;
}

export interface OrderItemCreateData {
  platform_id: string;
  quantity: number;
  unit_price: number;
}

export interface OrderUpdateData {
  id: string;
  customer_id?: string;
  items?: OrderItemCreateData[];
  payment_method?: PaymentMethod;
  payment_details?: PaymentDetails;
  status?: Order['status'];
  discount_amount?: number;
  notes?: string;
}

// Order analytics
export interface OrderAnalytics {
  total_orders: number;
  verified_orders: number;
  pending_orders: number;
  total_sales: number;
  verified_sales: number;
  sales_by_platform: Array<{
    platform_name: string;
    total_sales: number;
    order_count: number;
  }>;
  sales_by_customer: Array<{
    customer_name: string;
    total_sales: number;
    order_count: number;
  }>;
  recent_orders: Order[];
}

// Refund and Replacement
export interface RefundRequest {
  id: string;
  order_id: string;
  refund_type: 'Full' | 'Partial' | 'Replacement';
  refund_amount: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Completed' | 'Rejected';
  requested_by: string;
  approved_by?: string;
  created_at: string;
  processed_at?: string;
}

export interface ReplacementRequest {
  id: string;
  order_id: string;
  original_items: OrderItem[];
  replacement_items: OrderItem[];
  reason: string;
  status: 'Pending' | 'Approved' | 'Completed' | 'Rejected';
  requested_by: string;
  approved_by?: string;
  created_at: string;
  processed_at?: string;
}
