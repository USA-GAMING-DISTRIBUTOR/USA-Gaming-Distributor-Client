import React from "react";
import type { Order } from "../types/order";
import type { Customer } from "../types/customer";
import type { Platform } from "../types/platform";

interface InvoiceProps {
  order: Order;
  customer: Customer | null;
  platforms: Platform[];
  paymentDetails?: {
    payment_method: string;
    transaction_id?: string;
    amount: number;
    currency: string;
    crypto_currency?: string;
    crypto_network?: string;
    bank_transaction_reference?: string;
    cash_received_by?: string;
    [key: string]: unknown;
  };
}

const Invoice: React.FC<InvoiceProps> = ({ order, customer, platforms, paymentDetails }) => {
  return (
    <div
      style={{
        background: "#fff",
        padding: 32,
        borderRadius: 16,
        boxShadow: "0 2px 8px #9333ea",
        width: 480,
        fontFamily: "Arial, sans-serif",
        border: "1px solid #e5e7eb",
      }}
    >
      {/* Header */}
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
            style={{ fontWeight: "bold", fontSize: 20, color: "#9333ea" }}
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
      
      <hr style={{ margin: "16px 0", borderColor: "#9333ea" }} />
      
      {/* Invoice Info */}
      <div style={{ marginBottom: 12 }}>
        <span style={{ fontWeight: "bold" }}>Invoice #: </span>
        {order.id.slice(-8)}
        <br />
        <span style={{ fontWeight: "bold" }}>Date: </span>
        {order.created_at ? new Date(order.created_at).toLocaleString() : "N/A"}
        <br />
        <span style={{ fontWeight: "bold" }}>Customer: </span>
        {customer?.name || "Unknown Customer"}
        <br />
        <span style={{ fontWeight: "bold" }}>Payment Method: </span>
        {order.payment_method}
      </div>
      
      {/* Items Table */}
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
              Platform
            </th>
            <th
              style={{
                border: "1px solid #e5e7eb",
                padding: "8px",
                textAlign: "center",
              }}
            >
              Account Type
            </th>
            <th
              style={{
                border: "1px solid #e5e7eb",
                padding: "8px",
                textAlign: "right",
              }}
            >
              Qty
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
          {order.items.map((item, idx) => {
            const platform = platforms.find((p) => p.id === item.platform_id);
            return (
              <tr key={idx}>
                <td
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "8px",
                  }}
                >
                  {item.platform_name || platform?.platform_name || "Unknown Platform"}
                </td>
                <td
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "8px",
                    textAlign: "center",
                  }}
                >
                  {item.account_type}
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
                  ${item.unit_price.toFixed(2)}
                </td>
                <td
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "8px",
                    textAlign: "right",
                  }}
                >
                  ${item.total_price.toFixed(2)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      {/* Totals */}
      <div style={{ textAlign: "right", marginBottom: 16 }}>
        <div style={{ fontSize: 14, marginBottom: 4 }}>
          <span style={{ fontWeight: "bold" }}>Subtotal: </span>
          ${order.total_amount.toFixed(2)}
        </div>
        {order.discount_amount > 0 && (
          <div style={{ fontSize: 14, marginBottom: 4, color: "#dc2626" }}>
            <span style={{ fontWeight: "bold" }}>Discount: </span>
            -${order.discount_amount.toFixed(2)}
          </div>
        )}
        <div
          style={{
            fontSize: 16,
            fontWeight: "bold",
            color: "#9333ea",
            borderTop: "1px solid #e5e7eb",
            paddingTop: 8,
          }}
        >
          Grand Total: ${order.final_amount.toFixed(2)}
        </div>
      </div>
      
      {/* Payment Details Summary */}
      {paymentDetails && (
        <div style={{ marginBottom: 16, fontSize: 12, color: "#555" }}>
          <div style={{ fontWeight: "bold", marginBottom: 4 }}>Payment Details:</div>
          <div>Method: {paymentDetails.payment_method}</div>
          {paymentDetails.transaction_id && (
            <div>Transaction ID: {paymentDetails.transaction_id}</div>
          )}
          {paymentDetails.crypto_currency && (
            <div>Currency: {paymentDetails.crypto_currency} ({paymentDetails.crypto_network})</div>
          )}
          {paymentDetails.bank_transaction_reference && (
            <div>Reference: {paymentDetails.bank_transaction_reference}</div>
          )}
          {paymentDetails.cash_received_by && (
            <div>Received by: {paymentDetails.cash_received_by}</div>
          )}
        </div>
      )}
      
      {/* Footer */}
      <hr style={{ margin: "16px 0", borderColor: "#9333ea" }} />
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
  );
};

export default Invoice;
