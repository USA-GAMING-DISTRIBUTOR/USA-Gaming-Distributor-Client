/**
 * Application-wide constants and enums
 */

export const USER_ROLES = {
  SUPER_ADMIN: 'SuperAdmin',
  ADMIN: 'Admin',
  EMPLOYEE: 'Employee',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export const PAYMENT_METHODS = {
  CREDIT_CARD: 'credit_card',
  DEBIT_CARD: 'debit_card',
  PAYPAL: 'paypal',
  BANK_TRANSFER: 'bank_transfer',
  CASH: 'cash',
} as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[keyof typeof PAYMENT_METHODS];

export const ISSUE_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
} as const;

export type IssueStatus = (typeof ISSUE_STATUS)[keyof typeof ISSUE_STATUS];

// API Configuration
export const API_ENDPOINTS = {
  USERS: '/users',
  CUSTOMERS: '/customers',
  PLATFORMS: '/game_coins',
  ORDERS: '/orders',
  LOGS: '/logs',
  ISSUES: '/customer_issues',
} as const;

// UI Constants
export const UI_CONSTANTS = {
  ITEMS_PER_PAGE: 10,
  PURCHASE_HISTORY_PAGE_SIZE: 8,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  DEBOUNCE_DELAY: 300,
  ANIMATION_DURATION: 200,
  // Virtualized table tuning
  VIRTUALIZATION_THRESHOLD: 50, // rows after which we switch to virtualized rendering
  VIRTUAL_ROW_HEIGHT: 44, // px – approximate row height incl. borders/padding
  VIRTUAL_MAX_HEIGHT: 440, // px – caps list height (10 rows visible before scrolling)
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  GENERIC: 'Something went wrong. Please try again.',
  NETWORK: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  VALIDATION: 'Please check your input and try again.',
  NOT_FOUND: 'The requested resource was not found.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  CREATED: 'Item created successfully.',
  UPDATED: 'Item updated successfully.',
  DELETED: 'Item deleted successfully.',
  SAVED: 'Changes saved successfully.',
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  CURRENT_USER: 'currentUser',
  AUTH_TOKEN: 'authToken',
  THEME: 'theme',
  PREFERENCES: 'userPreferences',
} as const;

// Inventory Defaults
export const INVENTORY_CONSTANTS = {
  LOW_STOCK_DEFAULT: 10,
} as const;
