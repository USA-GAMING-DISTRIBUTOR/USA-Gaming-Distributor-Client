import React, { useEffect, useState, useRef } from "react";
import LoadingSpinner from "./LoadingSpinner";
import html2canvas from "html2canvas";
import { supabase } from "../lib/supabase";
import { Plus, Trash2 } from "lucide-react";

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
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [coins, setCoins] = useState<Coin[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([{ coin_id: "", quantity: 1, price: 0 }]);
  const [customerId, setCustomerId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(paymentMethods[0]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [lastOrder, setLastOrder] = useState<any | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: customerData } = await supabase.from("customers").select("id, name");
      setCustomers(customerData || []);
      const { data: coinData } = await supabase.from("game_coins").select("id, platform");
      setCoins(coinData || []);
      const { data: ordersData } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      setOrders(ordersData || []);
    };
    fetchData();
  }, []);

  const handleOrderItemChange = (idx: number, field: keyof OrderItem, value: any) => {
    setOrderItems((items) =>
      items.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
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
    if (!customerId || orderItems.some((item) => !item.coin_id || item.quantity < 1 || item.price < 0)) {
      setError("Please fill all fields correctly.");
      setLoading(false);
      return;
    }
    // Insert order
    const { data: orderData, error: orderError } = await supabase.from("orders").insert([
      {
        customer_id: customerId,
        items: orderItems,
        payment_method: paymentMethod,
        status: "Pending",
        created_at: new Date().toISOString(),
      },
    ]).select();
    if (orderError || !orderData || !orderData[0]) {
      setError("Failed to create order: " + (orderError?.message || "Unknown error"));
      setLoading(false);
      return;
    }
    setLastOrder(orderData[0]);
    // Wait for invoice to render
    setTimeout(async () => {
      let invoiceUrl = "";
      if (invoiceRef.current) {
        try {
          const canvas = await html2canvas(invoiceRef.current);
          const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
          if (blob) {
            const fileName = `invoice-${orderData[0].id}.png`;
            const { error: uploadError, data: uploadData } = await supabase.storage.from("invoices").upload(fileName, blob, { upsert: true });
            if (uploadError) {
              setError("Invoice upload failed: " + uploadError.message);
              console.error("Invoice upload failed:", uploadError);
            } else if (!uploadData) {
              setError("Invoice upload failed: No data returned.");
              console.error("Invoice upload failed: No data returned.");
            } else {
              const { data: publicData } = supabase.storage.from("invoices").getPublicUrl(fileName);
              if (!publicData || !publicData.publicUrl) {
                setError("Invoice public URL failed: No URL returned.");
                console.error("Invoice public URL failed: No URL returned.");
              } else {
                invoiceUrl = publicData.publicUrl;
                // Update order with invoice URL
                const { error: updateError } = await supabase.from("orders").update({ invoice_url: invoiceUrl }).eq("id", orderData[0].id);
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
      alert("Order created successfully!");
      // Refresh orders
      const { data: ordersData } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
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
      <h2 className="text-lg font-semibold mb-4">Create Order</h2>
      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ...existing form code... */}
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
              <option key={c.id} value={c.id}>{c.name}</option>
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
                  onChange={(e) => handleOrderItemChange(idx, "coin_id", e.target.value)}
                  className="px-2 py-1 rounded border"
                  required
                >
                  <option value="">Select coin</option>
                  {coins.map((coin) => (
                    <option key={coin.id} value={coin.id}>{coin.platform}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-xs mb-1">Quantity</label>
                <input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => handleOrderItemChange(idx, "quantity", Number(e.target.value))}
                  className="px-2 py-1 rounded border w-20"
                  placeholder="Qty"
                  required
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs mb-1">Price</label>
                <input
                  type="number"
                  min={0}
                  value={item.price}
                  onChange={(e) => handleOrderItemChange(idx, "price", Number(e.target.value))}
                  className="px-2 py-1 rounded border w-24"
                  placeholder="Price"
                  required
                />
              </div>
              <button type="button" className="p-1 text-red-500 hover:bg-red-50 rounded mt-5" onClick={() => handleRemoveOrderItem(idx)}>
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button type="button" className="bg-pink-500 text-white px-3 py-1 rounded flex items-center" onClick={handleAddOrderItem}>
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
              <option key={pm} value={pm}>{pm}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="bg-pink-500 text-white px-6 py-2 rounded-lg font-medium" disabled={loading}>
          Submit Order
        </button>
      </form>

      {/* Hidden Invoice for html2canvas */}
      {lastOrder && (
        <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
          <div ref={invoiceRef} style={{ background: '#fff', padding: 32, borderRadius: 16, boxShadow: '0 2px 8px #ec4899', width: 400 }}>
            <h2 style={{ color: '#ec4899', fontWeight: 'bold', fontSize: 22, marginBottom: 8 }}>Invoice</h2>
            <div className="mb-2">Order ID: {lastOrder.id}</div>
            <div className="mb-2">Customer: {customers.find(c => c.id === lastOrder.customer_id)?.name || lastOrder.customer_id}</div>
            <div className="mb-2">Payment: {lastOrder.payment_method}</div>
            <div className="mb-2">Date: {new Date(lastOrder.created_at).toLocaleString()}</div>
            <table className="w-full text-xs mb-2">
              <thead>
                <tr>
                  <th className="px-2 py-1 text-left">Coin</th>
                  <th className="px-2 py-1 text-left">Quantity</th>
                  <th className="px-2 py-1 text-left">Price</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(lastOrder.items) && lastOrder.items.map((item: any, idx: number) => (
                  <tr key={idx}>
                    <td className="px-2 py-1">{coins.find(coin => coin.id === item.coin_id)?.platform || item.coin_id}</td>
                    <td className="px-2 py-1">{item.quantity}</td>
                    <td className="px-2 py-1">${item.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="font-bold">Total: ${Array.isArray(lastOrder.items) ? lastOrder.items.reduce((sum: number, item: any) => sum + Number(item.price) * Number(item.quantity), 0) : 0}</div>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <h2 className="text-lg font-semibold mt-10 mb-4">Orders</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="py-2 px-4 text-left">Customer</th>
              <th className="py-2 px-4 text-left">Items</th>
              <th className="py-2 px-4 text-left">Payment</th>
              <th className="py-2 px-4 text-left">Status</th>
              <th className="py-2 px-4 text-left">Created At</th>
              <th className="py-2 px-4 text-left">Invoice</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b hover:bg-gray-50">
                <td className="py-2 px-4">{customers.find(c => c.id === order.customer_id)?.name || order.customer_id}</td>
                <td className="py-2 px-4">
                  {Array.isArray(order.items)
                    ? (
                        <table className="w-full text-xs">
                          <thead>
                            <tr>
                              <th className="px-2 py-1 text-left">Coin</th>
                              <th className="px-2 py-1 text-left">Quantity</th>
                              <th className="px-2 py-1 text-left">Price</th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.items.map((item: any, idx: number) => (
                              <tr key={idx}>
                                <td className="px-2 py-1">{coins.find(coin => coin.id === item.coin_id)?.platform || item.coin_id}</td>
                                <td className="px-2 py-1">{item.quantity}</td>
                                <td className="px-2 py-1">${item.price}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )
                    : null}
                </td>
                <td className="py-2 px-4">{order.payment_method}</td>
                <td className="py-2 px-4">{order.status}</td>
                <td className="py-2 px-4">{new Date(order.created_at).toLocaleString()}</td>
                <td className="py-2 px-4">
                  {order.invoice_url ? (
                    <a href={order.invoice_url} target="_blank" rel="noopener noreferrer" className="text-pink-500 underline" title="View Invoice">Invoice</a>
                    ) : (
                    <span className="text-gray-400">No Invoice</span>
                  )}
                  {order.invoice_url && (
                    <button
                      className="ml-2 px-2 py-1 bg-gray-100 rounded text-xs text-gray-700 border"
                      onClick={() => navigator.clipboard.writeText(order.invoice_url)}
                    >Copy URL</button>
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
