import React, { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";
import LoadingSpinner from "./LoadingSpinner";
import html2canvas from "html2canvas";
import { Plus, Trash2 } from "lucide-react";
import { useAppSelector } from "../hooks/redux";

interface Customer {
  id: string;
  name: string;
}
interface Coin {
  id: string;
  platform: string;
}
interface OrderItem {
  coin_id: string;
  quantity: number;
  price: number;
}

const paymentMethods = ["Cash", "Card", "Bank Transfer"];

const OrderCreatePanel: React.FC = () => {
  const user = useAppSelector((state) => state.auth.user);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [coins, setCoins] = useState<(Coin & { inventory?: number })[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([
    { coin_id: "", quantity: 1, price: 0 },
  ]);
  const [customerId, setCustomerId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(paymentMethods[0]);
  const [error, setError] = useState<string | null>(null);
  const [itemErrors, setItemErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [copyingId, setCopyingId] = useState<string | null>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [lastOrder, setLastOrder] = useState<any | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: customerData } = await supabase
        .from("customers")
        .select("id, name");
      setCustomers(customerData || []);
      const { data: coinData } = await supabase
        .from("game_coins")
        .select("id, platform, inventory");
      setCoins(coinData || []);
      const { data: ordersData } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      setOrders(ordersData || []);
    };
    fetchData();
  }, []);

  const handleOrderItemChange = (
    idx: number,
    field: keyof OrderItem,
    value: any
  ) => {
    setOrderItems((items) =>
      items.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
    // Validate quantity for this item
    if (field === "quantity" || field === "coin_id") {
      const coinId = field === "coin_id" ? value : orderItems[idx].coin_id;
      const quantity = field === "quantity" ? value : orderItems[idx].quantity;
      const coin = coins.find((c) => c.id === coinId);
      let errors = [...itemErrors];
      if (coin && coin.inventory !== undefined && quantity > coin.inventory) {
        errors[idx] = `Max: ${coin.inventory}`;
      } else {
        errors[idx] = "";
      }
      setItemErrors(errors);
    }
  };

  const handleAddOrderItem = () => {
    setOrderItems([...orderItems, { coin_id: "", quantity: 1, price: 0 }]);
  };

  const handleRemoveOrderItem = (idx: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    let errors: string[] = [];
    if (!user?.id) {
      setError("User not authenticated. Please log in to create an order.");
      setLoading(false);
      return;
    }
    if (
      !customerId ||
      orderItems.some(
        (item) => !item.coin_id || item.quantity < 1 || item.price < 0
      )
    ) {
      setError("Please fill all fields correctly.");
      setLoading(false);
      return;
    }
    // Validate all quantities against inventory before submitting
    orderItems.forEach((item, idx) => {
      const coin = coins.find((c) => c.id === item.coin_id);
      if (
        coin &&
        coin.inventory !== undefined &&
        item.quantity > coin.inventory
      ) {
        errors[idx] = `Max: ${coin.inventory}`;
      } else {
        errors[idx] = "";
      }
    });
    setItemErrors(errors);
    if (errors.some((e) => e)) {
      setError("Please fix quantity errors before confirming.");
      setLoading(false);
      return;
    }
    // Insert order with created_by
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert([
        {
          customer_id: customerId,
          items: orderItems,
          payment_method: paymentMethod,
          status: "Pending",
          created_at: new Date().toISOString(),
          created_by: user?.id || null,
        },
      ])
      .select();
    if (orderError || !orderData || !orderData[0]) {
      setError(
        "Failed to create order: " + (orderError?.message || "Unknown error")
      );
      setLoading(false);
      return;
    }
    setLastOrder(orderData[0]);
    // Update coin inventory in DB
    for (const item of orderItems) {
      const coin = coins.find((c) => c.id === item.coin_id);
      if (coin && coin.inventory !== undefined) {
        const newInventory = coin.inventory - item.quantity;
        await supabase
          .from("game_coins")
          .update({ inventory: newInventory })
          .eq("id", coin.id);
      }
    }
    // Wait for invoice to render
    setTimeout(async () => {
      let invoiceUrl = "";
      if (invoiceRef.current) {
        try {
          const canvas = await html2canvas(invoiceRef.current);
          const blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, "image/png")
          );
          if (blob) {
            const fileName = `invoice-${orderData[0].id}.png`;
            const { error: uploadError, data: uploadData } =
              await supabase.storage
                .from("invoices")
                .upload(fileName, blob, { upsert: true });
            if (uploadError) {
              setError("Invoice upload failed: " + uploadError.message);
              console.error("Invoice upload failed:", uploadError);
            } else if (!uploadData) {
              setError("Invoice upload failed: No data returned.");
              console.error("Invoice upload failed: No data returned.");
            } else {
              const { data: publicData } = supabase.storage
                .from("invoices")
                .getPublicUrl(fileName);
              if (!publicData || !publicData.publicUrl) {
                setError("Invoice public URL failed: No URL returned.");
                console.error("Invoice public URL failed: No URL returned.");
              } else {
                invoiceUrl = publicData.publicUrl;
                // Update order with invoice URL
                const { error: updateError } = await supabase
                  .from("orders")
                  .update({ invoice_url: invoiceUrl })
                  .eq("id", orderData[0].id);
                if (updateError) {
                  setError("Order update error: " + updateError.message);
                  console.error("Order update error:", updateError);
                }
              }
            }
          } else {
            setError("Invoice image generation failed.");
          }
        } catch (err: any) {
          setError("Invoice generation error: " + err.message);
        }
      }
      setOrderItems([{ coin_id: "", quantity: 1, price: 0 }]);
      setCustomerId("");
      setPaymentMethod(paymentMethods[0]);
      setLoading(false);
      setShowModal(false);
      // Refresh orders
      const { data: ordersData } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      setOrders(ordersData || []);
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
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
      )}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backdropFilter: "blur(8px)", background: "rgba(0,0,0,0.2)" }}
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
                      <label className="text-xs mb-1">Coin</label>
                      <select
                        value={item.coin_id}
                        onChange={(e) =>
                          handleOrderItemChange(idx, "coin_id", e.target.value)
                        }
                        className="px-2 py-1 rounded border"
                        required
                      >
                        <option value="">Select coin</option>
                        {coins.map((coin) => (
                          <option key={coin.id} value={coin.id}>
                            {coin.platform}
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
                          handleOrderItemChange(
                            idx,
                            "quantity",
                            Number(e.target.value)
                          )
                        }
                        className="px-2 py-1 rounded border w-20"
                        placeholder="Qty"
                        required
                      />
                      {itemErrors[idx] && (
                        <span className="text-xs text-red-500 mt-1">
                          {itemErrors[idx]}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs mb-1">Price</label>
                      <input
                        type="number"
                        min={0}
                        value={item.price}
                        onChange={(e) =>
                          handleOrderItemChange(
                            idx,
                            "price",
                            Number(e.target.value)
                          )
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
        <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
          <div
            ref={invoiceRef}
            style={{
              background: "#fff",
              padding: 32,
              borderRadius: 16,
              boxShadow: "0 2px 8px #ec4899",
              width: 480,
              fontFamily: "Arial, sans-serif",
              border: "1px solid #e5e7eb",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <img
                src="/usa-gaming-logo.jpg"
                alt="USA Gaming Distributor Logo"
                style={{ height: 48, marginRight: 16, borderRadius: 8 }}
              />
              <div>
                <div
                  style={{ fontWeight: "bold", fontSize: 20, color: "#ec4899" }}
                >
                  USA Gaming Distributor
                </div>
                <div style={{ fontSize: 12, color: "#555" }}>
                  support@usagaming.com | +1-800-123-4567
                </div>
                <div style={{ fontSize: 12, color: "#555" }}>
                  123 Main St, New York, NY
                </div>
              </div>
            </div>
            <hr style={{ margin: "16px 0", borderColor: "#ec4899" }} />
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontWeight: "bold" }}>Invoice #: </span>
              {lastOrder.id}
              <br />
              <span style={{ fontWeight: "bold" }}>Date: </span>
              {new Date(lastOrder.created_at).toLocaleString()}
              <br />
              <span style={{ fontWeight: "bold" }}>Customer: </span>
              {customers.find((c) => c.id === lastOrder.customer_id)?.name ||
                lastOrder.customer_id}
              <br />
              <span style={{ fontWeight: "bold" }}>Payment Method: </span>
              {lastOrder.payment_method}
            </div>
            <table
              style={{
                width: "100%",
                fontSize: 13,
                borderCollapse: "collapse",
                marginBottom: 16,
              }}
            >
              <thead>
                <tr style={{ background: "#f3f4f6" }}>
                  <th
                    style={{
                      border: "1px solid #e5e7eb",
                      padding: "8px",
                      textAlign: "left",
                    }}
                  >
                    Coin
                  </th>
                  <th
                    style={{
                      border: "1px solid #e5e7eb",
                      padding: "8px",
                      textAlign: "right",
                    }}
                  >
                    Quantity
                  </th>
                  <th
                    style={{
                      border: "1px solid #e5e7eb",
                      padding: "8px",
                      textAlign: "right",
                    }}
                  >
                    Unit Price
                  </th>
                  <th
                    style={{
                      border: "1px solid #e5e7eb",
                      padding: "8px",
                      textAlign: "right",
                    }}
                  >
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(lastOrder.items) &&
                  lastOrder.items.map((item: any, idx: number) => {
                    const coinName =
                      coins.find((coin) => coin.id === item.coin_id)
                        ?.platform || item.coin_id;
                    const total = Number(item.price) * Number(item.quantity);
                    return (
                      <tr key={idx}>
                        <td
                          style={{
                            border: "1px solid #e5e7eb",
                            padding: "8px",
                          }}
                        >
                          {coinName}
                        </td>
                        <td
                          style={{
                            border: "1px solid #e5e7eb",
                            padding: "8px",
                            textAlign: "right",
                          }}
                        >
                          {item.quantity}
                        </td>
                        <td
                          style={{
                            border: "1px solid #e5e7eb",
                            padding: "8px",
                            textAlign: "right",
                          }}
                        >
                          ${item.price}
                        </td>
                        <td
                          style={{
                            border: "1px solid #e5e7eb",
                            padding: "8px",
                            textAlign: "right",
                          }}
                        >
                          ${total}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
            <div
              style={{
                textAlign: "right",
                fontWeight: "bold",
                fontSize: 16,
                marginBottom: 8,
              }}
            >
              Grand Total: $
              {Array.isArray(lastOrder.items)
                ? lastOrder.items.reduce(
                    (sum: number, item: any) =>
                      sum + Number(item.price) * Number(item.quantity),
                    0
                  )
                : 0}
            </div>
            <hr style={{ margin: "16px 0", borderColor: "#ec4899" }} />
            <div
              style={{
                fontSize: 12,
                color: "#555",
                textAlign: "center",
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
              <th className="py-2 px-3 text-left w-56">Items</th>
              <th className="py-2 px-3 text-left w-32">Payment</th>
              <th className="py-2 px-3 text-left w-24">Status</th>
              <th className="py-2 px-3 text-left w-40">Created At</th>
              <th className="py-2 px-3 text-left w-32">Invoice</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b hover:bg-pink-50">
                <td className="py-2 px-3 font-medium">
                  {customers.find((c) => c.id === order.customer_id)?.name ||
                    order.customer_id}
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
                        {order.items.map((item: any, idx: number) => (
                          <tr key={idx}>
                            <td className="px-1 py-1 font-semibold">
                              {coins.find((coin) => coin.id === item.coin_id)
                                ?.platform || item.coin_id}
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
                <td className="py-2 px-3">{order.status}</td>
                <td className="py-2 px-3">
                  {new Date(order.created_at).toLocaleString()}
                </td>
                <td className="py-2 px-3">
                  {order.invoice_url ? (
                    <div className="flex items-center gap-2">
                      <a
                        href={order.invoice_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-500 underline font-semibold"
                        title="View Invoice"
                      >
                        Invoice
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
                              let permission = "granted";
                              if (navigator.permissions) {
                                try {
                                  const result =
                                    await navigator.permissions.query({
                                      name: "clipboard-write" as PermissionName,
                                    });
                                  permission = result.state;
                                } catch {}
                              }
                              if (permission !== "granted") {
                                alert(
                                  "Clipboard access is not enabled. Please allow clipboard permissions for this site in your browser settings."
                                );
                                setCopyingId(null);
                                return;
                              }
                              const response = await fetch(order.invoice_url);
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
                  ) : (
                    <span className="text-gray-400">No Invoice</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderCreatePanel;
