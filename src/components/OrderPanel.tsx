/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useRef } from 'react';
import { Plus, Edit, Eye, FileText, Trash2, Filter, Copy, Download, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAppSelector } from '../hooks/redux';
import Invoice from './Invoice';
import { copyInvoiceToClipboard, downloadInvoiceImage } from '../utils/invoiceUtils';
import Pagination from './common/Pagination';
import type { Database } from '../types/database.types';
import type {
  Order,
  OrderItem,
  PaymentDetails,
  CryptoPaymentDetails,
  BankTransferDetails,
  CashPaymentDetails,
  PaymentMethod,
} from '../types/order';
type CreateFormState = {
  customer_id: string;
  items: OrderItem[];
  payment_method: PaymentMethod;
  payment_details: PaymentDetails | null;
  discount_amount: number;
  notes: string;
};
type EditFormState = {
  id: string;
  customer_id: string;
  items: OrderItem[];
  payment_method: PaymentMethod;
  payment_details: PaymentDetails | null;
  discount_amount: number;
  notes: string;
};
import type { Customer } from '../types/customer';
import type { Platform } from '../types/platform';

// Type guards for discriminated union
const isCryptoDetails = (
  details: PaymentDetails | null | undefined,
): details is CryptoPaymentDetails => details?.payment_method === 'Crypto';
const isBankDetails = (
  details: PaymentDetails | null | undefined,
): details is BankTransferDetails => details?.payment_method === 'Bank Transfer';
const isCashDetails = (details: PaymentDetails | null | undefined): details is CashPaymentDetails =>
  details?.payment_method === 'Cash';

// Helper to build the row object for payment_details insertion
const buildPaymentDetailsInsert = (
  orderId: string,
  details: PaymentDetails,
  amount: number,
  paymentMethod: PaymentMethod,
): Database['public']['Tables']['payment_details']['Insert'] => {
  const base: Database['public']['Tables']['payment_details']['Insert'] = {
    order_id: orderId,
    payment_method: paymentMethod,
    amount,
    currency: details.currency || null,
    notes: (details as any).notes ?? null,
    payment_data: details as any,
    created_at: new Date().toISOString(),
  };

  if (isCryptoDetails(details)) {
    base.crypto_currency = details.crypto_currency || null;
    base.crypto_network = details.crypto_network || null;
    base.crypto_username = details.crypto_username || null;
    base.crypto_wallet_address = details.crypto_wallet_address || null;
    base.crypto_transaction_hash =
      details.crypto_transaction_hash || details.transaction_id || null;
  } else if (isBankDetails(details)) {
    base.bank_transaction_reference = details.bank_transaction_reference || null;
    base.bank_sender_name = details.bank_sender_name || null;
    base.bank_sender_bank = details.bank_sender_bank || null;
    base.bank_transaction_time = details.bank_transaction_time || null;
    base.bank_exchange_rate = details.bank_exchange_rate || null;
    base.bank_amount_in_currency = details.bank_amount_in_currency || null;
    base.bank_purpose = (details as any).bank_purpose || null;
    base.bank_transaction_type = (details as any).bank_transaction_type || null;
  } else if (isCashDetails(details)) {
    base.cash_received_by = details.cash_received_by || null;
    base.cash_receipt_number = details.cash_receipt_number || null;
  }

  return base;
};

