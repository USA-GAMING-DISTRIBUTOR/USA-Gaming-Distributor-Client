import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

interface Order {
  id: string;
  customer_id: string;
  customer: { name: string } | null;
  items: {
    coin_id: string;
    coin_name?: string;
    quantity: number;
    price: number;
  }[];
  payment_method: string;
  invoice_url?: string;
  status: string;
  created_at: string;
  created_by?: string;
}

const OrderVerificationPanel: React.FC = () => {
  // Edit modal state and handlers
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [editModal, setEditModal] = useState(false);

  const handleEditClick = (order: Order) => {
    setEditOrder(order);
    setEditModal(true);
  };

  const handleEditChange = (field: keyof Order, value: any) => {
    if (!editOrder) return;
    setEditOrder({ ...editOrder, [field]: value });
  };

  const handleEditSave = async () => {
    if (!editOrder) return;
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("orders")
      .update({
        customer_id: editOrder.customer_id,
        items: editOrder.items,
        payment_method: editOrder.payment_method,
        status: editOrder.status,
      })
      .eq("id", editOrder.id);
    if (error) {
      setError("Failed to update order: " + error.message);
      setLoading(false);
      return;
    }
    setEditModal(false);
    setEditOrder(null);
    fetchOrders();
    setLoading(false);
  };
  const [orders, setOrders] = useState<Order[]>([]);
  // ...existing code...
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>(
    []
  );
  const [coins, setCoins] = useState<{ id: string; platform: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifyId, setVerifyId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    // Fetch orders and join customers for name
    const { data, error: fetchError } = await supabase
      .from("orders")
      .select(
        "id, customer_id, items, payment_method, status, created_at, invoice_url, created_by, customers(name)"
      );
    // Fetch all coins to map coin_id to coin_name
    const { data: coinsData } = await supabase
      .from("game_coins")
      .select("id, platform");
    setCoins(coinsData || []);
    // Fetch all customers to map customer_id to customer name
    const { data: customersData } = await supabase
      .from("customers")
      .select("id, name");
    setCustomers(customersData || []);
    // Fetch all users to map created_by to username
    const { data: usersData } = await supabase
      .from("users")
      .select("id, username");
    // Map coin_id to coin_name in items and customer_id to customer name
    const mapped = (data || []).map((order: any) => ({
      ...order,
      customer: customersData?.find((c: any) => c.id === order.customer_id) || {
        name: order.customer_id,
      },
      items: Array.isArray(order.items)
        ? order.items.map((item: any) => ({
            ...item,
            coin_name:
              coinsData?.find((c: any) => c.id === item.coin_id)?.platform ||
              item.coin_id,
          }))
        : [],
      created_by_name:
        usersData?.find((u: any) => u.id === order.created_by)?.username ||
        order.created_by ||
        "-",
    }));
    setOrders(mapped);
    if (fetchError) {
      setError("Failed to fetch orders: " + fetchError.message);
      setLoading(false);
      return;
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleVerifyClick = (id: string) => {
    setVerifyId(id);
    setShowModal(true);
  };

  const handleVerifyOrder = async () => {
    if (!verifyId) return;
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("orders")
      .update({ status: "verified" })
      .eq("id", verifyId);
    if (error) {
      setError("Failed to verify order: " + error.message);
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
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full table-auto text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="py-2 px-3 text-left w-24">Order ID</th>
              <th className="py-2 px-3 text-left w-32">Customer</th>
              <th className="py-2 px-3 text-left w-56">Items</th>
              <th className="py-2 px-3 text-left w-24">Payment Method</th>
              <th className="py-2 px-3 text-left w-20">Status</th>
              <th className="py-2 px-3 text-left w-32">Created By</th>
              <th className="py-2 px-3 text-left w-32">Created At</th>
              <th className="py-2 px-3 text-left w-24">Invoice</th>
              <th className="py-2 px-3 text-left w-24">Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b hover:bg-pink-50">
                <td className="py-2 px-3 font-medium">{order.id}</td>
                <td className="py-2 px-3 font-medium">
                  {order.customer?.name || order.customer_id}
                </td>
                <td className="py-2 px-3">
                  {Array.isArray(order.items) ? (
                    <table className="w-full text-xs bg-white rounded shadow">
                      <thead>
                        <tr>
                          <th className="px-1 py-1 text-left w-20">Coin</th>
                          <th className="px-1 py-1 text-left w-12">Quantity</th>
                          <th className="px-1 py-1 text-left w-16">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-1 py-1 font-semibold">
                              {item.coin_name}
                            </td>
                            <td className="px-1 py-1">{item.quantity}</td>
                            <td className="px-1 py-1">${item.price}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : null}
                </td>
                <td className="py-2 px-3">{order.payment_method}</td>
                <td className="py-2 px-3">
                  {order.status === "verified" ? (
                    <span className="text-green-600 font-semibold">
                      Verified
                    </span>
                  ) : (
                    <span className="text-yellow-600 font-semibold">
                      Pending
                    </span>
                  )}
                </td>
                <td className="py-2 px-3">{order.created_by}</td>
                <td className="py-2 px-3">
                  {new Date(order.created_at).toLocaleString()}
                </td>
                <td className="py-2 px-3">
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
                <td className="py-2 px-3 flex gap-2">
                  {order.status !== "verified" && (
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
                      backdropFilter: "blur(8px)",
                      background: "rgba(0,0,0,0.2)",
                    }}
                  >
                    <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-2xl">
                      <h3 className="text-lg font-semibold mb-4">Edit Order</h3>
                      <div className="mb-4">
                        <label className="block mb-2 font-medium">
                          Customer
                        </label>
                        <select
                          value={editOrder.customer_id}
                          onChange={(e) =>
                            handleEditChange("customer_id", e.target.value)
                          }
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
                              <th className="px-2 py-1 text-left">Coin</th>
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
                                    <option value="">Select Coin</option>
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
                                      newItems[idx].quantity = Number(
                                        e.target.value
                                      );
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
                                      newItems[idx].price = Number(
                                        e.target.value
                                      );
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
                                      const newItems = editOrder.items.filter(
                                        (_, i) => i !== idx
                                      );
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
                              items: [
                                ...editOrder.items,
                                { coin_id: "", quantity: 1, price: 0 },
                              ],
                            });
                          }}
                        >
                          Add Item
                        </button>
                      </div>
                      <div className="mb-4">
                        <label className="block mb-2 font-medium">
                          Payment Method
                        </label>
                        <input
                          type="text"
                          value={editOrder.payment_method}
                          onChange={(e) =>
                            handleEditChange("payment_method", e.target.value)
                          }
                          className="w-full px-3 py-2 rounded-lg border"
                        />
                      </div>
                      <div className="mb-4">
                        <label className="block mb-2 font-medium">Status</label>
                        <select
                          value={editOrder.status}
                          onChange={(e) =>
                            handleEditChange("status", e.target.value)
                          }
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
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backdropFilter: "blur(8px)", background: "rgba(0,0,0,0.2)" }}
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
    </div>
  );
};

export default OrderVerificationPanel;
