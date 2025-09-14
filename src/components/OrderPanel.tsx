import React, { useEffect, useState, useRef } from "react";
import {
  Plus,
  Edit,
  Eye,
  FileText,
  Trash2,
  Filter,
  Copy,
  Download,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAppSelector } from "../hooks/redux";
import Invoice from "./Invoice";
import {
  copyInvoiceToClipboard,
  downloadInvoiceImage,
} from "../utils/invoiceUtils";
import type {
  Order,
  OrderItem,
  PaymentDetails,
  CryptoPaymentDetails,
  BankTransferDetails,
  CashPaymentDetails,
  PaymentMethod,
} from "../types/order";
import type { Customer } from "../types/customer";
import type { Platform } from "../types/platform";

const OrderPanel: React.FC = () => {
  // Get current user from Redux store
  const { user } = useAppSelector((state) => state.auth);

  // Core state
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [customerPricing, setCustomerPricing] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [paymentDetails, setPaymentDetails] = useState<any[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Invoice state
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  // Filter and search state
  const [statusFilter, setStatusFilter] = useState<Order["status"] | "all">(
    "all"
  );
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<
    PaymentMethod | "all"
  >("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  // Refund and replacement state
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showReplacementModal, setShowReplacementModal] = useState(false);
  const [refundForm, setRefundForm] = useState({
    reason: "",
    notes: "",
  });
  const [replacementForm, setReplacementForm] = useState({
    reason: "",
    notes: "",
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Create order form state
  const [createForm, setCreateForm] = useState<{
    customer_id: string;
    items: OrderItem[];
    payment_method: PaymentMethod;
    payment_details: PaymentDetails;
    discount_amount?: number;
    notes?: string;
  }>({
    customer_id: "",
    items: [],
    payment_method: "Cash",
    payment_details: { type: "Cash", received_by: "" } as any,
    discount_amount: 0,
    notes: "",
  });

  // Order item being added
  const [newItem, setNewItem] = useState({
    platform_id: "",
    quantity: 1,
    unit_price: 0,
  });

  // Price editing state
  const [isPriceEditable, setIsPriceEditable] = useState(false);

  // Function to get customer pricing for a specific platform and quantity
  const getCustomerPrice = (
    customerId: string,
    platformId: string,
    quantity: number
  ): number => {
    // Find pricing from the separate customer_pricing table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pricing = customerPricing.find(
      (p: any) => p.customer_id === customerId && p.platform_id === platformId
    );

    if (!pricing) {
      return 0;
    }

    // Check if quantity falls within the range
    const minQty = pricing.min_quantity;
    const maxQty = pricing.max_quantity;

    if (quantity >= minQty && (maxQty === null || quantity <= maxQty)) {
      return pricing.unit_price;
    }

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
      ] = await Promise.all([
        supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).from("order_items").select("*"),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).from("payment_details").select("*"),
        supabase.from("customers").select("*").order("name"),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).from("customer_pricing").select("*"),
        supabase.from("game_coins").select("*").order("platform"),
      ]);

      if (ordersRes.error)
        throw new Error("Failed to fetch orders: " + ordersRes.error.message);
      if (orderItemsRes.error)
        throw new Error(
          "Failed to fetch order items: " + orderItemsRes.error.message
        );
      if (paymentDetailsRes.error)
        throw new Error(
          "Failed to fetch payment details: " + paymentDetailsRes.error.message
        );
      if (customersRes.error)
        throw new Error(
          "Failed to fetch customers: " + customersRes.error.message
        );
      if (customerPricingRes.error)
        throw new Error(
          "Failed to fetch customer pricing: " +
            customerPricingRes.error.message
        );
      if (platformsRes.error)
        throw new Error(
          "Failed to fetch platforms: " + platformsRes.error.message
        );

      // First transform platforms so we can use them in order transformation
      const transformedPlatforms: Platform[] = (platformsRes.data || []).map(
        (platform: Record<string, unknown>) => ({
          id: String(platform.id || ""),
          platform: String(
            platform.platform_name || platform.platform || ""
          ),
          account_type:
            (platform.account_type as Platform["account_type"]) || "Standard",
          category: String(platform.category || ""),
          inventory: Number(platform.inventory || 0),
          cost_price: Number(platform.cost_price || 0),
          created_at: String(platform.created_at || new Date().toISOString()),
          updated_at: String(
            platform.updated_at ||
              platform.created_at ||
              new Date().toISOString()
          ),
        })
      );

      // Transform raw data to match our types
      const transformedOrders: Order[] = (ordersRes.data || []).map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (order: any) => {
          // Find all items for this order
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const orderItems = (orderItemsRes.data || []).filter(
            (item: any) => item.order_id === order.id
          );

          // Map order items to the expected format
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const items = orderItems.map((item: any) => {
            const platform = transformedPlatforms.find(
              (p) => p.id === item.platform_id
            );
            return {
              order_id: String(item.order_id || order.id || ""),
              platform_id: String(item.platform_id || ""),
              platform: platform?.platform || "Unknown Platform",
              quantity: Number(item.quantity || 0),
              unitPrice: Number(item.unitPrice || 0),
              total_price: Number(item.total_price || 0),
            };
          });

          return {
            id: String(order.id || ""),
            customer_id: String(order.customer_id || ""),
            order_number: String(order.order_number || order.id || ""),
            created_at: String(order.created_at || new Date().toISOString()),
            updated_at: String(order.updated_at || order.created_at || new Date().toISOString()),
            created_by: String(order.created_by || ""),
            items: items,
            payment_method: (order.payment_method as PaymentMethod) || "Cash",
            payment_status: (order.payment_status as any) || "pending",
            payment_details: (order.payment_details as PaymentDetails) || {
              type: "Cash",
            },
            total_amount: Number(order.total_amount || 0),
            discount_amount: Number(order.discount_amount || 0),
            final_amount: Number(order.final_amount || order.total_amount || 0),
            status: (order.status as Order["status"]) || "pending",
            invoice_url: order.invoice_url ? String(order.invoice_url) : null,
            verified_at: order.verified_at ? String(order.verified_at) : null,
            verified_by: order.verified_by ? String(order.verified_by) : null,
            notes: order.notes ? String(order.notes) : null,
          };
        }
      );

      const transformedCustomers: Customer[] = (customersRes.data || []).map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (customer: any) => ({
          id: String(customer.id || ""),
          name: String(customer.name || ""),
          contact_numbers:
            customer.contact_numbers ||
            (customer.contact_info
              ? typeof customer.contact_info === "string"
                ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  JSON.parse(customer.contact_info).map(
                    (info: any) => info.number || info.phone
                  )
                : // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  customer.contact_info.map(
                    (info: any) => info.number || info.phone
                  )
              : null),
          created_at: customer.created_at ? String(customer.created_at) : null,
          updated_at: customer.updated_at ? String(customer.updated_at) : null,
        })
      );

      setOrders(transformedOrders);
      setCustomers(transformedCustomers);
      setCustomerPricing(customerPricingRes.data || []);
      setPaymentDetails(paymentDetailsRes.data || []);
      setPlatforms(transformedPlatforms);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter orders based on filters
  const filteredOrders = orders.filter((order) => {
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;
    const matchesPayment =
      paymentMethodFilter === "all" ||
      order.payment_method === paymentMethodFilter;

    let matchesDate = true;
    if ((dateRange.start || dateRange.end) && order.created_at) {
      const orderDate = new Date(order.created_at);
      
      if (dateRange.start && dateRange.end) {
        // Both start and end dates provided
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        // Set end date to end of day for inclusive filtering
        endDate.setHours(23, 59, 59, 999);
        matchesDate = orderDate >= startDate && orderDate <= endDate;
      } else if (dateRange.start) {
        // Only start date provided
        const startDate = new Date(dateRange.start);
        matchesDate = orderDate >= startDate;
      } else if (dateRange.end) {
        // Only end date provided
        const endDate = new Date(dateRange.end);
        // Set end date to end of day for inclusive filtering
        endDate.setHours(23, 59, 59, 999);
        matchesDate = orderDate <= endDate;
      }
    }

    return matchesStatus && matchesPayment && matchesDate;
  });

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Helper functions
  const getCustomerName = (customerId: string | null) => {
    if (!customerId) return "Unknown Customer";
    const customer = customers.find((c) => c.id === customerId);
    return customer?.name || "Unknown Customer";
  };

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "processing":
        return "text-blue-600 bg-blue-100";
      case "verified":
        return "text-green-600 bg-green-100";
      case "completed":
        return "text-emerald-600 bg-emerald-100";
      case "replacement":
        return "text-pink-600 bg-pink-100";
      case "refunded":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  // Helper function to get payment details for an order
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getOrderPaymentDetails = (orderId: string): any => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        `Error: Requested quantity (${newItem.quantity}) exceeds available inventory (${platform.inventory}) for ${platform.platform}.`
      );
      return;
    }

    // Check if this platform is already in the order
    const existingItem = createForm.items.find(
      (item) => item.platform_id === newItem.platform_id
    );
    const totalRequestedQuantity =
      (existingItem?.quantity || 0) + newItem.quantity;

    if (totalRequestedQuantity > platform.inventory) {
      alert(
        `Error: Total requested quantity (${totalRequestedQuantity}) exceeds available inventory (${platform.inventory}) for ${platform.platform}.`
      );
      return;
    }

    const orderItem: OrderItem = {
      order_id: "", // Will be set when order is created
      platform_id: newItem.platform_id,
      platform: platform.platform,
      quantity: newItem.quantity,
      unitPrice: Number(newItem.unit_price) || platform.cost_price || 0,
      total_price:
        newItem.quantity * (Number(newItem.unit_price) || platform.cost_price || 0),
    };

    setCreateForm((prev) => ({
      ...prev,
      items: [...prev.items, orderItem],
    }));

    // Reset new item form
    setNewItem({
      platform_id: "",
      quantity: 1,
      unit_price: 0,
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

  // Calculate order totals
  const calculateTotals = () => {
    const subtotal = createForm.items.reduce(
      (sum, item) => sum + item.total_price,
      0
    );
    const finalTotal = subtotal - (createForm.discount_amount || 0);
    return { subtotal, finalTotal };
  };

  // Create new order
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (createForm.items.length === 0) {
      setError("Please add at least one item to the order");
      return;
    }

    setLoading(true);
    try {
      const { finalTotal } = calculateTotals();

      // Generate a unique order number
      const orderNumber = `ORD-${Date.now()}`;

      // Check if current user is Admin to auto-verify orders
      const isAdminUser = user?.role === "Admin" || user?.role === "SuperAdmin";
      const orderStatus = isAdminUser ? "verified" : "pending";

      const orderData = {
        customer_id: createForm.customer_id,
        order_number: orderNumber,
        payment_method: createForm.payment_method,
        payment_status: "pending" as const,
        total_amount: finalTotal,
        status: orderStatus as Order["status"],
        notes: createForm.notes,
        // Set verification details if auto-verified
        ...(isAdminUser &&
          user && {
            verified_at: new Date().toISOString(),
            verified_by: user.id,
          }),
      };

      // First create the order
      const { data: orderResult, error: orderError } = await supabase
        .from("orders")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      }));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: itemsError } = await (supabase as any)
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Save payment details if they exist
      if (createForm.payment_details) {
        const { finalTotal } = calculateTotals();

        // Base payment details data
        const paymentDetailsData = {
          order_id: orderResult.id,
          payment_method: createForm.payment_method,
          amount: finalTotal,
          currency: "USD",
          payment_data: createForm.payment_details,
        };

        // Add specific fields based on payment method
        if (createForm.payment_method === "Crypto") {
          const cryptoDetails =
            createForm.payment_details as CryptoPaymentDetails;
          Object.assign(paymentDetailsData, {
            crypto_currency: cryptoDetails.currency,
            crypto_network: (cryptoDetails as any).network,
            crypto_username: (cryptoDetails as any).username,
            crypto_pay_id: (cryptoDetails as any).pay_id,
            crypto_wallet_address: (cryptoDetails as any).wallet_address,
            crypto_transaction_hash: cryptoDetails.transaction_id,
          });
        } else if (createForm.payment_method === "Bank Transfer") {
          const bankDetails = createForm.payment_details as BankTransferDetails;
          Object.assign(paymentDetailsData, {
            bank_transaction_reference: bankDetails.bank_transaction_reference,
            bank_sender_name: (bankDetails as any).sender_name,
            bank_sender_bank: (bankDetails as any).sender_bank,
            bank_transaction_time: (bankDetails as any).transaction_time
              ? new Date((bankDetails as any).transaction_time).toISOString()
              : null,
            bank_exchange_rate: (bankDetails as any).exchange_rate,
            bank_amount_in_currency: bankDetails.bank_amount_in_currency,
            currency: bankDetails.currency || "USD",
          });
        } else if (createForm.payment_method === "Cash") {
          const cashDetails = createForm.payment_details as CashPaymentDetails;
          Object.assign(paymentDetailsData, {
            cash_received_by: (cashDetails as any).received_by,
            cash_receipt_number: (cashDetails as any).receipt_number,
            notes: cashDetails.notes,
          });
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: paymentError } = await (supabase as any)
          .from("payment_details")
          .insert([paymentDetailsData]);

        if (paymentError) throw paymentError;
      }

      // Deduct inventory for each item in the order
      for (const item of createForm.items) {
        // First, get the current inventory
        const { data: currentPlatform, error: fetchError } = await supabase
          .from("game_coins")
          .select("inventory")
          .eq("id", item.platform_id)
          .single();

        if (fetchError) throw fetchError;

        // Calculate new inventory
        const newInventory = (currentPlatform?.inventory || 0) - item.quantity;

        // Update inventory
        const { error: inventoryError } = await supabase
          .from("game_coins")
          .update({ inventory: newInventory })
          .eq("id", item.platform_id);

        if (inventoryError) throw inventoryError;
      }

      // Reset form
      setCreateForm({
        customer_id: "",
        items: [],
        payment_method: "Cash",
        payment_details: { type: "Cash", received_by: "" } as any,
        discount_amount: 0,
        notes: "",
      });
      setShowCreateModal(false);

      // Show success message with auto-verification status
      const successMessage = isAdminUser
        ? "Order created and automatically verified (Admin privilege)"
        : "Order created successfully";
      alert(successMessage);

      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create order");
    } finally {
      setLoading(false);
    }
  };

  // Update order status
  const updateOrderStatus = async (
    orderId: string,
    newStatus: Order["status"]
  ) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("orders")
        .update({
          status: newStatus,
          verified_at:
            newStatus === "verified"
              ? new Date().toISOString()
              : null,
          verified_by:
            newStatus === "verified"
              ? user?.id || "admin"
              : null,
        })
        .eq("id", orderId);

      if (error) throw error;
      fetchData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update order status"
      );
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
      const { data: orderItems, error: itemsError } = await (supabase as any)
        .from("order_items")
        .select("platform_id, quantity")
        .eq("order_id", selectedOrder.id);

      if (itemsError) throw itemsError;

      // Restore inventory for each platform
      if (orderItems && orderItems.length > 0) {
        for (const item of orderItems) {
          // First get current inventory
          const { data: currentPlatform, error: getCurrentError } =
            await supabase
              .from("game_coins")
              .select("inventory")
              .eq("id", item.platform_id)
              .single();

          if (getCurrentError) throw getCurrentError;

          // Update with new inventory value
          const newInventory =
            (currentPlatform?.inventory || 0) + item.quantity;
          const { error: inventoryError } = await supabase
            .from("game_coins")
            .update({
              inventory: newInventory,
            })
            .eq("id", item.platform_id);

          if (inventoryError) throw inventoryError;
        }
      }

      // Update order to set total_amount to 0 and change payment status
      const { error: orderError } = await supabase
        .from("orders")
        .update({
          total_amount: 0,
          payment_status: "refunded",
          status: "refunded", // Set status to refunded
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedOrder.id);

      if (orderError) throw orderError;

      // Update payment details to show refunded status
      const { error: paymentError } = await (supabase as any)
        .from("payment_details")
        .update({
          amount: 0,
          notes: `REFUNDED: ${refundForm.reason}. ${
            refundForm.notes || ""
          }`.trim(),
        })
        .eq("order_id", selectedOrder.id);

      if (paymentError) throw paymentError;

      // Create refund record for audit trail
      const { error: refundError } = await (supabase as any)
        .from("refunds_replacements")
        .insert({
          order_id: selectedOrder.id,
          type: "refund",
          reason: refundForm.reason,
          amount: selectedOrder.total_amount, // Record original amount
          notes: refundForm.notes,
          status: "completed",
          created_by: user?.id || "admin",
          processed_by: user?.id || "admin",
          processed_at: new Date().toISOString(),
        });

      if (refundError) throw refundError;

      // Reset form and close modals
      setRefundForm({ reason: "", notes: "" });
      setShowRefundModal(false);
      setShowViewModal(false);
      fetchData();

      alert(
        "Refund processed successfully! Inventory has been restored and order amount set to $0."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process refund");
    } finally {
      setLoading(false);
    }
  };

  // Replacement functionality
  const handleReplacement = async () => {
    if (!selectedOrder) return;

    setLoading(true);
    try {
      // Update order status to replacement
      const { error: orderError } = await supabase
        .from("orders")
        .update({ status: "replacement" })
        .eq("id", selectedOrder.id);

      if (orderError) throw orderError;

      // Create replacement record
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: replacementError } = await (supabase as any)
        .from("refunds_replacements")
        .insert({
          order_id: selectedOrder.id,
          type: "replacement",
          reason: replacementForm.reason,
          notes: replacementForm.notes,
          status: "completed",
          created_by: user?.id || "admin", // Use actual user ID
          processed_by: user?.id || "admin",
          processed_at: new Date().toISOString(),
        });

      if (replacementError) throw replacementError;

      // Reset form and close modal
      setReplacementForm({ reason: "", notes: "" });
      setShowReplacementModal(false);
      setShowViewModal(false);
      fetchData();

      alert("Replacement processed successfully!");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to process replacement"
      );
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
        alert("Invoice copied to clipboard!");
      } else {
        alert("Failed to copy invoice to clipboard");
      }
    } catch (error) {
      console.error("Error copying invoice:", error);
      alert("Failed to copy invoice to clipboard");
    } finally {
      setInvoiceLoading(false);
    }
  };

  const handleCopyInvoiceFromTable = async (order: Order) => {
    setInvoiceLoading(true);

    try {
      // Create a temporary container for the invoice
      const tempContainer = document.createElement("div");
      tempContainer.style.position = "absolute";
      tempContainer.style.left = "-9999px";
      tempContainer.style.top = "-9999px";
      tempContainer.style.width = "800px"; // Set proper width for rendering
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
                ${customer?.name || "Unknown Customer"}
              </div>
              ${
                customer?.contact_numbers && customer.contact_numbers.length > 0
                  ? `
                <div style="font-size: 14px; color: #6b7280; margin-bottom: 4px;">
                  📞 ${customer.contact_numbers[0]}
                </div>
              `
                  : ""
              }
              <div style="font-size: 12px; color: #9ca3af; margin-top: 8px;">
                Customer ID: ${customer?.id.slice(-8).toUpperCase() || "N/A"}
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
                        ? new Date(order.created_at).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )
                        : "N/A"
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
                    const platform = platforms.find(
                      (p) => p.id === item.platform_id
                    );
                    const isEvenRow = idx % 2 === 0;
                    return `
                    <tr style="background-color: ${
                      isEvenRow ? "#fdf2f8" : "#ffffff"
                    }; border-bottom: 1px solid #fce7f3;">
                      <td style="padding: 16px 12px; font-weight: 600; color: #374151;">
                        ${
                          item.platform ||
                          platform?.platform ||
                          "Unknown Platform"
                        }
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
                          ${platform?.account_type || "Standard"}
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
                  .join("")}
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
                  2
                )}</span>
              </div>
              
              ${
                order.discount_amount > 0
                  ? `
                <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                  <span style="font-size: 16px; font-weight: 500; color: #dc2626;">Discount:</span>
                  <span style="font-size: 16px; font-weight: 600; color: #dc2626;">-$${order.discount_amount.toFixed(
                    2
                  )}</span>
                </div>
              `
                  : ""
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
        alert("Invoice copied to clipboard!");
      } else {
        alert("Failed to copy invoice to clipboard");
      }
    } catch (error) {
      console.error("Error copying invoice:", error);
      alert("Failed to copy invoice to clipboard");
    } finally {
      // Clean up
      const tempContainer = document.querySelector(
        'div[style*="position: absolute"][style*="-9999px"]'
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
        alert("Failed to download invoice");
      }
    } catch (error) {
      console.error("Error downloading invoice:", error);
      alert("Failed to download invoice");
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
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          Order Management
        </h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Order
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4 mb-6">
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as Order["status"] | "all")
            }
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
            onChange={(e) =>
              setPaymentMethodFilter(e.target.value as PaymentMethod | "all")
            }
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent min-w-[160px]"
          >
            <option value="all">All Payment Methods</option>
            <option value="Cash">Cash</option>
            <option value="Crypto">Crypto</option>
            <option value="Bank Transfer">Bank Transfer</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Date Range</label>
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, start: e.target.value }))
              }
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm w-[130px]"
              placeholder="Start date"
            />
            <span className="text-gray-500 text-sm">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, end: e.target.value }))
              }
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm w-[130px]"
              placeholder="End date"
            />
          </div>
        </div>

        <button
          onClick={() => {
            setStatusFilter("all");
            setPaymentMethodFilter("all");
            setDateRange({ start: "", end: "" });
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
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Order ID
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Customer
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Items
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Total
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Payment
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Status
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Date
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Actions
              </th>
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
                  No orders found
                </td>
              </tr>
            ) : (
              paginatedOrders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 px-4">
                    <span className="font-mono text-sm">
                      #{order.id.slice(-8)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {getCustomerName(order.customer_id)}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-600">
                      {order.items.length} item
                      {order.items.length !== 1 ? "s" : ""}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold">
                      ${order.final_amount.toFixed(2)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm">{order.payment_method}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-600">
                      {order.created_at
                        ? new Date(order.created_at).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
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

                      {order.status === "pending" && (
                        <button
                          onClick={() =>
                            updateOrderStatus(order.id, "verified")
                          }
                          className="p-1 text-green-600 hover:bg-green-100 rounded"
                          title="Verify Order"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}

                      {order.invoice_url && (
                        <button
                          onClick={() =>
                            window.open(order.invoice_url!, "_blank")
                          }
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
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-gray-600">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, filteredOrders.length)} of{" "}
            {filteredOrders.length} orders
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="px-3 py-1 bg-pink-100 text-pink-800 rounded">
              {currentPage} of {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Create Order Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-white/10 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-pink-600 to-pink-700 text-white p-6 flex-shrink-0">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold">Create New Order</h3>
                  <p className="text-pink-100 text-sm mt-1">
                    Add a new order to the system
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-pink-100 hover:text-white p-2 rounded-lg hover:bg-pink-600/50 transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer *
                  </label>
                  <select
                    value={createForm.customer_id}
                    onChange={async (e) => {
                      const customerId = e.target.value;
                      setCreateForm((prev) => ({
                        ...prev,
                        customer_id: customerId,
                      }));

                      // Automatically update item price when customer changes
                      if (
                        customerId &&
                        newItem.platform_id &&
                        newItem.quantity > 0
                      ) {
                        const price = getCustomerPrice(
                          customerId,
                          newItem.platform_id,
                          newItem.quantity
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
                  <h4 className="text-md font-semibold text-gray-700 mb-3">
                    Add Items
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-3">
                    <select
                      value={newItem.platform_id}
                      onChange={(e) => {
                        const platformId = e.target.value;
                        setNewItem((prev) => ({
                          ...prev,
                          platform_id: platformId,
                          unit_price: 0, // Reset price, will be updated below
                        }));

                        // Reset price editing state when platform changes
                        setIsPriceEditable(false);

                        // Automatically calculate price based on customer pricing
                        if (
                          createForm.customer_id &&
                          platformId &&
                          newItem.quantity > 0
                        ) {
                          const price = getCustomerPrice(
                            createForm.customer_id,
                            platformId,
                            newItem.quantity
                          );
                          setNewItem((prev) => ({
                            ...prev,
                            unit_price: price,
                          }));
                        } else if (platformId) {
                          // Fallback to platform cost price if no customer selected
                          const platform = platforms.find(
                            (p) => p.id === platformId
                          );
                          setNewItem((prev) => ({
                            ...prev,
                            unit_price: platform?.cost_price || 0,
                          }));
                        }
                      }}
                      className="md:col-span-6 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    >
                      <option value="">Select Platform</option>
                      {platforms.map((platform) => (
                        <option key={platform.id} value={platform.id}>
                          {platform.platform} - {platform.account_type} ($
                          {platform.cost_price})
                        </option>
                      ))}
                    </select>

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
                          if (
                            createForm.customer_id &&
                            prev.platform_id &&
                            quantity > 0
                          ) {
                            const price = getCustomerPrice(
                              createForm.customer_id,
                              prev.platform_id,
                              quantity
                            );
                            updatedItem.unit_price = price;
                            // Reset price editing state when price is auto-calculated
                            setIsPriceEditable(false);
                          }

                          return updatedItem;
                        });
                      }}
                      className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />

                    <div className="md:col-span-2 relative">
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
                            ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                            : "bg-white"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setIsPriceEditable(!isPriceEditable)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-pink-500 transition-colors"
                        title={
                          isPriceEditable
                            ? "Disable price editing"
                            : "Enable price editing"
                        }
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={addItemToOrder}
                      className="md:col-span-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Add Item
                    </button>
                  </div>

                  {/* Order Items List */}
                  {createForm.items.length > 0 && (
                    <div className="border border-gray-200 rounded-lg">
                      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                        <h5 className="font-medium text-gray-700">
                          Order Items
                        </h5>
                      </div>
                      <div className="p-4">
                        {createForm.items.map((item, index) => (
                          <div
                            key={`item-${index}`}
                            className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
                          >
                            <div>
                              <span className="font-medium">
                                {item.platform}
                              </span>
                              <span className="text-sm text-gray-600 ml-2">
                                {item.quantity} × ${(item.unitPrice || 0).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold">
                                ${(item.total_price || 0).toFixed(2)}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  removeItemFromOrder(item.platform_id)
                                }
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
                    Payment Method *
                  </label>
                  <select
                    value={createForm.payment_method}
                    onChange={(e) => {
                      const paymentMethod = e.target.value as PaymentMethod;
                      let defaultPaymentDetails: PaymentDetails;

                      switch (paymentMethod) {
                        case "Crypto":
                          defaultPaymentDetails = {
                            payment_method: "Crypto",
                            id: "",
                            order_id: "",
                            amount: 0,
                            currency: "USDT",
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                          } as CryptoPaymentDetails;
                          break;
                        case "Bank Transfer":
                          defaultPaymentDetails = {
                            payment_method: "Bank Transfer",
                            id: "",
                            order_id: "",
                            amount: 0,
                            currency: "USD",
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                          } as BankTransferDetails;
                          break;
                        case "Cash":
                        default:
                          defaultPaymentDetails = {
                            payment_method: "Cash",
                            id: "",
                            order_id: "",
                            amount: 0,
                            currency: "USD",
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                          } as CashPaymentDetails;
                          break;
                      }

                      setCreateForm((prev) => ({
                        ...prev,
                        payment_method: paymentMethod,
                        payment_details: defaultPaymentDetails,
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    required
                  >
                    <option value="Cash">Cash</option>
                    <option value="Crypto">Crypto</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>

                {/* Payment Details Forms */}
                {createForm.payment_method === "Crypto" && (
                  <div className="mb-4 p-4 border border-gray-200 rounded-lg">
                    <h5 className="font-medium text-gray-700 mb-3">
                      Crypto Payment Details
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <select
                        value={
                          (createForm.payment_details as any)
                            .currency || "USDT"
                        }
                        onChange={(e) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            payment_details: {
                              ...(prev.payment_details as any),
                              currency: e.target.value as "USDT" | "BTC",
                            },
                          }))
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      >
                        <option value="USDT">USDT</option>
                        <option value="BTC">BTC</option>
                      </select>

                      <input
                        type="text"
                        placeholder="Username"
                        value={
                          (createForm.payment_details as any)
                            ?.username || ""
                        }
                        onChange={(e) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            payment_details: {
                              ...(prev.payment_details as any),
                              username: e.target.value,
                            },
                          }))
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        required
                      />

                      <input
                        type="text"
                        placeholder="Pay ID"
                        value={
                          (createForm.payment_details as any)
                            .pay_id || ""
                        }
                        onChange={(e) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            payment_details: {
                              ...(prev.payment_details as any),
                              pay_id: e.target.value,
                            },
                          }))
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        required
                      />

                      <select
                        value={
                          (createForm.payment_details as any)
                            .network || "TRC20"
                        }
                        onChange={(e) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            payment_details: {
                              ...(prev.payment_details as any),
                              network: e.target.value as "TRC20" | "BEP20",
                            },
                          }))
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      >
                        <option value="TRC20">TRC20</option>
                        <option value="BEP20">BEP20</option>
                      </select>
                    </div>
                  </div>
                )}

                {createForm.payment_method === "Bank Transfer" && (
                  <div className="mb-4 p-4 border border-gray-200 rounded-lg">
                    <h5 className="font-medium text-gray-700 mb-3">
                      Bank Transfer Details
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Transaction Reference"
                        value={
                          (createForm.payment_details as any)
                            .bank_transaction_reference || ""
                        }
                        onChange={(e) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            payment_details: {
                              ...(prev.payment_details as any),
                              transaction_reference: e.target.value,
                            },
                          }))
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        required
                      />

                      <input
                        type="text"
                        placeholder="Sender Name"
                        value={
                          (createForm.payment_details as any)
                            .sender_name || ""
                        }
                        onChange={(e) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            payment_details: {
                              ...(prev.payment_details as any),
                              sender_name: e.target.value,
                            },
                          }))
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        required
                      />

                      <input
                        type="text"
                        placeholder="Sender Bank"
                        value={
                          (createForm.payment_details as any)
                            .sender_bank || ""
                        }
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
                        type="datetime-local"
                        placeholder="Transaction Time"
                        value={
                          (createForm.payment_details as any)
                            .transaction_time || ""
                        }
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
                        value={
                          (createForm.payment_details as any)
                            .currency || "USD"
                        }
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
                        value={
                          (createForm.payment_details as any)
                            .bank_amount_in_currency || ""
                        }
                        onChange={(e) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            payment_details: {
                              ...(prev.payment_details as any),
                              amount_in_currency:
                                parseFloat(e.target.value) || 0,
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
                        value={
                          (createForm.payment_details as any)
                            .exchange_rate || ""
                        }
                        onChange={(e) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            payment_details: {
                              ...(prev.payment_details as any),
                              exchange_rate:
                                parseFloat(e.target.value) || undefined,
                            },
                          }))
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}

                {createForm.payment_method === "Cash" && (
                  <div className="mb-4 p-4 border border-gray-200 rounded-lg">
                    <h5 className="font-medium text-gray-700 mb-3">
                      Cash Payment Details
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Received By"
                        value={
                          (createForm.payment_details as any)
                            .received_by || ""
                        }
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
                        value={
                          (createForm.payment_details as any)
                            .receipt_number || ""
                        }
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
                          value={
                            (createForm.payment_details as any)
                              .notes || ""
                          }
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
                    value={createForm.notes || ""}
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
                {createForm.items
                  .reduce((sum, item) => sum + item.total_price, 0)
                  .toFixed(2)}
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
                  {loading ? "Creating..." : "Create Order"}
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
                    Order #{selectedOrder.id.slice(-8)} •{" "}
                    {selectedOrder.created_at
                      ? new Date(selectedOrder.created_at).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-pink-100 hover:text-white transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
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
                            selectedOrder.status
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
                          {selectedOrder.payment_method === "Crypto" && (
                            <svg
                              className="w-4 h-4 mr-2 text-orange-500"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M10 2L3 7v6c0 5.5 3.8 7.4 7 7.4s7-1.9 7-7.4V7l-7-5z" />
                            </svg>
                          )}
                          {selectedOrder.payment_method === "Bank Transfer" && (
                            <svg
                              className="w-4 h-4 mr-2 text-blue-500"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 114 0 2 2 0 01-4 0zm8 0a2 2 0 114 0 2 2 0 01-4 0z" />
                            </svg>
                          )}
                          {selectedOrder.payment_method === "Cash" && (
                            <svg
                              className="w-4 h-4 mr-2 text-green-500"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4z" />
                              <path d="M6 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2V6z" />
                            </svg>
                          )}
                          <span className="text-gray-900">
                            {selectedOrder.payment_method}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                          Created Date
                        </label>
                        <p className="text-gray-900">
                          {selectedOrder.created_at
                            ? new Date(
                                selectedOrder.created_at
                              ).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "N/A"}
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
                        <div
                          key={index}
                          className="p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center mb-2">
                                <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center text-white font-bold text-sm mr-3">
                                  {item.platform.charAt(0)}
                                </div>
                                <div>
                                  <h5 className="font-semibold text-gray-900">
                                    {item.platform}
                                  </h5>
                                  <p className="text-sm text-gray-600">
                                    Account
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
                          <span>
                            -${selectedOrder.discount_amount.toFixed(2)}
                          </span>
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
                    const orderPaymentDetails = getOrderPaymentDetails(
                      selectedOrder.id
                    );
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
                                  <span className="font-medium text-gray-600">
                                    Amount:
                                  </span>
                                  <p className="text-gray-900 font-semibold">
                                    ${orderPaymentDetails.amount}
                                  </p>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-600">
                                    Currency:
                                  </span>
                                  <p className="text-gray-900">
                                    {orderPaymentDetails.currency}
                                  </p>
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
                            {selectedOrder.payment_method === "Crypto" && (
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
                                      <span className="font-medium text-gray-600">
                                        Currency:
                                      </span>
                                      <span className="ml-2 bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-medium">
                                        {orderPaymentDetails.crypto_currency}
                                      </span>
                                    </div>
                                  )}
                                  {orderPaymentDetails.crypto_network && (
                                    <div>
                                      <span className="font-medium text-gray-600">
                                        Network:
                                      </span>
                                      <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                                        {orderPaymentDetails.crypto_network}
                                      </span>
                                    </div>
                                  )}
                                  {orderPaymentDetails.crypto_username && (
                                    <div>
                                      <span className="font-medium text-gray-600">
                                        Username:
                                      </span>
                                      <p className="text-gray-900">
                                        {orderPaymentDetails.crypto_username}
                                      </p>
                                    </div>
                                  )}
                                  {orderPaymentDetails.crypto_pay_id && (
                                    <div>
                                      <span className="font-medium text-gray-600">
                                        Pay ID:
                                      </span>
                                      <p className="text-gray-900 font-mono">
                                        {orderPaymentDetails.crypto_pay_id}
                                      </p>
                                    </div>
                                  )}
                                  {orderPaymentDetails.crypto_wallet_address && (
                                    <div>
                                      <span className="font-medium text-gray-600">
                                        Wallet Address:
                                      </span>
                                      <p className="text-gray-900 font-mono text-xs break-all bg-gray-50 p-2 rounded mt-1">
                                        {
                                          orderPaymentDetails.crypto_wallet_address
                                        }
                                      </p>
                                    </div>
                                  )}
                                  {orderPaymentDetails.crypto_transaction_hash && (
                                    <div>
                                      <span className="font-medium text-gray-600">
                                        Transaction Hash:
                                      </span>
                                      <p className="text-gray-900 font-mono text-xs break-all bg-gray-50 p-2 rounded mt-1">
                                        {
                                          orderPaymentDetails.crypto_transaction_hash
                                        }
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {selectedOrder.payment_method ===
                              "Bank Transfer" && (
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
                                        Reference:
                                      </span>
                                      <p className="text-gray-900 font-mono">
                                        {
                                          orderPaymentDetails.bank_transaction_reference
                                        }
                                      </p>
                                    </div>
                                  )}
                                  {orderPaymentDetails.bank_sender_name && (
                                    <div>
                                      <span className="font-medium text-gray-600">
                                        Sender:
                                      </span>
                                      <p className="text-gray-900">
                                        {orderPaymentDetails.bank_sender_name}
                                      </p>
                                    </div>
                                  )}
                                  {orderPaymentDetails.bank_sender_bank && (
                                    <div>
                                      <span className="font-medium text-gray-600">
                                        Bank:
                                      </span>
                                      <p className="text-gray-900">
                                        {orderPaymentDetails.bank_sender_bank}
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
                                          orderPaymentDetails.bank_transaction_time
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
                                        {
                                          orderPaymentDetails.bank_amount_in_currency
                                        }{" "}
                                        {orderPaymentDetails.currency}
                                      </p>
                                      {orderPaymentDetails.bank_exchange_rate && (
                                        <p className="text-xs text-gray-500">
                                          Rate:{" "}
                                          {
                                            orderPaymentDetails.bank_exchange_rate
                                          }
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {selectedOrder.payment_method === "Cash" && (
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
                                      <span className="font-medium text-gray-600">
                                        Receipt #:
                                      </span>
                                      <p className="text-gray-900 font-mono">
                                        {
                                          orderPaymentDetails.cash_receipt_number
                                        }
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
                                <span className="font-medium">Recorded:</span>{" "}
                                {new Date(
                                  orderPaymentDetails.created_at
                                ).toLocaleString()}
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
                Last updated:{" "}
                {selectedOrder.created_at
                  ? new Date(selectedOrder.created_at).toLocaleString()
                  : "N/A"}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                {(selectedOrder?.status === "pending") && (
                  <button
                    onClick={() => {
                      updateOrderStatus(selectedOrder.id, "verified");
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
                {(selectedOrder?.status === "verified" ||
                  selectedOrder?.status === "completed") && (
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
                    onClick={() =>
                      window.open(selectedOrder.invoice_url!, "_blank")
                    }
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
                <p className="text-pink-100 text-sm mt-1">
                  Order #{selectedOrder.id.slice(-8)}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleCopyInvoice()}
                  disabled={invoiceLoading}
                  className="bg-pink-500 hover:bg-pink-600 text-white px-3 py-1 rounded text-sm transition-colors flex items-center disabled:opacity-50"
                  title="Copy Invoice to Clipboard"
                >
                  <Copy className="w-4 h-4 mr-1" />
                  {invoiceLoading ? "Copying..." : "Copy"}
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
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
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
                  customer={
                    customers.find((c) => c.id === selectedOrder.customer_id) ||
                    null
                  }
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Process Refund
              </h3>
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
                    <strong>Note:</strong> This will restore all order items to
                    inventory and set the order amount to $0. The order will be
                    marked as refunded.
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
                {loading ? "Processing..." : "Process Refund"}
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Process Replacement
              </h3>
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
                    <strong>Note:</strong> Processing a replacement will mark
                    this order as "Replacement" status. You can create a new
                    order for the replacement items separately.
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
                {loading ? "Processing..." : "Process Replacement"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderPanel;
