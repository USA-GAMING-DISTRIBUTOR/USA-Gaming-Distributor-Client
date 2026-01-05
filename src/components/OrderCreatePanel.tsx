import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import LoadingSpinner from './LoadingSpinner';
import html2canvas from 'html2canvas';
import { Plus, Trash2 } from 'lucide-react';
import { useAppSelector } from '../hooks/redux';
import Pagination from './common/Pagination';
import type { Database } from '../types/database.types';

interface Customer {
  id: string;
  name: string;
}
interface Platform {
  id: string;
  platform: string;
}
interface OrderItemInput {
  platform_id: string;
  quantity: number;
  price: number;
  username?: string;
}

interface OrderRowItem {
  platform_id: string;
  quantity: number;
  price: number;
  total_price: number;
  username?: string;
}

type OrderRow = Database['public']['Tables']['orders']['Row'] & {
  items: OrderRowItem[];
};

const paymentMethods = ['Cash', 'Card', 'Bank Transfer'];

const OrderCreatePanel: React.FC = () => {
  const user = useAppSelector((state) => state.auth.user);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [platforms, setPlatforms] = useState<(Platform & { inventory?: number })[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItemInput[]>([
    { platform_id: '', quantity: 1, price: 0 },
  ]);
  const [customerId, setCustomerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(paymentMethods[0]);
  const [error, setError] = useState<string | null>(null);
  const [itemErrors, setItemErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [orders, setOrders] = useState<OrderRow[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [copyingId, setCopyingId] = useState<string | null>(null);
  const [itemsModalOpen, setItemsModalOpen] = useState(false);
  const [itemsModalOrder, setItemsModalOrder] = useState<OrderRow | null>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [lastOrder, setLastOrder] = useState<(OrderRow & { items: OrderRowItem[] }) | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: customerData } = await supabase.from('customers').select('id, name');
      setCustomers(customerData || []);
      const { data: platformData } = await supabase
        .from('game_coins')
        .select('id, platform, inventory, is_visible_to_employee')
        .is('deleted_at', null)
        .eq('is_visible_to_employee', true);
      setPlatforms(
        (platformData || []).map((p: any) => ({
          ...p,
          is_visible_to_employee: p.is_visible_to_employee ?? true,
        })) as (Platform & {
          inventory?: number;
        })[],
      );
      // Fetch orders and attach their items for UI consumption
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersData && ordersData.length > 0) {
        const orderIds = ordersData.map((o) => o.id);
        const { data: itemsData } = await supabase
          .from('order_items')
          .select('order_id, platform_id, quantity, unit_price, total_price, username')
          .in('order_id', orderIds);

        const itemsByOrder: Record<string, OrderRowItem[]> = {};
        (itemsData || []).forEach((it) => {
          if (!itemsByOrder[it.order_id]) itemsByOrder[it.order_id] = [];
          itemsByOrder[it.order_id].push({
            platform_id: it.platform_id,
            quantity: it.quantity,
            price: it.unit_price,
            total_price: it.total_price,
            username: it.username || undefined,
          });
        });

        const combined = ordersData.map((o) => ({
          ...o,
          items: itemsByOrder[o.id] || [],
        }));
        setOrders(combined as OrderRow[]);
      } else {
        setOrders([]);
      }
    };
    fetchData();
  }, []);

  // Pagination logic
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = orders.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const handleOrderItemChange = <K extends keyof OrderItemInput>(
    idx: number,
    field: K,
    value: OrderItemInput[K],
  ) => {
    setOrderItems((items) =>
      items.map((item, i) => (i === idx ? { ...item, [field]: value } : item)),
    );
    // Validate quantity for this item
    if (field === 'quantity' || field === 'platform_id') {
      const platformId = field === 'platform_id' ? (value as string) : orderItems[idx].platform_id;
      const quantity = field === 'quantity' ? (value as number) : orderItems[idx].quantity;
      const platform = platforms.find((c) => c.id === platformId);
      const errors = [...itemErrors];
      if (platform && platform.inventory !== undefined && quantity > platform.inventory) {
        errors[idx] = `Max: ${platform.inventory}`;
      } else {
        errors[idx] = '';
      }
      setItemErrors(errors);
    }
  };

  const handleAddOrderItem = () => {
    setOrderItems([...orderItems, { platform_id: '', quantity: 1, price: 0 }]);
  };

  const handleRemoveOrderItem = (idx: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const errors: string[] = [];
    if (!user?.id) {
      setError('User not authenticated. Please log in to create an order.');
      setLoading(false);
      return;
    }
    if (
      !customerId ||
      orderItems.some((item) => !item.platform_id || item.quantity < 1 || item.price < 0)
    ) {
      setError('Please fill all fields correctly.');
      setLoading(false);
      return;
    }
    // Validate all quantities against inventory before submitting
    orderItems.forEach((item, idx) => {
      const platform = platforms.find((c) => c.id === item.platform_id);
      if (platform && platform.inventory !== undefined && item.quantity > platform.inventory) {
        errors[idx] = `Max: ${platform.inventory}`;
      } else {
        errors[idx] = '';
      }
    });
    setItemErrors(errors);
    if (errors.some((e) => e)) {
      setError('Please fix quantity errors before confirming.');
      setLoading(false);
      return;
    }
    // Insert order with required fields and without embedding items
    const totalAmount = orderItems.reduce(
      (sum, it) => sum + Number(it.price) * Number(it.quantity),
      0,
    );
    const orderNumber = `ORD-${Date.now()}`;
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id: customerId,
        payment_method: paymentMethod,
        status: 'pending',
        created_at: new Date().toISOString(),
        created_by: user.id,
        order_number: orderNumber,
        total_amount: totalAmount,
      })
      .select();
    if (orderError || !orderData || !orderData[0]) {
      setError('Failed to create order: ' + (orderError?.message || 'Unknown error'));
      setLoading(false);
      return;
    }
    // Persist order items into order_items table
    const newOrder = orderData[0] as Database['public']['Tables']['orders']['Row'];
    const itemsToInsert = orderItems.map((item) => ({
      order_id: newOrder.id,
      platform_id: item.platform_id,
      quantity: item.quantity,
      unit_price: item.price,
      total_price: Number(item.price) * Number(item.quantity),
    }));
    const { error: itemsInsertError } = await supabase.from('order_items').insert(itemsToInsert);
    if (itemsInsertError) {
      setError('Failed to insert order items: ' + itemsInsertError.message);
      setLoading(false);
      return;
    }

    // Keep a local copy of items for invoice rendering
    const orderRowItems: OrderRowItem[] = orderItems.map((i) => ({
      platform_id: i.platform_id,
      quantity: i.quantity,
      price: i.price,
      total_price: Number(i.price) * Number(i.quantity),
      username: i.username,
    }));
    setLastOrder({ ...newOrder, items: orderRowItems });
    // Update coin inventory in DB
    // Update platform inventory in DB
    for (const item of orderItems) {
      const platform = platforms.find((p) => p.id === item.platform_id);
      if (platform && platform.inventory !== undefined) {
        const newInventory = platform.inventory - item.quantity;
        await supabase
          .from('game_coins') // TODO: rename table to platforms in schema later
          .update({ inventory: newInventory })
          .eq('id', platform.id);
      }
    }
    // Wait for invoice to render
    setTimeout(async () => {
      if (invoiceRef.current) {
        try {
          const canvas = await html2canvas(invoiceRef.current);
          const blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, 'image/png'),
          );
          if (blob) {
            const fileName = `invoice-${orderData[0].id}.png`;
            const { error: uploadError, data: uploadData } = await supabase.storage
              .from('invoices')
              .upload(fileName, blob, { upsert: true });
            if (uploadError) {
              setError('Invoice upload failed: ' + uploadError.message);
              console.error('Invoice upload failed:', uploadError);
            } else if (!uploadData) {
              setError('Invoice upload failed: No data returned.');
              console.error('Invoice upload failed: No data returned.');
            } else {
              const { data: publicData } = supabase.storage.from('invoices').getPublicUrl(fileName);
              if (!publicData || !publicData.publicUrl) {
                setError('Invoice public URL failed: No URL returned.');
                console.error('Invoice public URL failed: No URL returned.');
              } else {
                // public URL derived when needed in the UI
              }
            }
          } else {
            setError('Invoice image generation failed.');
          }
        } catch (err) {
          setError(
            'Invoice generation error: ' + (err instanceof Error ? err.message : String(err)),
          );
        }
      }
      setOrderItems([{ platform_id: '', quantity: 1, price: 0 }]);
      setCustomerId('');
      setPaymentMethod(paymentMethods[0]);
      setLoading(false);
      setShowModal(false);
      // Refresh orders
      const { data: ordersData2 } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (ordersData2 && ordersData2.length > 0) {
        const orderIds2 = ordersData2.map((o) => o.id);
        const { data: itemsData2 } = await supabase
          .from('order_items')
          .select('order_id, platform_id, quantity, unit_price, total_price, username')
          .in('order_id', orderIds2);
        const itemsByOrder2: Record<string, OrderRowItem[]> = {};
        (itemsData2 || []).forEach((it) => {
          if (!itemsByOrder2[it.order_id]) itemsByOrder2[it.order_id] = [];
          itemsByOrder2[it.order_id].push({
            platform_id: it.platform_id,
            quantity: it.quantity,
            price: it.unit_price,
            total_price: it.total_price,
            username: it.username || undefined,
          });
        });
        const combined2 = ordersData2.map((o) => ({
          ...o,
          items: itemsByOrder2[o.id] || [],
        }));
        setOrders(combined2 as OrderRow[]);
      } else {
        setOrders([]);
      }
      setLastOrder(null);
    }, 500);
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg relative">
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10">
          <LoadingSpinner />
        </div>
      )}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Orders</h2>
        <button
          className="bg-pink-500 text-white px-4 py-2 rounded shadow flex items-center"
          onClick={() => setShowModal(true)}
        >
          <Plus className="w-4 h-4 mr-1 inline" /> Create Order
        </button>
      </div>
      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.2)' }}
        >
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-4">Create Order</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block mb-2 font-medium">Customer</label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border"
                  required
                >
                  <option value="">Select customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-2 font-medium">Order Items</label>
                {orderItems.map((item, idx) => (
                  <div key={idx} className="flex space-x-2 mb-2 items-center">
                    <div className="flex flex-col">
                      <label className="text-xs mb-1">Platform</label>
                      <select
                        value={item.platform_id}
                        onChange={(e) => handleOrderItemChange(idx, 'platform_id', e.target.value)}
                        className="px-2 py-1 rounded border"
                        required
                      >
                        <option value="">Select platform</option>
                        {platforms.map((platform) => (
                          <option key={platform.id} value={platform.id}>
                            {platform.platform}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs mb-1">Quantity</label>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) =>
                          handleOrderItemChange(idx, 'quantity', Number(e.target.value))
                        }
                        className="px-2 py-1 rounded border w-20"
                        placeholder="Qty"
                        required
                      />
                      {itemErrors[idx] && (
                        <span className="text-xs text-red-500 mt-1">{itemErrors[idx]}</span>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs mb-1">Price</label>
                      <input
                        type="number"
                        min={0}
                        step="0.0001"
                        value={item.price}
                        onChange={(e) =>
                          handleOrderItemChange(idx, 'price', Number(e.target.value))
                        }
                        className="px-2 py-1 rounded border w-24"
                        placeholder="Price"
                        required
                      />
                    </div>
                    <button
                      type="button"
                      className="p-1 text-red-500 hover:bg-red-50 rounded mt-5"
                      onClick={() => handleRemoveOrderItem(idx)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="bg-pink-500 text-white px-3 py-1 rounded flex items-center"
                  onClick={handleAddOrderItem}
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Item
                </button>
              </div>
              <div>
                <label className="block mb-2 font-medium">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border"
                  required
                >
                  {paymentMethods.map((pm) => (
                    <option key={pm} value={pm}>
                      {pm}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-200 rounded"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-pink-500 text-white rounded"
                  disabled={loading}
                >
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hidden Invoice for html2canvas */}
      {lastOrder && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <div
            ref={invoiceRef}
            style={{
              background: '#fff',
              padding: 32,
              borderRadius: 16,
              boxShadow: '0 2px 8px #ec4899',
              width: 480,
              fontFamily: 'Arial, sans-serif',
              border: '1px solid #e5e7eb',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <img
                src="/usa-gaming-logo.jpg"
                alt="USA Gaming Distributor Logo"
                style={{ height: 48, marginRight: 16, borderRadius: 8 }}
              />
              <div>
                <div style={{ fontWeight: 'bold', fontSize: 20, color: '#ec4899' }}>
                  USA Gaming Distributor
                </div>
                <div style={{ fontSize: 12, color: '#555' }}>
                  support@usagaming.com | +1-800-123-4567
                </div>
                <div style={{ fontSize: 12, color: '#555' }}>123 Main St, New York, NY</div>
              </div>
            </div>
            <hr style={{ margin: '16px 0', borderColor: '#ec4899' }} />
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontWeight: 'bold' }}>Invoice #: </span>
              {lastOrder.id}
              <br />
              <span style={{ fontWeight: 'bold' }}>Date: </span>
              {new Date(lastOrder.created_at).toLocaleString()}
              <br />
              <span style={{ fontWeight: 'bold' }}>Customer: </span>
              {customers.find((c) => c.id === lastOrder.customer_id)?.name || lastOrder.customer_id}
              <br />
              <span style={{ fontWeight: 'bold' }}>Payment Method: </span>
              {lastOrder.payment_method}
            </div>
            <table
              style={{
                width: '100%',
                fontSize: 13,
                borderCollapse: 'collapse',
                marginBottom: 16,
              }}
            >
              <thead>
                <tr style={{ background: '#f3f4f6' }}>
                  <th
                    style={{
                      border: '1px solid #e5e7eb',
                      padding: '8px',
                      textAlign: 'left',
                    }}
                  >
                    Platform
                  </th>
                  <th
                    style={{
                      border: '1px solid #e5e7eb',
                      padding: '8px',
                      textAlign: 'right',
                    }}
                  >
                    Quantity
                  </th>
                  <th
                    style={{
                      border: '1px solid #e5e7eb',
                      padding: '8px',
                      textAlign: 'right',
                    }}
                  >
                    Unit Price
                  </th>
                  <th
                    style={{
                      border: '1px solid #e5e7eb',
                      padding: '8px',
                      textAlign: 'right',
                    }}
                  >
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(lastOrder.items) &&
                  (lastOrder.items as OrderRowItem[]).map((item, idx: number) => {
                    const id = item.platform_id;
                    const platformEntry = platforms.find((p) => p.id === id);
                    const platformName = platformEntry?.platform || id || '—';
                    const total = Number(item.price) * Number(item.quantity);
                    return (
                      <tr key={idx}>
                        <td
                          style={{
                            border: '1px solid #e5e7eb',
                            padding: '8px',
                          }}
                        >
                          {platformName}
                        </td>
                        <td
                          style={{
                            border: '1px solid #e5e7eb',
                            padding: '8px',
                            textAlign: 'right',
                          }}
                        >
                          {item.quantity}
                        </td>
                        <td
                          style={{
                            border: '1px solid #e5e7eb',
                            padding: '8px',
                            textAlign: 'right',
                          }}
                        >
                          $
                          {Number(item.price).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 4,
                          })}
                        </td>
                        <td
                          style={{
                            border: '1px solid #e5e7eb',
                            padding: '8px',
                            textAlign: 'right',
                          }}
                        >
                          $
                          {total.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 4,
                          })}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
            <div
              style={{
                textAlign: 'right',
                fontWeight: 'bold',
                fontSize: 16,
                marginBottom: 8,
              }}
            >
              Grand Total: $
              {Array.isArray(lastOrder.items)
                ? (lastOrder.items as OrderRowItem[]).reduce(
                    (sum: number, item) => sum + Number(item.price) * Number(item.quantity),
                    0,
                  )
                : 0}
            </div>
            <hr style={{ margin: '16px 0', borderColor: '#ec4899' }} />
            <div
              style={{
                fontSize: 12,
                color: '#555',
                textAlign: 'center',
                marginTop: 12,
              }}
            >
              Thank you for your purchase!
              <br />
              For support, contact support@usagaming.com
            </div>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <h2 className="text-lg font-semibold mt-10 mb-4">Orders</h2>
      <div className="overflow-x-auto">
        <table className="w-full table-auto text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="py-2 px-3 text-left w-32">Customer</th>
              <th className="py-2 px-3 text-left w-40">Items</th>
              <th className="py-2 px-3 text-left w-32">Payment</th>
              <th className="py-2 px-3 text-left w-24">Status</th>
              <th className="py-2 px-3 text-left w-40">Created At</th>
              <th className="py-2 px-3 text-left w-40">Invoice</th>
            </tr>
          </thead>
          <tbody>
            {paginatedOrders.map((order) => (
              <tr
                key={order.id}
                className="border-b hover:bg-pink-50 cursor-pointer"
                onClick={() => {
                  setItemsModalOrder(order);
                  setItemsModalOpen(true);
                }}
              >
                <td className="py-2 px-3 font-medium">
                  {customers.find((c) => c.id === order.customer_id)?.name || order.customer_id}
                </td>
                <td className="py-2 px-3 select-none">
                  {Array.isArray(order.items)
                    ? `${order.items.length} item${order.items.length !== 1 ? 's' : ''}`
                    : '—'}
                </td>
                <td className="py-2 px-3">{order.payment_method}</td>
                <td className="py-2 px-3">{order.status}</td>
                <td
                  className="py-2 px-3"
                  onClick={(e) => {
                    // Prevent row click from opening modal when interacting with invoice actions
                    e.stopPropagation();
                  }}
                >
                  {new Date(order.created_at).toLocaleString()}
                </td>
                <td className="py-2 px-3">
                  <div className="flex items-center gap-2">
                    <a
                      href={
                        supabase.storage.from('invoices').getPublicUrl(`invoice-${order.id}.png`)
                          .data.publicUrl
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pink-500 underline font-semibold"
                      title="View Invoice"
                    >
                      View
                    </a>
                    {copyingId === order.id ? (
                      <span className="w-20 h-8 flex items-center justify-center bg-pink-500 rounded shadow border border-pink-300">
                        <LoadingSpinner size={20} stroke="#fff" />
                      </span>
                    ) : (
                      <button
                        className="w-20 h-8 flex items-center justify-center bg-pink-500 hover:bg-pink-600 rounded text-xs text-white font-semibold shadow transition-colors border border-pink-300"
                        title="Copy Invoice Image"
                        onClick={async () => {
                          setCopyingId(order.id);
                          try {
                            let permission = 'granted';
                            if (navigator.permissions) {
                              try {
                                const result = await navigator.permissions.query({
                                  name: 'clipboard-write' as PermissionName,
                                });
                                permission = result.state;
                              } catch (clipboardErr) {
                                // Swallow clipboard errors silently; could add toast
                                console.warn('Clipboard copy failed', clipboardErr);
                              }
                            }
                            if (permission !== 'granted') {
                              alert(
                                'Clipboard access is not enabled. Please allow clipboard permissions for this site in your browser settings.',
                              );
                              setCopyingId(null);
                              return;
                            }
                            const publicUrl = supabase.storage
                              .from('invoices')
                              .getPublicUrl(`invoice-${order.id}.png`).data.publicUrl;
                            const response = await fetch(publicUrl);
                            const blob = await response.blob();
                            await navigator.clipboard.write([
                              new window.ClipboardItem({ [blob.type]: blob }),
                            ]);
                          } catch {
                            // Optionally handle error visually
                          }
                          setTimeout(() => setCopyingId(null), 1000);
                        }}
                      >
                        Copy
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {orders.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalItems={orders.length}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      )}

      {itemsModalOpen && itemsModalOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            backdropFilter: 'blur(6px)',
            background: 'rgba(0,0,0,0.35)',
          }}
        >
          <div className="bg-white rounded-lg shadow-xl w-full max-w-xl p-6 relative">
            <button
              onClick={() => {
                setItemsModalOpen(false);
                setItemsModalOrder(null);
              }}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-sm"
              aria-label="Close"
            >
              ✕
            </button>
            <h3 className="text-lg font-semibold mb-2">Order Details</h3>
            <div className="mb-4 text-sm grid grid-cols-2 gap-x-4 gap-y-1">
              <div>
                <span className="font-semibold">Order ID:</span> {itemsModalOrder.id}
              </div>
              <div>
                <span className="font-semibold">Created:</span>{' '}
                {new Date(itemsModalOrder.created_at).toLocaleString()}
              </div>
              <div>
                <span className="font-semibold">Customer:</span>{' '}
                {customers.find((c) => c.id === itemsModalOrder.customer_id)?.name ||
                  itemsModalOrder.customer_id}
              </div>
              <div>
                <span className="font-semibold">Payment:</span> {itemsModalOrder.payment_method}
              </div>
              <div>
                <span className="font-semibold">Status:</span> {itemsModalOrder.status}
              </div>
              <div>
                <span className="font-semibold">Invoice:</span>{' '}
                <a
                  href={
                    supabase.storage
                      .from('invoices')
                      .getPublicUrl(`invoice-${itemsModalOrder.id}.png`).data.publicUrl
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pink-500 underline ml-1"
                >
                  View
                </a>
              </div>
            </div>
            <h4 className="font-semibold mb-2">Items</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-2 px-2 text-left">Platform</th>
                    <th className="py-2 px-2 text-right">Quantity</th>
                    <th className="py-2 px-2 text-right">Unit Price</th>
                    <th className="py-2 px-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(itemsModalOrder.items) &&
                  (itemsModalOrder.items as OrderRowItem[]).length > 0 ? (
                    (itemsModalOrder.items as OrderRowItem[]).map((item, idx: number) => {
                      const id = item.platform_id;
                      const platformName =
                        platforms.find((p) => p.id === id)?.platform || id || '—';
                      const total = Number(item.price) * Number(item.quantity);
                      return (
                        <tr key={idx} className="border-t">
                          <td className="py-1 px-2 font-medium">{platformName}</td>
                          <td className="py-1 px-2 text-right">{item.quantity}</td>
                          <td className="py-1 px-2 text-right">${item.price}</td>
                          <td className="py-1 px-2 text-right">${total}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-gray-500">
                        No items
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t bg-gray-50">
                    <td colSpan={3} className="py-2 px-2 text-right font-semibold">
                      Grand Total
                    </td>
                    <td className="py-2 px-2 text-right font-semibold">
                      $
                      {Array.isArray(itemsModalOrder.items)
                        ? (itemsModalOrder.items as OrderRowItem[]).reduce(
                            (sum: number, item) => sum + Number(item.price) * Number(item.quantity),
                            0,
                          )
                        : 0}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderCreatePanel;
