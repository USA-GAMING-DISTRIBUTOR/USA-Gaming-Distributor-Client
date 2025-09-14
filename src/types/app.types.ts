// Application-specific types that handle the database types more strictly
import type { Database } from './database.types'

// Type helpers for the database tables
export type DbUser = Database['public']['Tables']['users']['Row']
export type DbUserInsert = Database['public']['Tables']['users']['Insert']
export type DbUserUpdate = Database['public']['Tables']['users']['Update']

export type DbCustomer = Database['public']['Tables']['customers']['Row']
export type DbCustomerInsert = Database['public']['Tables']['customers']['Insert']
export type DbCustomerUpdate = Database['public']['Tables']['customers']['Update']

export type DbGameCoin = Database['public']['Tables']['game_coins']['Row']
export type DbGameCoinInsert = Database['public']['Tables']['game_coins']['Insert']
export type DbGameCoinUpdate = Database['public']['Tables']['game_coins']['Update']

export type DbOrder = Database['public']['Tables']['orders']['Row']
export type DbOrderInsert = Database['public']['Tables']['orders']['Insert']
export type DbOrderUpdate = Database['public']['Tables']['orders']['Update']

export type DbLog = Database['public']['Tables']['logs']['Row']
export type DbLogInsert = Database['public']['Tables']['logs']['Insert']
export type DbLogUpdate = Database['public']['Tables']['logs']['Update']

export type DbCustomerIssue = Database['public']['Tables']['customer_issues']['Row']
export type DbCustomerIssueInsert = Database['public']['Tables']['customer_issues']['Insert']
export type DbCustomerIssueUpdate = Database['public']['Tables']['customer_issues']['Update']

// Application types (with required fields for UI)
export interface User {
  id: string
  username: string
  password: string
  role: 'SuperAdmin' | 'Admin' | 'Employee'
  created_at: string
  created_by: string | null
}

export interface Employee {
  id: string
  username: string
  role: string
  created_at: string
}

export interface Customer {
  id: string
  name: string
  contact_info: string
  created_at: string
}

export interface Platform {
  id: string
  platform: string
  inventory: number
  cost_price: number
  created_at: string
}

export interface Coin {
  id: string
  platform: string
  inventory: number
  cost_price: number
  created_at: string
}

export interface Log {
  id: string
  action: string
  user_id: string
  details: string | null
  timestamp: string
}

export interface Issue {
  id: string
  customer_id: string
  issue_text: string
  created_by: string
  status: string
  created_at: string
}

export interface OrderItem {
  coinId: string
  quantity: number
  unitPrice: number
  platform: string
}

export interface Order {
  id: string
  customer_id: string
  items: OrderItem[]
  payment_method: string
  status: 'pending' | 'processing' | 'verified' | 'completed' | 'replacement'
  created_at: string
  created_by: string | null
  invoice_url?: string | null
}

export interface RefundReplacement {
  id: string
  order_id: string
  type: 'refund' | 'replacement'
  reason: string
  amount?: number | null
  replacement_order_id?: string | null
  status: 'pending' | 'approved' | 'completed' | 'rejected'
  notes?: string | null
  created_by?: string | null
  processed_by?: string | null
  created_at: string
  processed_at?: string | null
}

// Type conversion helpers
export function dbUserToUser(dbUser: DbUser): User {
  return {
    ...dbUser,
    role: dbUser.role as 'SuperAdmin' | 'Admin' | 'Employee',
    created_at: dbUser.created_at ?? new Date().toISOString(),
  }
}

export function dbCustomerToCustomer(dbCustomer: DbCustomer): Customer {
  return {
    ...dbCustomer,
    contact_info: dbCustomer.contact_info ?? '',
    created_at: dbCustomer.created_at ?? new Date().toISOString(),
  }
}

export function dbGameCoinToCoin(dbCoin: DbGameCoin): Coin {
  return {
    ...dbCoin,
    created_at: dbCoin.created_at ?? new Date().toISOString(),
  }
}

export function dbGameCoinToPlatform(dbCoin: DbGameCoin): Platform {
  return {
    ...dbCoin,
    created_at: dbCoin.created_at ?? new Date().toISOString(),
  }
}

export function dbLogToLog(dbLog: DbLog): Log {
  return {
    ...dbLog,
    user_id: dbLog.user_id ?? '',
    timestamp: dbLog.timestamp ?? new Date().toISOString(),
  }
}

export function dbIssueToIssue(dbIssue: DbCustomerIssue): Issue {
  return {
    ...dbIssue,
    status: dbIssue.status ?? 'open',
    created_at: dbIssue.created_at ?? new Date().toISOString(),
  }
}

export function orderItemsToJson(items: OrderItem[]): Record<string, unknown>[] {
  return items.map(item => ({
    coinId: item.coinId,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    platform: item.platform
  }))
}

export function jsonToOrderItems(json: unknown): OrderItem[] {
  if (!Array.isArray(json)) return []
  return json.map(item => ({
    coinId: item.coinId || '',
    quantity: item.quantity || 0,
    unitPrice: item.unitPrice || 0,
    platform: item.platform || ''
  }))
}