const OrderPanel: React.FC = () => {
  // Get current user from Redux store
  const { user } = useAppSelector((state) => state.auth);

  // Core state
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerPricing, setCustomerPricing] = useState<any[]>([]);
  const [paymentDetails, setPaymentDetails] = useState<any[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [customerUsernames, setCustomerUsernames] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [editingItemData, setEditingItemData] = useState<{
    platform_id: string;
    quantity: number;
    unit_price: number;
    username: string;
  } | null>(null);

  // Invoice state
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  // Filter and search state
  const [statusFilter, setStatusFilter] = useState<Order['status'] | 'all'>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<PaymentMethod | 'all'>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [searchTerm, setSearchTerm] = useState('');

  // Refund and replacement state
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showReplacementModal, setShowReplacementModal] = useState(false);
  const [refundForm, setRefundForm] = useState({
    reason: '',
    notes: '',
  });
  const [replacementForm, setReplacementForm] = useState({
    reason: '',
    notes: '',
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // Create order form state
  const [createForm, setCreateForm] = useState<CreateFormState>({
    customer_id: '',
    items: [],
    payment_method: 'Cash',
    payment_details: {
      payment_method: 'Cash',
      id: '',
      order_id: '',
      amount: 0,
      currency: 'USD',
      cash_received_by: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as PaymentDetails,
    discount_amount: 0,
    notes: '',
  });

  // Edit order form state
  const [editForm, setEditForm] = useState<EditFormState>({
    id: '',
    customer_id: '',
    items: [],
    payment_method: 'Cash',
    payment_details: {
      payment_method: 'Cash',
      id: '',
      order_id: '',
      amount: 0,
      currency: 'USD',
      cash_received_by: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as PaymentDetails,
    discount_amount: 0,
    notes: '',
  });

  // Order item being added
  const [newItem, setNewItem] = useState({
    platform_id: '',
    quantity: 1,
    unit_price: 0,
    username: '',
  });

  // Price editing state
  const [isPriceEditable, setIsPriceEditable] = useState(false);

  // Function to get available usernames for a customer and platform
  const getAvailableUsernames = (customerId: string, platformId: string) => {
    const filtered = customerUsernames.filter((username: any) => {
      const match =
        username.customer_id === customerId &&
        username.platform_id === platformId &&
        username.is_active;
      return match;
    });

    return filtered;
  };

  // Function to get customer pricing for a specific platform and quantity
  const getCustomerPrice = (customerId: string, platformId: string, quantity: number): number => {
    // Find all pricing records for this customer and platform
    const allPricing = customerPricing.filter(
      (p: any) => p.customer_id === customerId && p.platform_id === platformId,
    );

    if (allPricing.length === 0) {
      return 0;
    }

    // Sort pricing by min_quantity ascending to check ranges properly
    const sortedPricing = allPricing.sort((a, b) => a.min_quantity - b.min_quantity);

    // Find the appropriate pricing tier based on quantity
    for (const pricing of sortedPricing) {
      const minQty = pricing.min_quantity;
      const maxQty = pricing.max_quantity;

      // Check if quantity falls within this range
      if (quantity >= minQty && (maxQty === null || quantity <= maxQty)) {
        return pricing.unit_price;
      }
    }

    // If no matching range found, return 0 (or could fall back to default platform price)
    return 0;
  };

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        ordersRes,
        orderItemsRes,
        paymentDetailsRes,
        customersRes,
        customerPricingRes,
        platformsRes,
        customerUsernamesRes,
      ] = await Promise.all([
        supabase
          .from('orders')
          .select(
            `
          *,
            users!orders_created_by_fkey(username)
          `,
          )
          .order('created_at', { ascending: false }),
        supabase.from('order_items').select(`
            *,
            game_coins!order_items_platform_id_fkey(account_type)
          `),
        supabase.from('payment_details').select('*'),
        supabase.from('customers').select('*').order('name'),
        supabase.from('customer_pricing').select('*'),
        supabase.from('game_coins').select('*').order('platform'),
        supabase
          .from('customer_usernames')
          .select(
            `
            *,
            game_coins!platform_id(platform, account_type)
          `,
          )
          .eq('is_active', true),
      ]);

      if (ordersRes.error) throw new Error('Failed to fetch orders: ' + ordersRes.error.message);
      if (orderItemsRes.error)
        throw new Error('Failed to fetch order items: ' + orderItemsRes.error.message);
      if (paymentDetailsRes.error)
        throw new Error('Failed to fetch payment details: ' + paymentDetailsRes.error.message);
      if (customersRes.error)
        throw new Error('Failed to fetch customers: ' + customersRes.error.message);
      if (customerPricingRes.error)
        throw new Error('Failed to fetch customer pricing: ' + customerPricingRes.error.message);
      if (platformsRes.error)
        throw new Error('Failed to fetch platforms: ' + platformsRes.error.message);
      // Don't throw error for customer usernames, just skip them

      // First transform platforms so we can use them in order transformation
      const transformedPlatforms: Platform[] = (platformsRes.data || []).map(
        (platform: Record<string, unknown>) => ({
          id: String(platform.id || ''),
          platform: String(platform.platform_name || platform.platform || ''),
          account_type: (platform.account_type as Platform['account_type']) || 'Standard',
          inventory: Number(platform.inventory || 0),
          cost_price: Number(platform.cost_price || 0),
          low_stock_alert: Number(platform.low_stock_alert || 10),
          created_at: String(platform.created_at || new Date().toISOString()),
          updated_at: String(
            platform.updated_at || platform.created_at || new Date().toISOString(),
          ),
          deleted_at: platform.deleted_at ? String(platform.deleted_at) : null,
        }),
      );

      // Transform raw data to match our types
      const transformedOrders: Order[] = (ordersRes.data || []).map((order: any) => {
        // Find all items for this order
        const orderItems = (orderItemsRes.data || []).filter(
          (item: any) => item.order_id === order.id,
        );

        // Map order items to the expected format
        const items = orderItems.map((item: any) => {
          const platform = transformedPlatforms.find((p) => p.id === item.platform_id);

          return {
            order_id: String(item.order_id || order.id || ''),
            platform_id: String(item.platform_id || ''),
            platform: platform?.platform || 'Unknown Platform',
            account_type: item.game_coins?.account_type || platform?.account_type || 'Standard',
            quantity: Number(item.quantity || 0),
            unitPrice: Number(item.unit_price || item.unitPrice || 0),
            total_price: Number(item.total_price || 0),
            username: item.username || null,
          };
        });

        return {
          id: String(order.id || ''),
          customer_id: String(order.customer_id || ''),
          order_number: String(order.order_number || order.id || ''),
          created_at: String(order.created_at || new Date().toISOString()),
          updated_at: String(order.updated_at || order.created_at || new Date().toISOString()),
          created_by: String(order.created_by || ''),
          created_by_username: order.users?.username || null,
          items: items,
          payment_method: (order.payment_method as PaymentMethod) || 'None',
          payment_status: (order.payment_status as any) || 'pending',
          payment_details: order.payment_details || null,
          total_amount: Number(order.total_amount || 0),
          discount_amount: Number(order.discount_amount || 0),
          final_amount: Number(order.final_amount || order.total_amount || 0),
          status: (order.status as Order['status']) || 'pending',
          invoice_url: order.invoice_url ? String(order.invoice_url) : null,
          verified_at: order.verified_at ? String(order.verified_at) : null,
          verified_by: order.verified_by ? String(order.verified_by) : null,
          notes: order.notes ? String(order.notes) : null,
        };
      });

      const transformedCustomers: Customer[] = (customersRes.data || []).map((customer: any) => ({
        id: String(customer.id || ''),
        name: String(customer.name || ''),
        contact_numbers:
          customer.contact_numbers ||
          (customer.contact_info
            ? typeof customer.contact_info === 'string'
              ? JSON.parse(customer.contact_info).map((info: any) => info.number || info.phone)
              : (customer.contact_info as any[]).map((info: any) => info.number || info.phone)
            : null),
        created_at: customer.created_at ? String(customer.created_at) : null,
        updated_at: customer.updated_at ? String(customer.updated_at) : null,
      }));

      setOrders(transformedOrders);
      setCustomers(transformedCustomers);
      setCustomerPricing(customerPricingRes.data || []);
      setPaymentDetails(paymentDetailsRes.data || []);
      setPlatforms(transformedPlatforms);
      setCustomerUsernames(customerUsernamesRes.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Reset page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Filter orders based on filters
  const filteredOrders = orders.filter((order) => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesPayment =
      paymentMethodFilter === 'all' || order.payment_method === paymentMethodFilter;
    const matchesSearch =
      !searchTerm ||
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesDate = true;
    if ((dateRange.start || dateRange.end) && order.created_at) {
      const orderDate = new Date(order.created_at);

      if (dateRange.start && dateRange.end) {
        // Both start and end date-times provided
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        matchesDate = orderDate >= startDate && orderDate <= endDate;
      } else if (dateRange.start) {
        // Only start date-time provided
        const startDate = new Date(dateRange.start);
        matchesDate = orderDate >= startDate;
      } else if (dateRange.end) {
        // Only end date-time provided
        const endDate = new Date(dateRange.end);
        matchesDate = orderDate <= endDate;
      }
    }

    return matchesStatus && matchesPayment && matchesDate && matchesSearch;
  });

  // Pagination
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Helper functions
  const getCustomerName = (customerId: string | null) => {
    if (!customerId) return 'Unknown Customer';
    const customer = customers.find((c) => c.id === customerId);
    return customer?.name || 'Unknown Customer';
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'processing':
        return 'text-blue-600 bg-blue-100';
      case 'verified':
        return 'text-green-600 bg-green-100';
      case 'completed':
        return 'text-emerald-600 bg-emerald-100';
      case 'replacement':
        return 'text-pink-600 bg-pink-100';
      case 'refunded':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Helper function to get payment details for an order
  const getOrderPaymentDetails = (orderId: string): any => {
    return paymentDetails.find((pd: any) => pd.order_id === orderId);
  };

  // Add item to order
  const addItemToOrder = () => {
    if (!newItem.platform_id) return;

    const platform = platforms.find((p) => p.id === newItem.platform_id);
    if (!platform) return;

    // Check if requested quantity exceeds available inventory
    if (newItem.quantity > platform.inventory) {
      alert(
        `Error: Requested quantity (${newItem.quantity}) exceeds available inventory (${platform.inventory}) for ${platform.platform}.`,
      );
      return;
    }

    // Check if this platform is already in the order
    const existingItemIndex = createForm.items.findIndex(
      (item) => item.platform_id === newItem.platform_id,
    );

    if (existingItemIndex !== -1) {
      // Platform already exists, update quantity and total price
      const existingItem = createForm.items[existingItemIndex];
      const newQuantity = existingItem.quantity + newItem.quantity;
      const newTotalPrice = newQuantity * (Number(newItem.unit_price) || platform.cost_price || 0);

      // Check if total quantity exceeds available inventory
      if (newQuantity > platform.inventory) {
        alert(
          `Error: Total requested quantity (${newQuantity}) exceeds available inventory (${platform.inventory}) for ${platform.platform}.`,
        );
        return;
      }

      setCreateForm((prev) => ({
        ...prev,
        items: prev.items.map((item, index) =>
          index === existingItemIndex
            ? {
                ...item,
                quantity: newQuantity,
                unitPrice: Number(newItem.unit_price) || platform.cost_price || 0,
                total_price: newTotalPrice,
              }
            : item,
        ),
      }));
    } else {
      // Platform doesn't exist, add as new item
      const orderItem: OrderItem = {
        order_id: '', // Will be set when order is created
        platform_id: newItem.platform_id,
        platform: platform.platform,
        quantity: newItem.quantity,
        unitPrice: Number(newItem.unit_price) || platform.cost_price || 0,
        total_price: newItem.quantity * (Number(newItem.unit_price) || platform.cost_price || 0),
        username: newItem.username || undefined,
      };

      setCreateForm((prev) => ({
        ...prev,
        items: [...prev.items, orderItem],
      }));
    }

    // Reset new item form
    setNewItem({
      platform_id: '',
      quantity: 1,
      unit_price: 0,
      username: '',
    });

    // Reset price editing state
    setIsPriceEditable(false);
  };

  // Remove item from order
  const removeItemFromOrder = (platformId: string) => {
    setCreateForm((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.platform_id !== platformId),
    }));
  };

  // Add item to edit order
  const addItemToEditOrder = () => {
    if (!newItem.platform_id) return;

    const platform = platforms.find((p) => p.id === newItem.platform_id);
    if (!platform) return;

    // Check if requested quantity exceeds available inventory
    if (newItem.quantity > platform.inventory) {
      alert(
        `Error: Requested quantity (${newItem.quantity}) exceeds available inventory (${platform.inventory}) for ${platform.platform}.`,
      );
      return;
    }

    // Check if this platform is already in the order
    const existingItemIndex = editForm.items.findIndex(
      (item) => item.platform_id === newItem.platform_id,
    );

    if (existingItemIndex !== -1) {
      // Platform already exists, update quantity and total price
      const existingItem = editForm.items[existingItemIndex];
      const newQuantity = existingItem.quantity + newItem.quantity;
      const newTotalPrice = newQuantity * (Number(newItem.unit_price) || platform.cost_price || 0);

      // Check if total quantity exceeds available inventory
      if (newQuantity > platform.inventory) {
        alert(
          `Error: Total requested quantity (${newQuantity}) exceeds available inventory (${platform.inventory}) for ${platform.platform}.`,
        );
        return;
      }

      setEditForm((prev) => ({
        ...prev,
        items: prev.items.map((item, index) =>
          index === existingItemIndex
            ? {
                ...item,
                quantity: newQuantity,
                unitPrice: Number(newItem.unit_price) || platform.cost_price || 0,
                total_price: newTotalPrice,
              }
            : item,
        ),
      }));
    } else {
      // Platform doesn't exist, add as new item
      const orderItem: OrderItem = {
        order_id: editForm.id, // Use edit form ID
        platform_id: newItem.platform_id,
        platform: platform.platform,
        quantity: newItem.quantity,
        unitPrice: Number(newItem.unit_price) || platform.cost_price || 0,
        total_price: newItem.quantity * (Number(newItem.unit_price) || platform.cost_price || 0),
        username: newItem.username || undefined,
      };

      setEditForm((prev) => ({
        ...prev,
        items: [...prev.items, orderItem],
      }));
    }

    // Reset new item form
    setNewItem({
      platform_id: '',
      quantity: 1,
      unit_price: 0,
      username: '',
    });

    // Reset price editing state
    setIsPriceEditable(false);
  };

  // Remove item from edit order
  const removeItemFromEditOrder = (platformId: string) => {
    setEditForm((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.platform_id !== platformId),
    }));
  };

  // Start editing an item in the edit order
  const startEditingItem = (index: number) => {
    const item = editForm.items[index];
    
    // Calculate the price based on current quantity and customer pricing
    let unit_price = item.unitPrice || 0;
    if (editForm.customer_id && item.platform_id && item.quantity > 0) {
      // Calculate total quantity including other items of this platform in the order
      const existingQuantity = editForm.items
        .filter((it, idx) => idx !== index && it.platform_id === item.platform_id)
        .reduce((total, it) => total + it.quantity, 0);
      
      const totalQuantity = existingQuantity + item.quantity;
      
      const price = getCustomerPrice(
        editForm.customer_id,
        item.platform_id,
        totalQuantity,
      );
      
      // If customer pricing returns 0, fall back to platform cost price
      if (price > 0) {
        unit_price = price;
      } else {
        const platform = platforms.find((p) => p.id === item.platform_id);
        unit_price = platform?.cost_price || 0;
      }
    } else if (item.platform_id) {
      // Fallback to platform cost price if no customer selected
      const platform = platforms.find((p) => p.id === item.platform_id);
      unit_price = platform?.cost_price || 0;
    }
    
    setEditingItemIndex(index);
    setEditingItemData({
      platform_id: item.platform_id,
      quantity: item.quantity,
      unit_price: unit_price,
      username: item.username || '',
    });
  };

  // Cancel editing an item
  const cancelEditingItem = () => {
    setEditingItemIndex(null);
    setEditingItemData(null);
  };

  // Save edited item
  const saveEditedItem = (index: number) => {
    if (!editingItemData) return;

    setEditForm((prev) => {
      const updatedItems = [...prev.items];
      const platform = platforms.find((p) => p.id === editingItemData.platform_id);

      if (!platform) return prev;

      updatedItems[index] = {
        ...updatedItems[index],
        platform_id: editingItemData.platform_id,
        platform: `${platform.platform} - ${platform.account_type}`,
        quantity: editingItemData.quantity,
        unitPrice: editingItemData.unit_price,
        username: editingItemData.username,
        total_price: editingItemData.quantity * editingItemData.unit_price,
      };

      return {
        ...prev,
        items: updatedItems,
      };
    });

    setEditingItemIndex(null);
    setEditingItemData(null);
  };

  // Calculate order totals
  const calculateTotals = () => {
    const subtotal = createForm.items.reduce((sum, item) => sum + item.total_price, 0);
    const finalTotal = subtotal - (createForm.discount_amount || 0);
    return { subtotal, finalTotal };
  };

  // Calculate edit order totals
  const calculateEditTotals = () => {
    const subtotal = editForm.items.reduce((sum, item) => sum + item.total_price, 0);
    const finalTotal = subtotal - (editForm.discount_amount || 0);
    return { subtotal, finalTotal };
  };

  // Create new order
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      setError('User not authenticated. Please log in to create an order.');
      return;
    }
    if (createForm.items.length === 0) {
      setError('Please add at least one item to the order');
      return;
    }

    setLoading(true);
    try {
      const { finalTotal } = calculateTotals();

      // Generate a unique order number
      const orderNumber = `ORD-${Date.now()}`;

      // All orders start as pending status
      const orderStatus = 'pending';

      const orderData = {
        customer_id: createForm.customer_id,
        order_number: orderNumber,
        payment_method: createForm.payment_method,
        payment_status: 'pending' as const,
        total_amount: finalTotal,
        status: orderStatus as Order['status'],
        notes: createForm.notes,
        created_by: user?.id || null,
      };

      // First create the order
      const { data: orderResult, error: orderError } = await supabase
        .from('orders')
        .insert([orderData as any])
        .select()
        .single();

      if (orderError) throw orderError;

      // Then create the order items in the order_items table
      const orderItems = createForm.items.map((item) => ({
        order_id: orderResult.id,
        platform_id: item.platform_id,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.total_price,
        username: item.username || null,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

      if (itemsError) throw itemsError;

      // Save payment details if they exist
      if (createForm.payment_details) {
        const { finalTotal } = calculateTotals();
        const paymentDetailsRow = buildPaymentDetailsInsert(
          orderResult.id,
          createForm.payment_details,
          finalTotal,
          createForm.payment_method,
        );
        const { error: paymentError } = await supabase
          .from('payment_details')
          .insert([paymentDetailsRow]);
        if (paymentError) throw paymentError;
      }

      // Deduct inventory for each item in the order
      for (const item of createForm.items) {
        // First, get the current inventory
        const { data: currentPlatform, error: fetchError } = await supabase
          .from('game_coins')
          .select('inventory')
          .eq('id', item.platform_id)
          .single();

        if (fetchError) throw fetchError;

        // Calculate new inventory
        const newInventory = (currentPlatform?.inventory || 0) - item.quantity;

        // Update inventory
        const { error: inventoryError } = await supabase
          .from('game_coins')
          .update({ inventory: newInventory })
          .eq('id', item.platform_id);

        if (inventoryError) throw inventoryError;
      }

      // Reset form
      setCreateForm({
        customer_id: '',
        items: [],
        payment_method: 'None',
        payment_details: null,
        discount_amount: 0,
        notes: '',
      });
      setShowCreateModal(false);

      fetchData();
      alert('Order created successfully! It is now pending verification.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  // Update order status
  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: newStatus,
          verified_at: newStatus === 'verified' ? new Date().toISOString() : null,
          verified_by: newStatus === 'verified' ? user?.id || 'admin' : null,
        })
        .eq('id', orderId);

      if (error) throw error;
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order status');
    } finally {
      setLoading(false);
    }
  };

  // Handle edit order - populate edit form with existing order data
  const handleEditOrder = (order: Order) => {
    setEditForm({
      id: order.id,
      customer_id: order.customer_id || '',
      items: order.items,
      payment_method: order.payment_method || 'None',
      payment_details: order.payment_method === 'None' ? null : order.payment_details,
      discount_amount: order.discount_amount || 0,
      notes: order.notes || '',
    });
    setShowEditModal(true);
  };

  // Update order
  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      setError('User not authenticated. Please log in to update an order.');
      return;
    }
    if (editForm.items.length === 0) {
      setError('Please add at least one item to the order');
      return;
    }

    setLoading(true);
    try {
      const { finalTotal } = calculateEditTotals();

      // Get original order data directly from database to ensure we have the ACTUAL original items
      // (not the items that might have been updated from a previous edit session)
      const { data: originalOrderData, error: fetchOriginalError } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(
            id,
            platform_id,
            quantity,
            unit_price,
            total_price,
            username,
            usernames
          )
        `)
        .eq('id', editForm.id)
        .single();

      if (fetchOriginalError || !originalOrderData) {
        throw new Error('Failed to fetch original order from database');
      }

      const originalOrder = originalOrderData;

      // Build a map of current inventory + what we're returning from the original order
      const inventoryChanges: { [platformId: string]: { 
        originalQty: number; 
        newQty: number; 
        currentInventory: number 
      } } = {};

      // First pass: record original quantities (these will be returned to inventory)
      for (const originalItem of originalOrder.items) {
        const platform = platforms.find((p) => p.id === originalItem.platform_id);
        if (!platform) continue;
        
        inventoryChanges[originalItem.platform_id] = {
          originalQty: originalItem.quantity,
          newQty: 0,
          currentInventory: platform.inventory,
        };
      }

      // Second pass: record new quantities (these will be deducted from inventory)
      for (const newItem of editForm.items) {
        const platform = platforms.find((p) => p.id === newItem.platform_id);
        if (!platform) continue;

        if (inventoryChanges[newItem.platform_id]) {
          inventoryChanges[newItem.platform_id].newQty = newItem.quantity;
        } else {
          inventoryChanges[newItem.platform_id] = {
            originalQty: 0,
            newQty: newItem.quantity,
            currentInventory: platform.inventory,
          };
        }
      }
      
      // Validate inventory availability
      for (const [platformId, change] of Object.entries(inventoryChanges)) {
        const platform = platforms.find((p) => p.id === platformId);
        if (!platform) continue;

        // Available = current inventory + what we're returning from original order
        const availableInventory = change.currentInventory + change.originalQty;
        
        if (change.newQty > availableInventory) {
          throw new Error(
            `Insufficient inventory for ${platform.platform}. Available: ${availableInventory}, Requested: ${change.newQty}`,
          );
        }
      }

      // Update the order
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          customer_id: editForm.customer_id,
          payment_method: editForm.payment_method,
          total_amount: finalTotal,
          notes: editForm.notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editForm.id);

      if (orderError) {
        throw orderError;
      }

      // IMPORTANT: Apply inventory changes FIRST, before deleting order items
      // This prevents any delete triggers from interfering with our inventory logic
      
      for (const [platformId, change] of Object.entries(inventoryChanges)) {
        const netChange = change.originalQty - change.newQty;
        
        // Only update if there's a net change
        if (netChange !== 0) {
          // Get the latest inventory from database to avoid stale data
          const { data: latestPlatform, error: fetchError } = await supabase
            .from('game_coins')
            .select('inventory, platform')
            .eq('id', platformId)
            .single();

          if (fetchError) {
            throw fetchError;
          }

          // CRITICAL: There's a database trigger that restores inventory when we insert order_items
          // The trigger adds back the originalQty after insertion, so we need to compensate by
          // subtracting an EXTRA originalQty from our calculation
          const currentInventory = latestPlatform?.inventory || 0;
          const compensatedInventory = currentInventory + netChange - change.originalQty;
          const newInventory = compensatedInventory;

          const { error: inventoryError } = await supabase
            .from('game_coins')
            .update({ inventory: newInventory })
            .eq('id', platformId);

          if (inventoryError) {
            throw inventoryError;
          }
        }
      }

      // NOW delete existing order items (after inventory is updated)
      const { error: deleteItemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', editForm.id);

      if (deleteItemsError) throw deleteItemsError;

      // Insert updated order items
      const orderItems = editForm.items.map((item) => ({
        order_id: editForm.id,
        platform_id: item.platform_id,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.total_price,
        username: item.username || null,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

      if (itemsError) throw itemsError;

      // Always delete existing payment details first
      const { error: deletePaymentError } = await supabase
        .from('payment_details')
        .delete()
        .eq('order_id', editForm.id);

      if (deletePaymentError) {
        throw deletePaymentError;
      }

      // Insert new payment details only if payment method is not "None"
      if (editForm.payment_details && editForm.payment_method !== 'None') {
        const { finalTotal } = calculateEditTotals();
        const paymentDetailsRow = buildPaymentDetailsInsert(
          editForm.id,
          editForm.payment_details,
          finalTotal,
          editForm.payment_method,
        );
        const { error: paymentError } = await supabase
          .from('payment_details')
          .insert([paymentDetailsRow]);
        if (paymentError) throw paymentError;
      }

      // Reset form and close modal
      setEditForm({
        id: '',
        customer_id: '',
        items: [],
        payment_method: 'None',
        payment_details: null,
        discount_amount: 0,
        notes: '',
      });
      setShowEditModal(false);

      fetchData();
      alert('Order updated successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order');
    } finally {
      setLoading(false);
    }
  };

  // Refund functionality
  const handleRefund = async () => {
    if (!selectedOrder) return;

    setLoading(true);
    try {
      // First, get the order items to restore inventory
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('platform_id, quantity')
        .eq('order_id', selectedOrder.id);

      if (itemsError) throw itemsError;

      // Restore inventory for each platform
      if (orderItems && orderItems.length > 0) {
        for (const item of orderItems) {
          // First get current inventory
          const { data: currentPlatform, error: getCurrentError } = await supabase
            .from('game_coins')
            .select('inventory')
            .eq('id', item.platform_id)
            .single();

          if (getCurrentError) throw getCurrentError;

          // Update with new inventory value
          const newInventory = (currentPlatform?.inventory || 0) + item.quantity;
          const { error: inventoryError } = await supabase
            .from('game_coins')
            .update({
              inventory: newInventory,
            })
            .eq('id', item.platform_id);

          if (inventoryError) throw inventoryError;
        }
      }

      // Update order to set total_amount to 0 and change payment status
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          total_amount: 0,
          payment_status: 'refunded',
          status: 'refunded', // Set status to refunded
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedOrder.id);

      if (orderError) throw orderError;

      // Update payment details to show refunded status
      const { error: paymentError } = await supabase
        .from('payment_details')
        .update({
          amount: 0,
          notes: `REFUNDED: ${refundForm.reason}. ${refundForm.notes || ''}`.trim(),
        })
        .eq('order_id', selectedOrder.id);

      if (paymentError) throw paymentError;

      // Create refund record for audit trail
      const { error: refundError } = await supabase.from('refunds_replacements').insert({
        order_id: selectedOrder.id,
        type: 'refund',
        reason: refundForm.reason,
        amount: selectedOrder.total_amount, // Record original amount
        notes: refundForm.notes,
        status: 'completed',
        created_by: user?.id || 'admin',
        processed_by: user?.id || 'admin',
        processed_at: new Date().toISOString(),
      });

      if (refundError) throw refundError;

      // Reset form and close modals
      setRefundForm({ reason: '', notes: '' });
      setShowRefundModal(false);
      setShowViewModal(false);
      fetchData();

      alert(
        'Refund processed successfully! Inventory has been restored and order amount set to $0.',
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process refund');
    } finally {
      setLoading(false);
    }
  };

  // Replacement functionality
  const handleReplacement = async () => {
    if (!selectedOrder) return;

    setLoading(true);
    try {
      // NOTE: Replacements don't affect inventory. 
      // A replacement means we're replacing defective/incorrect accounts with working ones,
      // but the customer already paid and received accounts from our inventory.
      // The inventory was already deducted when the original order was created.
      // We're just swapping the account credentials, not issuing new inventory.
      
      // Update order status to replacement
      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: 'replacement' })
        .eq('id', selectedOrder.id);

      if (orderError) throw orderError;

      // Create replacement record
      const { error: replacementError } = await supabase.from('refunds_replacements').insert({
        order_id: selectedOrder.id,
        type: 'replacement',
        reason: replacementForm.reason,
        notes: replacementForm.notes,
        status: 'completed',
        created_by: user?.id || 'admin', // Use actual user ID
        processed_by: user?.id || 'admin',
        processed_at: new Date().toISOString(),
      });

      if (replacementError) throw replacementError;

      // Reset form and close modal
      setReplacementForm({ reason: '', notes: '' });
      setShowReplacementModal(false);
      setShowViewModal(false);
      fetchData();

      alert('Replacement processed successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process replacement');
    } finally {
      setLoading(false);
    }
  };

  // Invoice functions
  const handleCopyInvoice = async () => {
    if (!invoiceRef.current) return;

    setInvoiceLoading(true);
    try {
      const success = await copyInvoiceToClipboard(invoiceRef.current);
      if (success) {
        // You could add a toast notification here
        alert('Invoice copied to clipboard!');
      } else {
        alert('Failed to copy invoice to clipboard');
      }
    } catch {
      alert('Failed to copy invoice to clipboard');
    } finally {
      setInvoiceLoading(false);
    }
  };

  const handleCopyInvoiceFromTable = async (order: Order) => {
    setInvoiceLoading(true);

    try {
      // Create a temporary container for the invoice
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '-9999px';
      tempContainer.style.width = '800px'; // Set proper width for rendering
      document.body.appendChild(tempContainer);

      // Create the invoice HTML directly
      const customer = customers.find((c) => c.id === order.customer_id);

      // Create invoice HTML content
      const invoiceHTML = `
        <div style="
          background: #ffffff;
          padding: 40px;
          border-radius: 20px;
          box-shadow: 0 10px 40px rgba(236, 72, 153, 0.15);
          max-width: 800px;
          margin: 0 auto;
          font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          border: 2px solid #fce7f3;
          line-height: 1.6;
        ">
          <!-- Header -->
          <div style="
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            padding-bottom: 24px;
            border-bottom: 3px solid #ec4899;
          ">
            <div style="display: flex; align-items: center;">
              <div>
                <div style="
                  font-weight: 800;
                  font-size: 28px;
                  color: #ec4899;
                  margin-bottom: 4px;
                  letter-spacing: -0.5px;
                ">
                  USA Gaming Distributor
                </div>
                <div style="font-size: 14px; color: #6b7280; margin-bottom: 2px;">
                  📧 support@usagaming.com | 📞 +1-800-123-4567
                </div>
                <div style="font-size: 14px; color: #6b7280;">
                  📍 123 Main Street, New York, NY 10001
                </div>
              </div>
            </div>
            
            <div style="text-align: right;">
              <div style="
                font-size: 32px;
                font-weight: 800;
                color: #1f2937;
                margin-bottom: 8px;
                letter-spacing: -1px;
              ">
                INVOICE
              </div>
              <div style="
                background-color: #fce7f3;
                color: #be185d;
                padding: 8px 16px;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                display: inline-block;
              ">
                #${order.id.slice(-8).toUpperCase()}
              </div>
            </div>
          </div>

          <!-- Customer and Invoice Info -->
          <div style="
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 32px;
            margin-bottom: 32px;
          ">
            <!-- Bill To -->
            <div>
              <div style="
                font-size: 18px;
                font-weight: 700;
                color: #1f2937;
                margin-bottom: 12px;
                border-bottom: 2px solid #fce7f3;
                padding-bottom: 8px;
              ">
                📋 Bill To
              </div>
              <div style="font-size: 16px; font-weight: 600; color: #374151; margin-bottom: 8px;">
                ${customer?.name || 'Unknown Customer'}
              </div>
              ${
                customer?.contact_numbers && customer.contact_numbers.length > 0
                  ? `
                <div style="font-size: 14px; color: #6b7280; margin-bottom: 4px;">
                  📞 ${customer.contact_numbers[0]}
                </div>
              `
                  : ''
              }
              <div style="font-size: 12px; color: #9ca3af; margin-top: 8px;">
                Customer ID: ${customer?.id.slice(-8).toUpperCase() || 'N/A'}
              </div>
            </div>

            <!-- Invoice Info -->
            <div>
              <div style="
                font-size: 18px;
                font-weight: 700;
                color: #1f2937;
                margin-bottom: 12px;
                border-bottom: 2px solid #fce7f3;
                padding-bottom: 8px;
              ">
                📄 Invoice Details
              </div>
              <div style="display: grid; gap: 8px;">
                <div style="display: flex; justify-content: space-between;">
                  <span style="font-size: 14px; color: #6b7280; font-weight: 500;">Date:</span>
                  <span style="font-size: 14px; font-weight: 600; color: #374151;">
                    ${
                      order.created_at
                        ? new Date(order.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'N/A'
                    }
                  </span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="font-size: 14px; color: #6b7280; font-weight: 500;">Payment Method:</span>
                  <span style="
                    font-size: 14px;
                    font-weight: 600;
                    color: #374151;
                    background-color: #fce7f3;
                    padding: 2px 8px;
                    border-radius: 4px;
                  ">
                    ${order.payment_method}
                  </span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="font-size: 14px; color: #6b7280; font-weight: 500;">Status:</span>
                  <span style="
                    font-size: 14px;
                    font-weight: 600;
                    color: #059669;
                    background-color: #d1fae5;
                    padding: 2px 8px;
                    border-radius: 4px;
                  ">
                    ${order.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Items Table -->
          <div style="margin-bottom: 32px;">
            <div style="
              font-size: 18px;
              font-weight: 700;
              color: #1f2937;
              margin-bottom: 16px;
              border-bottom: 2px solid #fce7f3;
              padding-bottom: 8px;
            ">
              🛒 Order Items
            </div>
            
            <table style="
              width: 100%;
              font-size: 14px;
              border-collapse: collapse;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
            ">
              <thead>
                <tr style="background-color: #ec4899; color: white;">
                  <th style="padding: 16px 12px; text-align: left; font-weight: 600; font-size: 14px; letter-spacing: 0.5px;">Platform</th>
                  <th style="padding: 16px 12px; text-align: center; font-weight: 600; font-size: 14px; letter-spacing: 0.5px;">Account Type</th>
                  <th style="padding: 16px 12px; text-align: center; font-weight: 600; font-size: 14px; letter-spacing: 0.5px;">Qty</th>
                  <th style="padding: 16px 12px; text-align: right; font-weight: 600; font-size: 14px; letter-spacing: 0.5px;">Unit Price</th>
                  <th style="padding: 16px 12px; text-align: right; font-weight: 600; font-size: 14px; letter-spacing: 0.5px;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${order.items
                  .map((item, idx) => {
                    const platform = platforms.find((p) => p.id === item.platform_id);
                    const isEvenRow = idx % 2 === 0;
                    return `
                    <tr style="background-color: ${
                      isEvenRow ? '#fdf2f8' : '#ffffff'
                    }; border-bottom: 1px solid #fce7f3;">
                      <td style="padding: 16px 12px; font-weight: 600; color: #374151;">
                        ${item.platform || platform?.platform || 'Unknown Platform'}
                      </td>
                      <td style="padding: 16px 12px; text-align: center; color: #6b7280; font-weight: 500;">
                        <span style="
                          background-color: #fce7f3;
                          color: #be185d;
                          padding: 4px 8px;
                          border-radius: 6px;
                          font-size: 12px;
                          font-weight: 600;
                        ">
                          ${platform?.account_type || 'Standard'}
                        </span>
                      </td>
                      <td style="padding: 16px 12px; text-align: center; font-weight: 600; color: #374151;">
                        ${item.quantity}
                      </td>
                      <td style="padding: 16px 12px; text-align: right; font-weight: 600; color: #374151;">
                        $${(item.unitPrice || 0).toFixed(2)}
                      </td>
                      <td style="padding: 16px 12px; text-align: right; font-weight: 700; color: #059669; font-size: 15px;">
                        $${(item.total_price || 0).toFixed(2)}
                      </td>
                    </tr>
                  `;
                  })
                  .join('')}
              </tbody>
            </table>
          </div>

          <!-- Totals -->
          <div style="display: flex; justify-content: flex-end; margin-bottom: 32px;">
            <div style="
              background-color: #fdf2f8;
              padding: 24px;
              border-radius: 16px;
              border: 2px solid #fce7f3;
              min-width: 300px;
            ">
              <div style="
                font-size: 18px;
                font-weight: 700;
                color: #1f2937;
                margin-bottom: 16px;
                text-align: center;
              ">
                💰 Summary
              </div>
              
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <span style="font-size: 16px; font-weight: 500; color: #6b7280;">Subtotal:</span>
                <span style="font-size: 16px; font-weight: 600; color: #374151;">$${order.total_amount.toFixed(
                  2,
                )}</span>
              </div>
              
              ${
                order.discount_amount > 0
                  ? `
                <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                  <span style="font-size: 16px; font-weight: 500; color: #dc2626;">Discount:</span>
                  <span style="font-size: 16px; font-weight: 600; color: #dc2626;">-$${order.discount_amount.toFixed(
                    2,
                  )}</span>
                </div>
              `
                  : ''
              }
              
              <hr style="margin: 16px 0; border: none; border-top: 2px solid #ec4899; opacity: 0.6;" />
              
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 20px; font-weight: 800; color: #1f2937;">Grand Total:</span>
                <span style="
                  font-size: 24px;
                  font-weight: 800;
                  color: #ec4899;
                  background-color: white;
                  padding: 8px 16px;
                  border-radius: 8px;
                  border: 2px solid #ec4899;
                ">
                  $${order.final_amount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div style="border-top: 3px solid #ec4899; padding-top: 24px; text-align: center;">
            <div style="
              background-color: #fdf2f8;
              padding: 20px;
              border-radius: 16px;
              border: 2px solid #fce7f3;
            ">
              <div style="
                font-size: 18px;
                font-weight: 700;
                color: #ec4899;
                margin-bottom: 8px;
              ">
                🎮 Thank You for Your Purchase!
              </div>
              <div style="
                font-size: 14px;
                color: #6b7280;
                margin-bottom: 12px;
                line-height: 1.6;
              ">
                Your gaming accounts will be delivered within 24 hours.<br />
                For any questions or support, please don't hesitate to contact us.
              </div>
              <div style="
                display: flex;
                justify-content: center;
                gap: 24px;
                font-size: 13px;
                color: #9ca3af;
              ">
                <div>📧 support@usagaming.com</div>
                <div>📞 +1-800-123-4567</div>
                <div>💬 Live Chat Available 24/7</div>
              </div>
            </div>
          </div>
        </div>
      `;

      tempContainer.innerHTML = invoiceHTML;

      // Use html2canvas to convert to image and copy
      const success = await copyInvoiceToClipboard(tempContainer);

      if (success) {
        alert('Invoice copied to clipboard!');
      } else {
        alert('Failed to copy invoice to clipboard');
      }
    } catch {
      alert('Failed to copy invoice to clipboard');
    } finally {
      // Clean up
      const tempContainer = document.querySelector(
        'div[style*="position: absolute"][style*="-9999px"]',
      );
      if (tempContainer) {
        document.body.removeChild(tempContainer);
      }
      setInvoiceLoading(false);
    }
  };

  const handleDownloadInvoice = async (order: Order) => {
    if (!invoiceRef.current) return;

    setInvoiceLoading(true);
    try {
      const success = await downloadInvoiceImage(invoiceRef.current, order.id);
      if (!success) {
        alert('Failed to download invoice');
      }
    } catch {
      alert('Failed to download invoice');
    } finally {
      setInvoiceLoading(false);
    }
  };

  const openInvoiceModal = (order: Order) => {
    setSelectedOrder(order);
    setShowInvoiceModal(true);
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Order Management</h2>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Order
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4 mb-6">
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as Order['status'] | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent min-w-[140px]"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="verified">Verified</option>
            <option value="refunded">Refunded</option>
            <option value="replacement">Replacement</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Payment Method</label>
          <select
            value={paymentMethodFilter}
            onChange={(e) => setPaymentMethodFilter(e.target.value as PaymentMethod | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent min-w-[160px]"
          >
            <option value="all">All Payment Methods</option>
            <option value="Cash">Cash</option>
            <option value="Crypto">Crypto</option>
            <option value="Bank Transfer">Bank Transfer</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Date & Time Range</label>
          <div className="flex items-center space-x-2">
            <input
              type="datetime-local"
              value={dateRange.start}
              onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm w-[180px]"
              placeholder="Start date & time"
            />
            <span className="text-gray-500 text-sm">to</span>
            <input
              type="datetime-local"
              value={dateRange.end}
              onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm w-[180px]"
              placeholder="End date & time"
            />
          </div>
        </div>

        <button
          onClick={() => {
            setStatusFilter('all');
            setPaymentMethodFilter('all');
            setDateRange({ start: '', end: '' });
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center min-w-[120px]"
        >
          <Filter className="w-4 h-4 mr-2" />
          Reset
        </button>
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Order ID</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Customer</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Items</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Total</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Payment</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-8">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
                  </div>
                </td>
              </tr>
            ) : paginatedOrders.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-gray-500">
                  {orders.length === 0
                    ? 'No orders found. Create your first order to get started.'
                    : searchTerm
                      ? `No orders found matching "${searchTerm}".`
                      : 'No orders found with the current filters.'}
                </td>
              </tr>
            ) : (
              paginatedOrders.map((order) => (
                <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <span className="font-mono text-sm">#{order.id.slice(-8)}</span>
                  </td>
                  <td className="py-3 px-4">{getCustomerName(order.customer_id)}</td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-600">
                      {order.items.length} item
                      {order.items.length !== 1 ? 's' : ''}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold">${order.final_amount.toFixed(2)}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm">{order.payment_method}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        order.status,
                      )}`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-600">
                      {order.created_at ? new Date(order.created_at).toLocaleString() : 'N/A'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      {(order.status === 'pending' || order.status === 'processing') && (
                        <button
                          onClick={() => handleEditOrder(order)}
                          className="p-1 text-orange-600 hover:bg-orange-100 rounded"
                          title="Edit Order"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowViewModal(true);
                        }}
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                        title="View Order"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => openInvoiceModal(order)}
                        className="p-1 text-pink-600 hover:bg-pink-100 rounded"
                        title="View Invoice"
                      >
                        <FileText className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleCopyInvoiceFromTable(order)}
                        className="p-1 text-green-600 hover:bg-green-100 rounded"
                        title="Copy Invoice to Clipboard"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      {order.status === 'pending' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'verified')}
                          className="p-1 text-green-600 hover:bg-green-100 rounded"
                          title="Verify Order"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </button>
                      )}

                      {order.invoice_url && (
                        <button
                          onClick={() => window.open(order.invoice_url!, '_blank')}
                          className="p-1 text-pink-600 hover:bg-pink-100 rounded"
                          title="View Invoice"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalItems={filteredOrders.length}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
      />

      {/* Create Order Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-white/10 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-pink-600 to-pink-700 text-white p-6 flex-shrink-0">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold">Create New Order</h3>
                  <p className="text-pink-100 text-sm mt-1">Add a new order to the system</p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-pink-100 hover:text-white p-2 rounded-lg hover:bg-pink-600/50 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <form id="create-order-form" onSubmit={handleCreateOrder}>
                {/* Customer Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer *</label>
                  <select
                    value={createForm.customer_id}
                    onChange={async (e) => {
                      const customerId = e.target.value;
                      setCreateForm((prev) => ({
                        ...prev,
                        customer_id: customerId,
                      }));

                      // Automatically update item price when customer changes
                      if (customerId && newItem.platform_id && newItem.quantity > 0) {
                        // Calculate total quantity including existing items of this platform in the order
                        const existingQuantity = createForm.items
                          .filter((item) => item.platform_id === newItem.platform_id)
                          .reduce((total, item) => total + item.quantity, 0);

                        const totalQuantity = existingQuantity + newItem.quantity;

                        const price = getCustomerPrice(
                          customerId,
                          newItem.platform_id,
                          totalQuantity,
                        );
                        setNewItem((prev) => ({
                          ...prev,
                          unit_price: price,
                        }));
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Add Items Section */}
                <div className="mb-6">
                  <h4 className="text-md font-semibold text-gray-700 mb-3">Add Items</h4>

                  {/* Platform and Username Selection Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <select
                      value={newItem.platform_id}
                      onChange={(e) => {
                        const platformId = e.target.value;
                        setNewItem((prev) => ({
                          ...prev,
                          platform_id: platformId,
                          unit_price: 0, // Reset price, will be updated below
                          username: '', // Reset username when platform changes
                        }));

                        // Reset price editing state when platform changes
                        setIsPriceEditable(false);

                        // Automatically calculate price based on customer pricing
                        if (createForm.customer_id && platformId && newItem.quantity > 0) {
                          // Calculate total quantity including existing items of this platform in the order
                          const existingQuantity = createForm.items
                            .filter((item) => item.platform_id === platformId)
                            .reduce((total, item) => total + item.quantity, 0);

                          const totalQuantity = existingQuantity + newItem.quantity;

                          const price = getCustomerPrice(
                            createForm.customer_id,
                            platformId,
                            totalQuantity,
                          );
                          setNewItem((prev) => ({
                            ...prev,
                            unit_price: price,
                          }));
                        } else if (platformId) {
                          // Fallback to platform cost price if no customer selected
                          const platform = platforms.find((p) => p.id === platformId);
                          setNewItem((prev) => ({
                            ...prev,
                            unit_price: platform?.cost_price || 0,
                          }));
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    >
                      <option value="">Select Platform</option>
                      {platforms.map((platform) => (
                        <option key={platform.id} value={platform.id}>
                          {platform.platform} - {platform.account_type}
                        </option>
                      ))}
                    </select>

                    {/* Username Dropdown */}
                    <select
                      value={newItem.username}
                      onChange={(e) =>
                        setNewItem((prev) => ({
                          ...prev,
                          username: e.target.value,
                        }))
                      }
                      disabled={!createForm.customer_id || !newItem.platform_id}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">
                        {!createForm.customer_id
                          ? 'Select Customer First'
                          : !newItem.platform_id
                            ? 'Select Platform First'
                            : customerUsernames.length === 0
                              ? 'No usernames available (create some in Customer Panel)'
                              : getAvailableUsernames(createForm.customer_id, newItem.platform_id)
                                    .length === 0
                                ? 'No usernames for this customer+platform'
                                : 'Select Username'}
                      </option>
                      {createForm.customer_id &&
                        newItem.platform_id &&
                        getAvailableUsernames(createForm.customer_id, newItem.platform_id).map(
                          (username: any) => (
                            <option key={username.id} value={username.username}>
                              {username.username}
                            </option>
                          ),
                        )}
                    </select>
                  </div>

                  {/* Quantity, Price and Add Button Row */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                    <input
                      type="number"
                      placeholder="Quantity"
                      min="1"
                      value={newItem.quantity}
                      onChange={(e) => {
                        const quantity = parseInt(e.target.value) || 1;
                        setNewItem((prev) => {
                          const updatedItem = {
                            ...prev,
                            quantity: quantity,
                          };

                          // Automatically calculate price based on customer pricing
                          if (createForm.customer_id && prev.platform_id && quantity > 0) {
                            // Calculate total quantity including existing items of this platform in the order
                            const existingQuantity = createForm.items
                              .filter((item) => item.platform_id === prev.platform_id)
                              .reduce((total, item) => total + item.quantity, 0);

                            const totalQuantity = existingQuantity + quantity;

                            const price = getCustomerPrice(
                              createForm.customer_id,
                              prev.platform_id,
                              totalQuantity,
                            );
                            updatedItem.unit_price = price;
                            // Reset price editing state when price is auto-calculated
                            setIsPriceEditable(false);
                          }

                          return updatedItem;
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />

                    <div className="relative">
                      <input
                        type="number"
                        placeholder="Unit Price"
                        step="0.01"
                        min="0"
                        value={newItem.unit_price}
                        disabled={!isPriceEditable}
                        onChange={(e) =>
                          setNewItem((prev) => ({
                            ...prev,
                            unit_price: parseFloat(e.target.value) || 0,
                          }))
                        }
                        className={`w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
                          !isPriceEditable
                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                            : 'bg-white'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setIsPriceEditable(!isPriceEditable)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-pink-500 transition-colors"
                        title={isPriceEditable ? 'Disable price editing' : 'Enable price editing'}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={addItemToOrder}
                      disabled={!newItem.platform_id}
                      className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed col-span-2 md:col-span-1"
                    >
                      Add Item
                    </button>
                  </div>

                  {/* Order Items List */}
                  {createForm.items.length > 0 && (
                    <div className="border border-gray-200 rounded-lg">
                      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                        <h5 className="font-medium text-gray-700">Order Items</h5>
                      </div>
                      <div className="p-4">
                        {createForm.items.map((item, index) => (
                          <div
                            key={`item-${index}`}
                            className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
                          >
                            <div>
                              <div className="font-medium">{item.platform}</div>
                              <div className="text-sm text-gray-600">
                                {item.username && (
                                  <span className="inline-flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded-md mr-2 text-xs">
                                    👤 {item.username}
                                  </span>
                                )}
                                <span>
                                  {item.quantity} × ${(item.unitPrice || 0).toFixed(2)}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold">
                                ${(item.total_price || 0).toFixed(2)}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeItemFromOrder(item.platform_id)}
                                className="text-red-600 hover:bg-red-100 p-1 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Order Totals */}
                {createForm.items.length > 0 && (
                  <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span>Subtotal:</span>
                      <span>${calculateTotals().subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span>Discount:</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max={calculateTotals().subtotal}
                        value={createForm.discount_amount}
                        onChange={(e) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            discount_amount: parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="w-24 px-2 py-1 border border-gray-300 rounded text-right"
                      />
                    </div>
                    <div className="flex justify-between items-center font-semibold text-lg border-t border-gray-200 pt-2">
                      <span>Total:</span>
                      <span>${calculateTotals().finalTotal.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {/* Payment Method */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method (optional)
                  </label>
                  <select
                    value={createForm.payment_method}
                    onChange={(e) => {
                      const paymentMethod = e.target.value as PaymentMethod;
                      let defaultPaymentDetails: PaymentDetails | null = null;

                      if (paymentMethod !== 'None') {
                        switch (paymentMethod) {
                          case 'Crypto':
                            defaultPaymentDetails = {
                              payment_method: 'Crypto',
                              id: '',
                              order_id: '',
                              amount: 0,
                              currency: 'USDT',
                              crypto_currency: 'USDT',
                              crypto_username: '',
                              crypto_wallet_address: '',
                              created_at: new Date().toISOString(),
                              updated_at: new Date().toISOString(),
                            } as CryptoPaymentDetails;
                            break;
                          case 'Bank Transfer':
                            defaultPaymentDetails = {
                              payment_method: 'Bank Transfer',
                              id: '',
                              order_id: '',
                              amount: 0,
                              currency: 'USD',
                              created_at: new Date().toISOString(),
                              updated_at: new Date().toISOString(),
                            } as BankTransferDetails;
                            break;
                          case 'Cash':
                          default:
                            defaultPaymentDetails = {
                              payment_method: 'Cash',
                              id: '',
                              order_id: '',
                              amount: 0,
                              currency: 'USD',
                              created_at: new Date().toISOString(),
                              updated_at: new Date().toISOString(),
                            } as CashPaymentDetails;
                            break;
                        }
                      }

                      setCreateForm((prev) => ({
                        ...prev,
                        payment_method: paymentMethod,
                        payment_details: defaultPaymentDetails,
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option value="None">None</option>
                    <option value="Cash">Cash</option>
                    <option value="Crypto">Crypto</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>

                {/* Payment Details Forms */}
                {createForm.payment_method === 'Crypto' && (
                  <div className="mb-4 p-4 border border-gray-200 rounded-lg">
                    <h5 className="font-medium text-gray-700 mb-3">Crypto Payment Details</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <select
                        value={
                          ((createForm.payment_details as any)?.crypto_currency ??
                            (createForm.payment_details as any)?.crypto_network) ||
                          'USDT'
                        }
                        onChange={(e) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            payment_details: {
                              ...(prev.payment_details as PaymentDetails),
                              ...(['TRC20', 'BEP20'].includes(e.target.value)
                                ? {
                                    crypto_network: e.target.value,
                                    crypto_currency: undefined,
                                  }
                                : {
                                    crypto_currency: e.target.value,
                                    crypto_network: undefined,
                                  }),
                              crypto_username: '', // Reset username/wallet when changing type
                              crypto_wallet_address: '',
                            },
                          }))
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      >
                        <option value="USDT">USDT</option>
                        <option value="USDC">USDC</option>
                        <option value="BTC">BTC</option>
                        <option value="TRC20">TRC20</option>
                        <option value="BEP20">BEP20</option>
                      </select>

                      {['USDT', 'USDC'].includes(
                        (createForm.payment_details as any)?.crypto_currency || 'USDT',
                      ) ? (
                        <input
                          type="text"
                          placeholder="Username"
                          value={(createForm.payment_details as any)?.crypto_username || ''}
                          onChange={(e) =>
                            setCreateForm((prev) => ({
                              ...prev,
                              payment_details: {
                                ...(prev.payment_details as PaymentDetails),
                                crypto_username: e.target.value,
                              },
                            }))
                          }
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          required
                        />
                      ) : (
                        <input
                          type="text"
                          placeholder="Wallet Address"
                          value={(createForm.payment_details as any)?.crypto_wallet_address || ''}
                          onChange={(e) =>
                            setCreateForm((prev) => ({
                              ...prev,
                              payment_details: {
                                ...(prev.payment_details as PaymentDetails),
                                crypto_wallet_address: e.target.value,
                              },
                            }))
                          }
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          required
                        />
                      )}
                    </div>
                  </div>
                )}

                {createForm.payment_method === 'Bank Transfer' && (
                  <div className="mb-4 p-4 border border-gray-200 rounded-lg">
                    <h5 className="font-medium text-gray-700 mb-3">Bank Transfer Details</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Reference Number"
                        value={
                          (createForm.payment_details as any)?.bank_transaction_reference || ''
                        }
                        onChange={(e) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            payment_details: {
                              ...(prev.payment_details as PaymentDetails),
                              bank_transaction_reference: e.target.value,
                            },
                          }))
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        required
                      />

                      <input
                        type="text"
                        placeholder="Sender Name"
                        value={(createForm.payment_details as any)?.sender_name || ''}
                        onChange={(e) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            payment_details: {
                              ...(prev.payment_details as PaymentDetails),
                              sender_name: e.target.value,
                            },
                          }))
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        required
                      />

                      <input
                        type="text"
                        placeholder="Sender Institution"
                        value={(createForm.payment_details as any)?.sender_bank || ''}
                        onChange={(e) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            payment_details: {
                              ...(prev.payment_details as any),
                              sender_bank: e.target.value,
                            },
                          }))
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />

                      <input
                        type="text"
                        placeholder="Purpose"
                        value={(createForm.payment_details as any)?.purpose || ''}
                        onChange={(e) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            payment_details: {
                              ...(prev.payment_details as any),
                              purpose: e.target.value,
                            },
                          }))
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />

                      <input
                        type="text"
                        placeholder="Transaction Type"
                        value={(createForm.payment_details as any)?.transaction_type || ''}
                        onChange={(e) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            payment_details: {
                              ...(prev.payment_details as any),
                              transaction_type: e.target.value,
                            },
                          }))
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />

                      <input
                        type="datetime-local"
                        placeholder="Transaction Time"
                        value={(createForm.payment_details as any)?.transaction_time || ''}
                        onChange={(e) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            payment_details: {
                              ...(prev.payment_details as any),
                              transaction_time: e.target.value,
                            },
                          }))
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        required
                      />

                      <select
                        value={(createForm.payment_details as any)?.currency || 'USD'}
                        onChange={(e) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            payment_details: {
                              ...(prev.payment_details as any),
                              currency: e.target.value,
                            },
                          }))
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      >
                        <option value="USD">USD</option>

                        <option value="PKR">PKR</option>
                      </select>

                      <input
                        type="number"
                        step="0.01"
                        placeholder="Amount in Local Currency"
                        value={(createForm.payment_details as any)?.bank_amount_in_currency || ''}
                        onChange={(e) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            payment_details: {
                              ...(prev.payment_details as any),
                              bank_amount_in_currency: parseFloat(e.target.value) || 0,
                            },
                          }))
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        required
                      />

                      <input
                        type="number"
                        step="0.0001"
                        placeholder="Exchange Rate (optional)"
                        value={(createForm.payment_details as any)?.exchange_rate || ''}
                        onChange={(e) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            payment_details: {
                              ...(prev.payment_details as any),
                              exchange_rate: parseFloat(e.target.value) || undefined,
                            },
                          }))
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}

                {createForm.payment_method === 'Cash' && (
                  <div className="mb-4 p-4 border border-gray-200 rounded-lg">
                    <h5 className="font-medium text-gray-700 mb-3">Cash Payment Details</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Received By"
                        value={(createForm.payment_details as any)?.received_by || ''}
                        onChange={(e) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            payment_details: {
                              ...(prev.payment_details as any),
                              received_by: e.target.value,
                            },
                          }))
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        required
                      />

                      <input
                        type="text"
                        placeholder="Receipt Number (optional)"
                        value={(createForm.payment_details as any)?.receipt_number || ''}
                        onChange={(e) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            payment_details: {
                              ...(prev.payment_details as any),
                              receipt_number: e.target.value,
                            },
                          }))
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />

                      <div className="col-span-2">
                        <textarea
                          placeholder="Payment Notes (optional)"
                          value={(createForm.payment_details as any)?.notes || ''}
                          onChange={(e) =>
                            setCreateForm((prev) => ({
                              ...prev,
                              payment_details: {
                                ...(prev.payment_details as any),
                                notes: e.target.value,
                              },
                            }))
                          }
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (optional)
                  </label>
                  <textarea
                    value={createForm.notes || ''}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="Any additional notes about this order..."
                  />
                </div>
              </form>
            </div>

            {/* Modal Footer - Sticky */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center flex-shrink-0">
              <div className="text-sm text-gray-500">
                Items: {createForm.items.length} | Total: $
                {createForm.items.reduce((sum, item) => sum + item.total_price, 0).toFixed(2)}
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="create-order-form"
                  disabled={loading || createForm.items.length === 0}
                  className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-white/10 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white p-6 flex-shrink-0">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold">Edit Order</h3>
                  <p className="text-orange-100 text-sm mt-1">
                    Modify order #{editForm.id.slice(-8)}
                  </p>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-orange-100 hover:text-white p-2 rounded-lg hover:bg-orange-600/50 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <form id="edit-order-form" onSubmit={handleUpdateOrder}>
                {/* Customer Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer *</label>
                  <select
                    value={editForm.customer_id}
                    onChange={async (e) => {
                      const customerId = e.target.value;
                      setEditForm((prev) => ({
                        ...prev,
                        customer_id: customerId,
                      }));

                      // Automatically update item price when customer changes
                      if (customerId && newItem.platform_id && newItem.quantity > 0) {
                        // Calculate total quantity including existing items of this platform in the order
                        const existingQuantity = editForm.items
                          .filter((item) => item.platform_id === newItem.platform_id)
                          .reduce((total, item) => total + item.quantity, 0);

                        const totalQuantity = existingQuantity + newItem.quantity;

                        const price = getCustomerPrice(
                          customerId,
                          newItem.platform_id,
                          totalQuantity,
                        );
                        setNewItem((prev) => ({
                          ...prev,
                          unit_price: price,
                        }));
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Add Items Section */}
                <div className="mb-6">
                  <h4 className="text-md font-semibold text-gray-700 mb-3">Order Items</h4>

                  {/* Platform and Username Selection Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <select
                      value={newItem.platform_id}
                      onChange={(e) => {
                        const platformId = e.target.value;
                        setNewItem((prev) => ({
                          ...prev,
                          platform_id: platformId,
                          unit_price: 0, // Reset price, will be updated below
                          username: '', // Reset username when platform changes
                        }));

                        // Reset price editing state when platform changes
                        setIsPriceEditable(false);

                        // Automatically calculate price based on customer pricing
                        if (editForm.customer_id && platformId && newItem.quantity > 0) {
                          // Calculate total quantity including existing items of this platform in the order
                          const existingQuantity = editForm.items
                            .filter((item) => item.platform_id === platformId)
                            .reduce((total, item) => total + item.quantity, 0);

                          const totalQuantity = existingQuantity + newItem.quantity;

                          const price = getCustomerPrice(
                            editForm.customer_id,
                            platformId,
                            totalQuantity,
                          );
                          setNewItem((prev) => ({
                            ...prev,
                            unit_price: price,
                          }));
                        } else if (platformId) {
                          // Fallback to platform cost price if no customer selected
                          const platform = platforms.find((p) => p.id === platformId);
                          setNewItem((prev) => ({
                            ...prev,
                            unit_price: platform?.cost_price || 0,
                          }));
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="">Select Platform</option>
                      {platforms.map((platform) => (
                        <option key={platform.id} value={platform.id}>
                          {platform.platform} - {platform.account_type}
                        </option>
                      ))}
                    </select>

                    {/* Username Dropdown */}
                    <select
                      value={newItem.username}
                      onChange={(e) =>
                        setNewItem((prev) => ({
                          ...prev,
                          username: e.target.value,
                        }))
                      }
                      disabled={!editForm.customer_id || !newItem.platform_id}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">
                        {!editForm.customer_id
                          ? 'Select Customer First'
                          : !newItem.platform_id
                            ? 'Select Platform First'
                            : customerUsernames.length === 0
                              ? 'No usernames available (create some in Customer Panel)'
                              : getAvailableUsernames(editForm.customer_id, newItem.platform_id)
                                    .length === 0
                                ? 'No usernames for this customer+platform'
                                : 'Select Username'}
                      </option>
                      {editForm.customer_id &&
                        newItem.platform_id &&
                        getAvailableUsernames(editForm.customer_id, newItem.platform_id).map(
                          (username: any) => (
                            <option key={username.id} value={username.username}>
                              {username.username}
                            </option>
                          ),
                        )}
                    </select>
                  </div>

                  {/* Quantity, Price and Add Button Row */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                    <input
                      type="number"
                      placeholder="Quantity"
                      min="1"
                      value={newItem.quantity}
                      onChange={(e) => {
                        const quantity = parseInt(e.target.value) || 1;
                        setNewItem((prev) => {
                          const updatedItem = {
                            ...prev,
                            quantity: quantity,
                          };

                          // Automatically calculate price based on customer pricing
                          if (editForm.customer_id && prev.platform_id && quantity > 0) {
                            // Calculate total quantity including existing items of this platform in the order
                            const existingQuantity = editForm.items
                              .filter((item) => item.platform_id === prev.platform_id)
                              .reduce((total, item) => total + item.quantity, 0);

                            const totalQuantity = existingQuantity + quantity;

                            const price = getCustomerPrice(
                              editForm.customer_id,
                              prev.platform_id,
                              totalQuantity,
                            );
                            updatedItem.unit_price = price;
                            // Reset price editing state when price is auto-calculated
                            setIsPriceEditable(false);
                          }

                          return updatedItem;
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />

                    <div className="relative">
                      <input
                        type="number"
                        placeholder="Unit Price"
                        step="0.01"
                        min="0"
                        value={newItem.unit_price}
                        disabled={!isPriceEditable}
                        onChange={(e) =>
                          setNewItem((prev) => ({
                            ...prev,
                            unit_price: parseFloat(e.target.value) || 0,
                          }))
                        }
                        className={`w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                          !isPriceEditable
                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                            : 'bg-white'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setIsPriceEditable(!isPriceEditable)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-orange-500 transition-colors"
                        title={isPriceEditable ? 'Disable price editing' : 'Enable price editing'}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={addItemToEditOrder}
                      disabled={!newItem.platform_id}
                      className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed col-span-2 md:col-span-1"
                    >
                      Add Item
                    </button>
                  </div>

                  {/* Order Items List */}
                  {editForm.items.length > 0 && (
                    <div className="border border-gray-200 rounded-lg">
                      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                        <h5 className="font-medium text-gray-700">Current Order Items</h5>
                      </div>
                      <div className="p-4">
                        {editForm.items.map((item, index) => (
                          <div
                            key={`edit-item-${index}`}
                            className="py-2 border-b border-gray-100 last:border-b-0"
                          >
                            {editingItemIndex === index ? (
                              // Edit mode
                              <div className="space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {/* Platform Dropdown */}
                                  <select
                                    value={editingItemData?.platform_id || ''}
                                    onChange={(e) => {
                                      const platformId = e.target.value;
                                      const platform = platforms.find((p) => p.id === platformId);
                                      if (platform && editingItemData) {
                                        // Reset username when platform changes
                                        setEditingItemData({
                                          ...editingItemData,
                                          platform_id: platformId,
                                          unit_price: 0, // Reset price, will be updated below
                                          username: '',
                                        });

                                        // Automatically calculate price based on customer pricing
                                        if (editForm.customer_id && platformId && editingItemData.quantity > 0) {
                                          // Calculate total quantity including other items of this platform in the order
                                          const existingQuantity = editForm.items
                                            .filter((it, idx) => idx !== index && it.platform_id === platformId)
                                            .reduce((total, it) => total + it.quantity, 0);
                                          
                                          const totalQuantity = existingQuantity + editingItemData.quantity;
                                          
                                          const price = getCustomerPrice(
                                            editForm.customer_id,
                                            platformId,
                                            totalQuantity,
                                          );
                                          
                                          setEditingItemData((prev) => ({
                                            ...prev!,
                                            unit_price: price > 0 ? price : platform.cost_price || 0,
                                          }));
                                        } else if (platformId) {
                                          // Fallback to platform cost price if no customer selected
                                          setEditingItemData((prev) => ({
                                            ...prev!,
                                            unit_price: platform.cost_price || 0,
                                          }));
                                        }
                                      }
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                  >
                                    <option value="">Select Platform</option>
                                    {platforms.map((platform) => (
                                      <option key={platform.id} value={platform.id}>
                                        {platform.platform} - {platform.account_type}
                                      </option>
                                    ))}
                                  </select>

                                  {/* Username Dropdown */}
                                  <select
                                    value={editingItemData?.username || ''}
                                    onChange={(e) => {
                                      if (editingItemData) {
                                        setEditingItemData({
                                          ...editingItemData,
                                          username: e.target.value,
                                        });
                                      }
                                    }}
                                    disabled={!editForm.customer_id || !editingItemData?.platform_id}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                                  >
                                    <option value="">
                                      {!editForm.customer_id
                                        ? 'Select Customer First'
                                        : !editingItemData?.platform_id
                                          ? 'Select Platform First'
                                          : customerUsernames.length === 0
                                            ? 'No usernames available'
                                            : getAvailableUsernames(editForm.customer_id, editingItemData.platform_id)
                                                  .length === 0
                                              ? 'No usernames for this customer+platform'
                                              : 'Select Username'}
                                    </option>
                                    {editForm.customer_id &&
                                      editingItemData?.platform_id &&
                                      getAvailableUsernames(editForm.customer_id, editingItemData.platform_id).map(
                                        (username: any) => (
                                          <option key={username.id} value={username.username}>
                                            {username.username}
                                          </option>
                                        ),
                                      )}
                                  </select>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  {/* Quantity Input */}
                                  <input
                                    type="number"
                                    placeholder="Quantity"
                                    min="1"
                                    value={editingItemData?.quantity || 1}
                                    onChange={(e) => {
                                      const quantity = parseInt(e.target.value) || 1;
                                      if (editingItemData && editingItemData.platform_id) {
                                        // Automatically calculate price based on customer pricing
                                        if (editForm.customer_id && editingItemData.platform_id && quantity > 0) {
                                          // Calculate total quantity including other items of this platform in the order
                                          const existingQuantity = editForm.items
                                            .filter((it, idx) => idx !== index && it.platform_id === editingItemData.platform_id)
                                            .reduce((total, it) => total + it.quantity, 0);
                                          
                                          const totalQuantity = existingQuantity + quantity;
                                          
                                          const price = getCustomerPrice(
                                            editForm.customer_id,
                                            editingItemData.platform_id,
                                            totalQuantity,
                                          );
                                          
                                          // If customer pricing returns 0, fall back to platform cost price
                                          const finalPrice = price > 0 ? price : (() => {
                                            const platform = platforms.find((p) => p.id === editingItemData.platform_id);
                                            return platform?.cost_price || 0;
                                          })();
                                          
                                          setEditingItemData({
                                            ...editingItemData,
                                            quantity,
                                            unit_price: finalPrice,
                                          });
                                        } else {
                                          // Just update quantity without changing price if no customer
                                          setEditingItemData({
                                            ...editingItemData,
                                            quantity,
                                          });
                                        }
                                      }
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                  />

                                  {/* Unit Price Display (Read-only) */}
                                  <div className="flex items-center px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                                    <span className="text-sm text-gray-600 mr-2">Unit Price:</span>
                                    <span className="font-medium">
                                      ${(editingItemData?.unit_price || 0).toFixed(2)}
                                    </span>
                                  </div>

                                  {/* Total Price Display */}
                                  <div className="flex items-center px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                                    <span className="text-sm text-gray-600 mr-2">Total:</span>
                                    <span className="font-semibold">
                                      ${((editingItemData?.quantity || 0) * (editingItemData?.unit_price || 0)).toFixed(2)}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex justify-end space-x-2">
                                  <button
                                    type="button"
                                    onClick={() => saveEditedItem(index)}
                                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={cancelEditingItem}
                                    className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              // View mode
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{item.platform}</span>
                                    {item.username && (
                                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                        👤 {item.username}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-sm text-gray-600">
                                    {item.quantity} × ${(item.unitPrice || 0).toFixed(2)}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="font-semibold">
                                    ${(item.total_price || 0).toFixed(2)}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => startEditingItem(index)}
                                    className="text-blue-600 hover:bg-blue-100 p-1 rounded"
                                    title="Edit item"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => removeItemFromEditOrder(item.platform_id)}
                                    className="text-red-600 hover:bg-red-100 p-1 rounded"
                                    title="Remove item"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Order Totals */}
                {editForm.items.length > 0 && (
                  <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span>Subtotal:</span>
                      <span>${calculateEditTotals().subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span>Discount:</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max={calculateEditTotals().subtotal}
                        value={editForm.discount_amount}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            discount_amount: parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="w-24 px-2 py-1 border border-gray-300 rounded text-right"
                      />
                    </div>
                    <div className="flex justify-between items-center font-semibold text-lg border-t border-gray-200 pt-2">
                      <span>Total:</span>
                      <span>${calculateEditTotals().finalTotal.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {/* Payment Method */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method (optional)
                  </label>
                  <select
                    value={editForm.payment_method}
                    onChange={(e) => {
                      const paymentMethod = e.target.value as PaymentMethod;
                      if (paymentMethod === 'None') {
                        setEditForm((prev) => ({
                          ...prev,
                          payment_method: paymentMethod,
                          payment_details: null,
                        }));
                      } else {
                        let defaultPaymentDetails: PaymentDetails;

                        switch (paymentMethod) {
                          case 'Crypto':
                            defaultPaymentDetails = {
                              payment_method: 'Crypto',
                              id: '',
                              order_id: '',
                              amount: 0,
                              currency: 'USDT',
                              crypto_currency: 'USDT',
                              crypto_username: '',
                              crypto_wallet_address: '',
                              created_at: new Date().toISOString(),
                              updated_at: new Date().toISOString(),
                            } as CryptoPaymentDetails;
                            break;
                          case 'Bank Transfer':
                            defaultPaymentDetails = {
                              payment_method: 'Bank Transfer',
                              id: '',
                              order_id: '',
                              amount: 0,
                              currency: 'USD',
                              created_at: new Date().toISOString(),
                              updated_at: new Date().toISOString(),
                            } as BankTransferDetails;
                            break;
                          case 'Cash':
                          default:
                            defaultPaymentDetails = {
                              payment_method: 'Cash',
                              id: '',
                              order_id: '',
                              amount: 0,
                              currency: 'USD',
                              created_at: new Date().toISOString(),
                              updated_at: new Date().toISOString(),
                            } as CashPaymentDetails;
                            break;
                        }

                        setEditForm((prev) => ({
                          ...prev,
                          payment_method: paymentMethod,
                          payment_details: defaultPaymentDetails,
                        }));
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="None">None</option>
                    <option value="Cash">Cash</option>
                    <option value="Crypto">Crypto</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>

                {/* Payment Details Forms */}
                {editForm.payment_method === 'Crypto' && (
                  <div className="mb-4 p-4 border border-gray-200 rounded-lg">
                    <h5 className="font-medium text-gray-700 mb-3">Crypto Payment Details</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <select
                        value={
                          ((editForm.payment_details as any)?.crypto_currency ??
                            (editForm.payment_details as any)?.crypto_network) ||
                          'USDT'
                        }
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            payment_details: {
                              ...(prev.payment_details as any),
                              ...(['TRC20', 'BEP20'].includes(e.target.value)
                                ? {
                                    crypto_network: e.target.value,
                                    crypto_currency: undefined,
                                  }
                                : {
                                    crypto_currency: e.target.value,
                                    crypto_network: undefined,
                                  }),
                              crypto_username: '', // Reset username/wallet when changing type
                              crypto_wallet_address: '',
                            },
                          }))
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="USDT">USDT</option>
                        <option value="USDC">USDC</option>
                        <option value="BTC">BTC</option>
                        <option value="TRC20">TRC20</option>
                        <option value="BEP20">BEP20</option>
                      </select>

                      {['USDT', 'USDC'].includes(
                        (editForm.payment_details as any)?.crypto_currency || 'USDT',
                      ) ? (
                        <input
                          type="text"
                          placeholder="Username"
                          value={(editForm.payment_details as any)?.crypto_username || ''}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              payment_details: {
                                ...(prev.payment_details as any),
                                crypto_username: e.target.value,
                              },
                            }))
                          }
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          required
                        />
                      ) : (
                        <input
                          type="text"
                          placeholder="Wallet Address"
                          value={(editForm.payment_details as any)?.crypto_wallet_address || ''}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              payment_details: {
                                ...(prev.payment_details as any),
                                crypto_wallet_address: e.target.value,
                              },
                            }))
                          }
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          required
                        />
                      )}
                    </div>
                  </div>
                )}

                {editForm.payment_method === 'Bank Transfer' && (
                  <div className="mb-4 p-4 border border-gray-200 rounded-lg">
                    <h5 className="font-medium text-gray-700 mb-3">Bank Transfer Details</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Reference Number"
                        value={(editForm.payment_details as any)?.bank_transaction_reference || ''}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            payment_details: {
                              ...(prev.payment_details as any),
                              bank_transaction_reference: e.target.value,
                            },
                          }))
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        required
                      />

                      <input
                        type="text"
                        placeholder="Sender Name"
                        value={(editForm.payment_details as any)?.sender_name || ''}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            payment_details: {
                              ...(prev.payment_details as any),
                              sender_name: e.target.value,
                            },
                          }))
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        required
                      />

                      <input
                        type="text"
                        placeholder="Sender Institution"
                        value={(editForm.payment_details as any)?.sender_bank || ''}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            payment_details: {
                              ...(prev.payment_details as any),
                              sender_bank: e.target.value,
                            },
                          }))
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />

                      <input
                        type="text"
                        placeholder="Purpose"
                        value={(editForm.payment_details as any)?.purpose || ''}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            payment_details: {
                              ...(prev.payment_details as any),
                              purpose: e.target.value,
                            },
                          }))
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />

                      <input
                        type="text"
                        placeholder="Transaction Type"
                        value={(editForm.payment_details as any)?.transaction_type || ''}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            payment_details: {
                              ...(prev.payment_details as any),
                              transaction_type: e.target.value,
                            },
                          }))
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />

                      <input
                        type="datetime-local"
                        placeholder="Transaction Time"
                        value={(editForm.payment_details as any)?.transaction_time || ''}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            payment_details: {
                              ...(prev.payment_details as any),
                              transaction_time: e.target.value,
                            },
                          }))
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        required
                      />

                      <select
                        value={(editForm.payment_details as any)?.currency || 'USD'}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            payment_details: {
                              ...(prev.payment_details as any),
                              currency: e.target.value,
                            },
                          }))
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="USD">USD</option>
                        <option value="PKR">PKR</option>
                      </select>

                      <input
                        type="number"
                        step="0.01"
                        placeholder="Amount in Local Currency"
                        value={(editForm.payment_details as any)?.bank_amount_in_currency || ''}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            payment_details: {
                              ...(prev.payment_details as any),
                              bank_amount_in_currency: parseFloat(e.target.value) || 0,
                            },
                          }))
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        required
                      />

                      <input
                        type="number"
                        step="0.0001"
                        placeholder="Exchange Rate (optional)"
                        value={(editForm.payment_details as any)?.exchange_rate || ''}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            payment_details: {
                              ...(prev.payment_details as any),
                              exchange_rate: parseFloat(e.target.value) || undefined,
                            },
                          }))
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}

                {editForm.payment_method === 'Cash' && (
                  <div className="mb-4 p-4 border border-gray-200 rounded-lg">
                    <h5 className="font-medium text-gray-700 mb-3">Cash Payment Details</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Received By"
                        value={(editForm.payment_details as any)?.received_by || ''}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            payment_details: {
                              ...(prev.payment_details as any),
                              received_by: e.target.value,
                            },
                          }))
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        required
                      />

                      <input
                        type="text"
                        placeholder="Receipt Number (optional)"
                        value={(editForm.payment_details as any)?.receipt_number || ''}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            payment_details: {
                              ...(prev.payment_details as any),
                              receipt_number: e.target.value,
                            },
                          }))
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />

                      <div className="col-span-2">
                        <textarea
                          placeholder="Payment Notes (optional)"
                          value={(editForm.payment_details as any)?.notes || ''}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              payment_details: {
                                ...(prev.payment_details as any),
                                notes: e.target.value,
                              },
                            }))
                          }
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (optional)
                  </label>
                  <textarea
                    value={editForm.notes || ''}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Any additional notes about this order..."
                  />
                </div>
              </form>
            </div>

            {/* Modal Footer - Sticky */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center flex-shrink-0">
              <div className="text-sm text-gray-500">
                Items: {editForm.items.length} | Total: $
                {editForm.items.reduce((sum, item) => sum + item.total_price, 0).toFixed(2)}
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="edit-order-form"
                  disabled={loading || editForm.items.length === 0}
                  className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Updating...' : 'Update Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Order Modal */}
      {showViewModal && selectedOrder && (
        <div className="fixed inset-0 bg-white/10 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-pink-600 to-pink-700 text-white p-6 flex-shrink-0">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold">Order Details</h3>
                  <p className="text-pink-100 text-sm mt-1">
                    Order #{selectedOrder.id.slice(-8)} •{' '}
                    {selectedOrder.created_at
                      ? new Date(selectedOrder.created_at).toLocaleString()
                      : 'N/A'}
                  </p>
                </div>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-pink-100 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Order Summary */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Order Status & Customer Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Order Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                          Customer
                        </label>
                        <p className="text-gray-900 font-medium">
                          {getCustomerName(selectedOrder.customer_id)}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                          Status
                        </label>
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                            selectedOrder.status,
                          )}`}
                        >
                          {selectedOrder.status}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                          Payment Method
                        </label>
                        <div className="flex items-center">
                          {selectedOrder.payment_method === 'Crypto' && (
                            <svg
                              className="w-4 h-4 mr-2 text-orange-500"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M10 2L3 7v6c0 5.5 3.8 7.4 7 7.4s7-1.9 7-7.4V7l-7-5z" />
                            </svg>
                          )}
                          {selectedOrder.payment_method === 'Bank Transfer' && (
                            <svg
                              className="w-4 h-4 mr-2 text-blue-500"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 114 0 2 2 0 01-4 0zm8 0a2 2 0 114 0 2 2 0 01-4 0z" />
                            </svg>
                          )}
                          {selectedOrder.payment_method === 'Cash' && (
                            <svg
                              className="w-4 h-4 mr-2 text-green-500"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4z" />
                              <path d="M6 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2V6z" />
                            </svg>
                          )}
                          <span className="text-gray-900">{selectedOrder.payment_method}</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                          Created By
                        </label>
                        <p className="text-gray-900 font-medium">
                          {selectedOrder.created_by_username || 'System'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                          Created Date
                        </label>
                        <p className="text-gray-900">
                          {selectedOrder.created_at
                            ? new Date(selectedOrder.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <h4 className="text-lg font-semibold text-gray-800 flex items-center">
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                          />
                        </svg>
                        Order Items ({selectedOrder.items.length})
                      </h4>
                    </div>
                    <div className="divide-y divide-gray-200">
                      {selectedOrder.items.map((item, index) => (
                        <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center mb-2">
                                <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center text-white font-bold text-sm mr-3">
                                  {item.platform.charAt(0)}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h5 className="font-semibold text-gray-900">{item.platform}</h5>
                                    {item.username && (
                                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                        👤 {item.username}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600">
                                    {item.account_type || 'Standard'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center text-sm text-gray-600 ml-13">
                                <span className="bg-gray-100 px-2 py-1 rounded mr-2">
                                  Qty: {item.quantity}
                                </span>
                                <span className="bg-gray-100 px-2 py-1 rounded">
                                  ${item.unitPrice.toFixed(2)} each
                                </span>
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <p className="text-lg font-bold text-gray-900">
                                ${item.total_price.toFixed(2)}
                              </p>
                              <p className="text-sm text-gray-500">Total</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Notes Section */}
                  {selectedOrder.notes && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                        <svg
                          className="w-5 h-5 mr-2 text-yellow-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        Order Notes
                      </h4>
                      <p className="text-gray-700">{selectedOrder.notes}</p>
                    </div>
                  )}
                </div>

                {/* Right Column - Payment & Summary */}
                <div className="space-y-6">
                  {/* Order Total */}
                  <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <svg
                        className="w-5 h-5 mr-2 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                        />
                      </svg>
                      Order Summary
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-gray-600">
                        <span>Subtotal:</span>
                        <span>${selectedOrder.total_amount.toFixed(2)}</span>
                      </div>
                      {selectedOrder.discount_amount > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span>Discount:</span>
                          <span>-${selectedOrder.discount_amount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="border-t border-green-200 pt-2 mt-2">
                        <div className="flex justify-between text-lg font-bold text-gray-900">
                          <span>Total Amount:</span>
                          <span>${selectedOrder.final_amount.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Details */}
                  {(() => {
                    const orderPaymentDetails = getOrderPaymentDetails(selectedOrder.id);
                    return (
                      orderPaymentDetails && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                            <svg
                              className="w-5 h-5 mr-2 text-blue-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                              />
                            </svg>
                            Payment Details
                          </h4>
                          <div className="space-y-3">
                            {/* Basic Payment Info */}
                            <div className="bg-white rounded-md p-3 border border-blue-100">
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <span className="font-medium text-gray-600">Amount:</span>
                                  <p className="text-gray-900 font-semibold">
                                    ${orderPaymentDetails.amount}
                                  </p>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-600">Currency:</span>
                                  <p className="text-gray-900">{orderPaymentDetails.currency}</p>
                                </div>
                              </div>
                              {orderPaymentDetails.transaction_id && (
                                <div className="mt-2">
                                  <span className="font-medium text-gray-600 text-sm">
                                    Transaction ID:
                                  </span>
                                  <p className="text-gray-900 font-mono text-sm break-all">
                                    {orderPaymentDetails.transaction_id}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Method-specific details */}
                            {selectedOrder.payment_method === 'Crypto' && (
                              <div className="bg-white rounded-md p-3 border border-blue-100">
                                <h5 className="font-semibold text-gray-800 mb-2 flex items-center">
                                  <svg
                                    className="w-4 h-4 mr-1 text-orange-500"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M10 2L3 7v6c0 5.5 3.8 7.4 7 7.4s7-1.9 7-7.4V7l-7-5z" />
                                  </svg>
                                  Crypto Payment
                                </h5>
                                <div className="space-y-2 text-sm">
                                  {orderPaymentDetails.crypto_currency && (
                                    <div>
                                      <span className="font-medium text-gray-600">Type:</span>
                                      <span className="ml-2 bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-medium">
                                        {orderPaymentDetails.crypto_currency}
                                      </span>
                                    </div>
                                  )}
                                  {orderPaymentDetails.crypto_username && (
                                    <div>
                                      <span className="font-medium text-gray-600">Username:</span>
                                      <p className="text-gray-900">
                                        {orderPaymentDetails.crypto_username}
                                      </p>
                                    </div>
                                  )}
                                  {orderPaymentDetails.crypto_wallet_address && (
                                    <div>
                                      <span className="font-medium text-gray-600">
                                        Wallet Address:
                                      </span>
                                      <p className="text-gray-900 font-mono text-xs break-all bg-gray-50 p-2 rounded mt-1">
                                        {orderPaymentDetails.crypto_wallet_address}
                                      </p>
                                    </div>
                                  )}
                                  {orderPaymentDetails.crypto_transaction_hash && (
                                    <div>
                                      <span className="font-medium text-gray-600">
                                        Transaction Hash:
                                      </span>
                                      <p className="text-gray-900 font-mono text-xs break-all bg-gray-50 p-2 rounded mt-1">
                                        {orderPaymentDetails.crypto_transaction_hash}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {selectedOrder.payment_method === 'Bank Transfer' && (
                              <div className="bg-white rounded-md p-3 border border-blue-100">
                                <h5 className="font-semibold text-gray-800 mb-2 flex items-center">
                                  <svg
                                    className="w-4 h-4 mr-1 text-blue-500"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 114 0 2 2 0 01-4 0zm8 0a2 2 0 114 0 2 2 0 01-4 0z" />
                                  </svg>
                                  Bank Transfer
                                </h5>
                                <div className="space-y-2 text-sm">
                                  {orderPaymentDetails.bank_transaction_reference && (
                                    <div>
                                      <span className="font-medium text-gray-600">
                                        Reference Number:
                                      </span>
                                      <p className="text-gray-900 font-mono">
                                        {orderPaymentDetails.bank_transaction_reference}
                                      </p>
                                    </div>
                                  )}
                                  {orderPaymentDetails.bank_sender_name && (
                                    <div>
                                      <span className="font-medium text-gray-600">Sender:</span>
                                      <p className="text-gray-900">
                                        {orderPaymentDetails.bank_sender_name}
                                      </p>
                                    </div>
                                  )}
                                  {orderPaymentDetails.bank_sender_bank && (
                                    <div>
                                      <span className="font-medium text-gray-600">
                                        Institution:
                                      </span>
                                      <p className="text-gray-900">
                                        {orderPaymentDetails.bank_sender_bank}
                                      </p>
                                    </div>
                                  )}
                                  {orderPaymentDetails.bank_purpose && (
                                    <div>
                                      <span className="font-medium text-gray-600">Purpose:</span>
                                      <p className="text-gray-900">
                                        {orderPaymentDetails.bank_purpose}
                                      </p>
                                    </div>
                                  )}
                                  {orderPaymentDetails.bank_transaction_type && (
                                    <div>
                                      <span className="font-medium text-gray-600">
                                        Transaction Type:
                                      </span>
                                      <p className="text-gray-900">
                                        {orderPaymentDetails.bank_transaction_type}
                                      </p>
                                    </div>
                                  )}
                                  {orderPaymentDetails.bank_transaction_time && (
                                    <div>
                                      <span className="font-medium text-gray-600">
                                        Transaction Time:
                                      </span>
                                      <p className="text-gray-900">
                                        {new Date(
                                          orderPaymentDetails.bank_transaction_time,
                                        ).toLocaleString()}
                                      </p>
                                    </div>
                                  )}
                                  {orderPaymentDetails.bank_amount_in_currency && (
                                    <div className="bg-gray-50 p-2 rounded">
                                      <span className="font-medium text-gray-600">
                                        Local Amount:
                                      </span>
                                      <p className="text-gray-900 font-semibold">
                                        {orderPaymentDetails.bank_amount_in_currency}{' '}
                                        {orderPaymentDetails.currency}
                                      </p>
                                      {orderPaymentDetails.bank_exchange_rate && (
                                        <p className="text-xs text-gray-500">
                                          Rate: {orderPaymentDetails.bank_exchange_rate}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {selectedOrder.payment_method === 'Cash' && (
                              <div className="bg-white rounded-md p-3 border border-blue-100">
                                <h5 className="font-semibold text-gray-800 mb-2 flex items-center">
                                  <svg
                                    className="w-4 h-4 mr-1 text-green-500"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4z" />
                                    <path d="M6 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2V6z" />
                                  </svg>
                                  Cash Payment
                                </h5>
                                <div className="space-y-2 text-sm">
                                  {orderPaymentDetails.cash_received_by && (
                                    <div>
                                      <span className="font-medium text-gray-600">
                                        Received By:
                                      </span>
                                      <p className="text-gray-900">
                                        {orderPaymentDetails.cash_received_by}
                                      </p>
                                    </div>
                                  )}
                                  {orderPaymentDetails.cash_receipt_number && (
                                    <div>
                                      <span className="font-medium text-gray-600">Receipt #:</span>
                                      <p className="text-gray-900 font-mono">
                                        {orderPaymentDetails.cash_receipt_number}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Additional Notes */}
                            {orderPaymentDetails.notes && (
                              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                                <span className="font-medium text-gray-600 text-sm">
                                  Payment Notes:
                                </span>
                                <p className="text-gray-700 text-sm mt-1">
                                  {orderPaymentDetails.notes}
                                </p>
                              </div>
                            )}

                            {/* Timestamp */}
                            {orderPaymentDetails.created_at && (
                              <div className="text-xs text-gray-500 pt-2 border-t border-blue-100">
                                <span className="font-medium">Recorded:</span>{' '}
                                {new Date(orderPaymentDetails.created_at).toLocaleString()}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Modal Footer - Sticky */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center flex-shrink-0">
              <div className="text-sm text-gray-500">
                Last updated:{' '}
                {selectedOrder.created_at
                  ? new Date(selectedOrder.created_at).toLocaleString()
                  : 'N/A'}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                {selectedOrder?.status === 'pending' && (
                  <button
                    onClick={() => {
                      updateOrderStatus(selectedOrder.id, 'verified');
                      setShowViewModal(false);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Verify Order
                  </button>
                )}
                {(selectedOrder?.status === 'verified' ||
                  selectedOrder?.status === 'completed') && (
                  <>
                    <button
                      onClick={() => setShowRefundModal(true)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                        />
                      </svg>
                      Process Refund
                    </button>
                    <button
                      onClick={() => setShowReplacementModal(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                        />
                      </svg>
                      Process Replacement
                    </button>
                  </>
                )}
                {selectedOrder.invoice_url && (
                  <button
                    onClick={() => window.open(selectedOrder.invoice_url!, '_blank')}
                    className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors flex items-center"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    View Invoice
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoiceModal && selectedOrder && (
        <div className="fixed inset-0 bg-white/10 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-pink-600 to-pink-700 text-white p-6 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">Invoice</h3>
                <p className="text-pink-100 text-sm mt-1">Order #{selectedOrder.id.slice(-8)}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleCopyInvoice()}
                  disabled={invoiceLoading}
                  className="bg-pink-500 hover:bg-pink-600 text-white px-3 py-1 rounded text-sm transition-colors flex items-center disabled:opacity-50"
                  title="Copy Invoice to Clipboard"
                >
                  <Copy className="w-4 h-4 mr-1" />
                  {invoiceLoading ? 'Copying...' : 'Copy'}
                </button>
                <button
                  onClick={() => handleDownloadInvoice(selectedOrder)}
                  disabled={invoiceLoading}
                  className="bg-pink-500 hover:bg-pink-600 text-white px-3 py-1 rounded text-sm transition-colors flex items-center disabled:opacity-50"
                  title="Download Invoice"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </button>
                <button
                  onClick={() => setShowInvoiceModal(false)}
                  className="text-pink-100 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div ref={invoiceRef}>
                <Invoice
                  order={selectedOrder}
                  customer={customers.find((c) => c.id === selectedOrder.customer_id) || null}
                  platforms={platforms}
                  paymentDetails={getOrderPaymentDetails(selectedOrder.id)}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/10 backdrop-blur-sm">
          <div className="bg-white rounded-lg w-full max-w-lg shadow-2xl">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Process Refund</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Refund Reason *
                  </label>
                  <textarea
                    value={refundForm.reason}
                    onChange={(e) =>
                      setRefundForm((prev) => ({
                        ...prev,
                        reason: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    rows={3}
                    placeholder="Enter refund reason..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    value={refundForm.notes}
                    onChange={(e) =>
                      setRefundForm((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    rows={2}
                    placeholder="Optional notes..."
                  />
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> This will restore all order items to inventory and set
                    the order amount to $0. The order will be marked as refunded.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
              <button
                onClick={() => setShowRefundModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRefund}
                disabled={!refundForm.reason || loading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Process Refund'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Replacement Modal */}
      {showReplacementModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/10 backdrop-blur-sm">
          <div className="bg-white rounded-lg w-full max-w-lg shadow-2xl">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Process Replacement</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Replacement Reason *
                  </label>
                  <textarea
                    value={replacementForm.reason}
                    onChange={(e) =>
                      setReplacementForm((prev) => ({
                        ...prev,
                        reason: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    rows={3}
                    placeholder="Enter replacement reason..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    value={replacementForm.notes}
                    onChange={(e) =>
                      setReplacementForm((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    rows={2}
                    placeholder="Optional notes..."
                  />
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Processing a replacement will mark this order as
                    "Replacement" status. You can create a new order for the replacement items
                    separately.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
              <button
                onClick={() => setShowReplacementModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReplacement}
                disabled={!replacementForm.reason || loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Process Replacement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderPanel;
