import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Pagination from './common/Pagination';

interface OrderItemRowUI {
  coin_id: string; // maps to order_items.platform_id
  coin_name?: string; // resolved from game_coins.platform
  quantity: number;
  price: number; // unit price
}
interface OrderUI {
  id: string;
  customer_id: string;
  customer: { name: string } | null;
  items: OrderItemRowUI[];
  payment_method: string | null;
  status: string;
  created_at: string;
  created_by?: string; // resolved to username if possible
  invoice_url?: string; // optional (derived elsewhere, not stored in orders table anymore)
}

const OrderVerificationPanel: React.FC = () => {
  // Edit modal state and handlers
  const [editOrder, setEditOrder] = useState<OrderUI | null>(null);
  const [editModal, setEditModal] = useState(false);

  const handleEditClick = (order: OrderUI) => {
    setEditOrder(order);
    setEditModal(true);
  };

  const handleEditChange = (field: keyof OrderUI, value: string) => {
    if (!editOrder) return;
    setEditOrder({ ...editOrder, [field]: value });
  };

  const handleEditSave = async () => {
    if (!editOrder) return;
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from('orders')
      .update({
        customer_id: editOrder.customer_id,
        items: editOrder.items,
        payment_method: editOrder.payment_method,
        status: editOrder.status,
      })
      .eq('id', editOrder.id);
    if (error) {
      setError('Failed to update order: ' + error.message);
      setLoading(false);
      return;
    }
    setEditModal(false);
    setEditOrder(null);
    fetchOrders();
    setLoading(false);
  };
  const [orders, setOrders] = useState<OrderUI[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  // ...existing code...
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [coins, setCoins] = useState<{ id: string; platform: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifyId, setVerifyId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailOrder, setDetailOrder] = useState<OrderUI | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch base orders (items no longer stored directly on orders table)
      const { data: orderRows, error: ordersError } = await supabase
        .from('orders')
        .select('id, customer_id, payment_method, status, created_at, created_by')
        .order('created_at', { ascending: false });
      if (ordersError) throw ordersError;

      const orderIds = (orderRows || []).map((o) => o.id);

      // 2. Fetch order items separately
      const { data: orderItemsRows, error: itemsError } = await supabase
        .from('order_items')
        .select('order_id, platform_id, quantity, unit_price')
        .in('order_id', orderIds.length ? orderIds : ['00000000-0000-0000-0000-000000000000']); // guard empty IN
      if (itemsError) throw itemsError;

      // 3. Fetch supporting lookups (coins, customers, users)
      const [{ data: coinsData }, { data: customersData }, { data: usersData }] = await Promise.all(
        [
          supabase.from('game_coins').select('id, platform'),
          supabase.from('customers').select('id, name'),
          supabase.from('users').select('id, username'),
        ],
      );

      setCoins(coinsData || []);
      setCustomers(customersData || []);

      // 4. Assemble orders with items
      const mapped: OrderUI[] = (orderRows || []).map((o) => {
        const itemsForOrder = (orderItemsRows || [])
          .filter((itm) => itm.order_id === o.id)
          .map<OrderItemRowUI>((itm) => ({
            coin_id: itm.platform_id,
            coin_name:
              coinsData?.find((c) => c.id === itm.platform_id)?.platform || itm.platform_id,
            quantity: itm.quantity,
            price: Number(itm.unit_price),
          }));

        return {
          id: o.id,
          customer_id: o.customer_id,
          customer: customersData?.find((c) => c.id === o.customer_id) || {
            name: o.customer_id,
          },
          items: itemsForOrder,
          payment_method: o.payment_method,
          status: o.status,
          created_at: o.created_at,
          created_by:
            usersData?.find((u) => u.id === o.created_by)?.username || o.created_by || undefined,
          invoice_url: undefined, // not persisted; could be derived elsewhere
        };
      });
      setOrders(mapped);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError('Failed to fetch orders: ' + message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
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

  const handleVerifyClick = (id: string) => {
    setVerifyId(id);
    setShowModal(true);
  };

  const handleVerifyOrder = async () => {
    if (!verifyId) return;
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from('orders')
      .update({ status: 'verified' })
      .eq('id', verifyId);
    if (error) {
      setError('Failed to verify order: ' + error.message);
      setLoading(false);
      return;
    }
    setShowModal(false);
    setVerifyId(null);
    fetchOrders();
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg w-full max-w-5xl mx-auto">
      <h2 className="text-lg font-semibold mb-4">Order Verification</h2>
      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700 w-24">Order ID</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700 w-32">Customer</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700 w-56">Items</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700 w-24">
                Payment Method
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700 w-20">Status</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700 w-32">Created By</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700 w-32">Created At</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700 w-24">Invoice</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700 w-24">Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedOrders.map((order) => (
              <tr
                key={order.id}
                className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                onClick={() => {
                  setDetailOrder(order);
                  setDetailModalOpen(true);
                }}
              >
                <td className="py-3 px-4 font-medium">{order.id}</td>
                <td className="py-3 px-4 font-medium">
                  {order.customer?.name || order.customer_id}
                </td>
                <td className="py-3 px-4">
                  {Array.isArray(order.items)
                    ? `${order.items.length} item${order.items.length !== 1 ? 's' : ''}`
                    : '—'}
                </td>
                <td className="py-3 px-4">{order.payment_method}</td>
                <td className="py-3 px-4">
                  {order.status === 'verified' ? (
                    <span className="text-green-600 font-semibold">Verified</span>
                  ) : (
                    <span className="text-yellow-600 font-semibold">Pending</span>
                  )}
                </td>
                <td className="py-3 px-4">{order.created_by}</td>
                <td className="py-3 px-4">{new Date(order.created_at).toLocaleString()}</td>
                <td className="py-3 px-4">
                  {order.invoice_url ? (
                    <a
                      href={order.invoice_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pink-500 underline"
                      title="View Invoice"
                    >
                      Invoice
                    </a>
                  ) : (
                    <span className="text-gray-400">No Invoice</span>
                  )}
                </td>
                <td className="py-2 px-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
                  {order.status !== 'verified' && (
                    <button
                      className="bg-blue-500 text-white px-3 py-1 rounded"
                      onClick={() => handleVerifyClick(order.id)}
                      disabled={loading}
                    >
                      Verify
                    </button>
                  )}
                  <button
                    className="bg-yellow-500 text-white px-3 py-1 rounded"
                    onClick={() => handleEditClick(order)}
                    disabled={loading}
                  >
                    Edit
                  </button>
                </td>
                {editModal && editOrder && (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center"
                    style={{
                      backdropFilter: 'blur(8px)',
                      background: 'rgba(0,0,0,0.2)',
                    }}
                  >
                    <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-2xl">
                      <h3 className="text-lg font-semibold mb-4">Edit Order</h3>
                      <div className="mb-4">
                        <label className="block mb-2 font-medium">Customer</label>
                        <select
                          value={editOrder.customer_id}
                          onChange={(e) => handleEditChange('customer_id', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border"
                        >
                          <option value="">Select Customer</option>
                          {customers.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="mb-4">
                        <label className="block mb-2 font-medium">Items</label>
                        <table className="w-full text-xs mb-2">
                          <thead>
                            <tr>
                              <th className="px-2 py-1 text-left">Platform</th>
                              <th className="px-2 py-1 text-left">Quantity</th>
                              <th className="px-2 py-1 text-left">Price</th>
                              <th className="px-2 py-1 text-left">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {editOrder.items.map((item, idx) => (
                              <tr key={idx}>
                                <td className="px-2 py-1">
                                  <select
                                    value={item.coin_id}
                                    onChange={(e) => {
                                      const newItems = [...editOrder.items];
                                      newItems[idx].coin_id = e.target.value;
                                      setEditOrder({
                                        ...editOrder,
                                        items: newItems,
                                      });
                                    }}
                                    className="w-full px-2 py-1 border rounded"
                                  >
                                    <option value="">Select Platform</option>
                                    {coins.map((coin) => (
                                      <option key={coin.id} value={coin.id}>
                                        {coin.platform}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-2 py-1">
                                  <input
                                    type="number"
                                    value={item.quantity}
                                    min={1}
                                    onChange={(e) => {
                                      const newItems = [...editOrder.items];
                                      newItems[idx].quantity = Number(e.target.value);
                                      setEditOrder({
                                        ...editOrder,
                                        items: newItems,
                                      });
                                    }}
                                    className="w-full px-2 py-1 border rounded"
                                  />
                                </td>
                                <td className="px-2 py-1">
                                  <input
                                    type="number"
                                    value={item.price}
                                    min={0}
                                    onChange={(e) => {
                                      const newItems = [...editOrder.items];
                                      newItems[idx].price = Number(e.target.value);
                                      setEditOrder({
                                        ...editOrder,
                                        items: newItems,
                                      });
                                    }}
                                    className="w-full px-2 py-1 border rounded"
                                  />
                                </td>
                                <td className="px-2 py-1">
                                  <button
                                    className="bg-red-500 text-white px-2 py-1 rounded"
                                    onClick={() => {
                                      const newItems = editOrder.items.filter((_, i) => i !== idx);
                                      setEditOrder({
                                        ...editOrder,
                                        items: newItems,
                                      });
                                    }}
                                  >
                                    Remove
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <button
                          className="bg-green-500 text-white px-3 py-1 rounded"
                          onClick={() => {
                            setEditOrder({
                              ...editOrder,
                              items: [...editOrder.items, { coin_id: '', quantity: 1, price: 0 }],
                            });
                          }}
                        >
                          Add Item
                        </button>
                      </div>
                      <div className="mb-4">
                        <label className="block mb-2 font-medium">Payment Method</label>
                        <input
                          type="text"
                          value={editOrder.payment_method}
                          onChange={(e) => handleEditChange('payment_method', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border"
                        />
                      </div>
                      <div className="mb-4">
                        <label className="block mb-2 font-medium">Status</label>
                        <select
                          value={editOrder.status}
                          onChange={(e) => handleEditChange('status', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border"
                        >
                          <option value="Pending">Pending</option>
                          <option value="verified">Verified</option>
                        </select>
                      </div>
                      <div className="flex justify-end space-x-2 mt-4">
                        <button
                          type="button"
                          className="px-4 py-2 bg-gray-200 rounded"
                          onClick={() => setEditModal(false)}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="px-4 py-2 bg-yellow-500 text-white rounded"
                          onClick={handleEditSave}
                          disabled={loading}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                )}
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

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.2)' }}
        >
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Confirm Verification</h3>
            <p className="mb-4">Are you sure you want to verify this order?</p>
            <div className="flex justify-end space-x-2 mt-4">
              <button
                type="button"
                className="px-4 py-2 bg-gray-200 rounded"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-blue-500 text-white rounded"
                onClick={handleVerifyOrder}
                disabled={loading}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      {detailModalOpen && detailOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            backdropFilter: 'blur(6px)',
            background: 'rgba(0,0,0,0.35)',
          }}
        >
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 relative">
            <button
              onClick={() => {
                setDetailModalOpen(false);
                setDetailOrder(null);
              }}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-sm"
              aria-label="Close"
            >
              ✕
            </button>
            <h3 className="text-lg font-semibold mb-2">Order Details</h3>
            <div className="mb-4 text-sm grid grid-cols-2 gap-x-4 gap-y-1">
              <div>
                <span className="font-semibold">Order ID:</span> {detailOrder.id}
              </div>
              <div>
                <span className="font-semibold">Created:</span>{' '}
                {new Date(detailOrder.created_at).toLocaleString()}
              </div>
              <div>
                <span className="font-semibold">Customer:</span>{' '}
                {detailOrder.customer?.name || detailOrder.customer_id}
              </div>
              <div>
                <span className="font-semibold">Payment:</span> {detailOrder.payment_method}
              </div>
              <div>
                <span className="font-semibold">Status:</span> {detailOrder.status}
              </div>
              <div>
                <span className="font-semibold">Created By:</span> {detailOrder.created_by || '-'}
              </div>
              <div className="col-span-2">
                <span className="font-semibold">Invoice:</span>{' '}
                {detailOrder.invoice_url ? (
                  <a
                    href={detailOrder.invoice_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pink-500 underline ml-1"
                  >
                    View
                  </a>
                ) : (
                  <span className="text-gray-400 ml-1">None</span>
                )}
              </div>
            </div>
            <h4 className="font-semibold mb-2">Items</h4>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Platform</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Quantity</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Unit Price</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(detailOrder.items) && detailOrder.items.length > 0 ? (
                    detailOrder.items.map((item, idx) => {
                      const total = Number(item.price) * Number(item.quantity);
                      return (
                        <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">
                            {item.coin_name || item.coin_id}
                          </td>
                          <td className="py-3 px-4 text-right">{item.quantity}</td>
                          <td className="py-3 px-4 text-right">${item.price}</td>
                          <td className="py-3 px-4 text-right">${total}</td>
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
                      {Array.isArray(detailOrder.items)
                        ? detailOrder.items.reduce(
                            (sum, item) => sum + Number(item.price) * Number(item.quantity),
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

export default OrderVerificationPanel;
