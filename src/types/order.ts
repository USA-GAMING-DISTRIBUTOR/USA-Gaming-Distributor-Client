// Enhanced Order types with comprehensive payment methods
export interface Order {
id: string;
customer_id: string | null;
order_number: string;
items: OrderItem[];
payment_method: PaymentMethod;
status: 'pending' | 'processing' | 'verified' | 'completed' | 'replacement' | 'refunded';
payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
total_amount: number;
discount_amount?: number;
final_amount?: number;
notes: string | null;
invoice_url: string | null;
created_at: string | null;
updated_at: string | null;
verified_at: string | null;
verified_by: string | null;
  created_by: string | null;
  created_by_username?: string;
}

export interface OrderItem {
order_id: string;
platform_id: string;
platform: string;
account_type?: string;
quantity: number;
unitPrice: number;
  total_price: number;
}

export type PaymentMethod = 'Crypto' | 'Bank Transfer' | 'Cash';

// Payment Details based on database schema
export interface PaymentDetailsBase {
  id: string;
  order_id: string;
  payment_method: PaymentMethod;
  transaction_id?: string;
  amount: number;
  currency: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CryptoPaymentDetails extends PaymentDetailsBase {
  payment_method: 'Crypto';
  crypto_currency?: string; // USDT, BTC, etc.
  crypto_network?: string; // TRC20, BEP20, Bitcoin
  crypto_username?: string;
  crypto_pay_id?: string;
  crypto_wallet_address?: string;
  crypto_transaction_hash?: string;
}

export interface BankTransferDetails extends PaymentDetailsBase {
  payment_method: 'Bank Transfer';
  bank_transaction_reference?: string;
  bank_sender_name?: string;
  bank_sender_bank?: string;
  bank_transaction_time?: string;
  bank_exchange_rate?: number;
  bank_amount_in_currency?: number;
}

export interface CashPaymentDetails extends PaymentDetailsBase {
  payment_method: 'Cash';
  cash_received_by?: string;
  cash_receipt_number?: string;
}

// Payment Details - discriminated union
export type PaymentDetails = CryptoPaymentDetails | BankTransferDetails | CashPaymentDetails;

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
