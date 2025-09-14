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
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return { color: "#d97706", backgroundColor: "#fef3c7" };
      case "processing":
        return { color: "#2563eb", backgroundColor: "#dbeafe" };
      case "verified":
        return { color: "#059669", backgroundColor: "#d1fae5" };
      case "completed":
        return { color: "#047857", backgroundColor: "#d1fae5" };
      case "replacement":
        return { color: "#ec4899", backgroundColor: "#fce7f3" };
      default:
        return { color: "#6b7280", backgroundColor: "#f3f4f6" };
    }
  };

  return (
    <div
      style={{
        background: "#ffffff",
        padding: "40px",
        borderRadius: "20px",
        boxShadow: "0 10px 40px rgba(236, 72, 153, 0.15)",
        maxWidth: "800px",
        margin: "0 auto",
        fontFamily: "'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        border: "2px solid #fce7f3",
        lineHeight: "1.6",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "40px",
          paddingBottom: "24px",
          borderBottom: "3px solid #ec4899",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <img
            src="/usa-gaming-logo.jpg"
            alt="USA Gaming Distributor Logo"
            style={{ 
              height: "64px", 
              width: "64px",
              marginRight: "20px", 
              borderRadius: "12px",
              objectFit: "cover",
              border: "2px solid #fce7f3"
            }}
          />
          <div>
            <div
              style={{ 
                fontWeight: "800", 
                fontSize: "28px", 
                color: "#ec4899",
                marginBottom: "4px",
                letterSpacing: "-0.5px"
              }}
            >
              USA Gaming Distributor
            </div>
            <div style={{ fontSize: "14px", color: "#6b7280", marginBottom: "2px" }}>
              📧 support@usagaming.com | 📞 +1-800-123-4567
            </div>
            <div style={{ fontSize: "14px", color: "#6b7280" }}>
              📍 123 Main Street, New York, NY 10001
            </div>
          </div>
        </div>
        
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontSize: "32px",
              fontWeight: "800",
              color: "#1f2937",
              marginBottom: "8px",
              letterSpacing: "-1px"
            }}
          >
            INVOICE
          </div>
          <div
            style={{
              backgroundColor: "#fce7f3",
              color: "#be185d",
              padding: "8px 16px",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "600",
              display: "inline-block"
            }}
          >
            #{order.id.slice(-8).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Invoice Details & Customer Info */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "32px",
          marginBottom: "32px",
        }}
      >
        {/* Bill To */}
        <div>
          <div
            style={{
              fontSize: "18px",
              fontWeight: "700",
              color: "#1f2937",
              marginBottom: "12px",
              borderBottom: "2px solid #fce7f3",
              paddingBottom: "8px"
            }}
          >
            📋 Bill To
          </div>
          <div style={{ fontSize: "16px", fontWeight: "600", color: "#374151", marginBottom: "8px" }}>
            {customer?.name || "Unknown Customer"}
          </div>
          {customer?.contact_numbers && customer.contact_numbers.length > 0 && (
            <div style={{ fontSize: "14px", color: "#6b7280", marginBottom: "4px" }}>
              � {customer.contact_numbers[0]}
            </div>
          )}
          {customer?.contact_numbers && customer.contact_numbers.length > 1 && (
            <div style={{ fontSize: "14px", color: "#6b7280", marginBottom: "4px" }}>
              📞 {customer.contact_numbers[1]}
            </div>
          )}
          <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: "8px" }}>
            Customer ID: {customer?.id.slice(-8).toUpperCase() || "N/A"}
          </div>
        </div>

        {/* Invoice Info */}
        <div>
          <div
            style={{
              fontSize: "18px",
              fontWeight: "700",
              color: "#1f2937",
              marginBottom: "12px",
              borderBottom: "2px solid #fce7f3",
              paddingBottom: "8px"
            }}
          >
            📄 Invoice Details
          </div>
          <div style={{ display: "grid", gap: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "14px", color: "#6b7280", fontWeight: "500" }}>Date:</span>
              <span style={{ fontSize: "14px", fontWeight: "600", color: "#374151" }}>
                {formatDate(order.created_at)}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "14px", color: "#6b7280", fontWeight: "500" }}>Payment Method:</span>
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#374151",
                  backgroundColor: "#fce7f3",
                  padding: "2px 8px",
                  borderRadius: "4px"
                }}
              >
                {order.payment_method}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "14px", color: "#6b7280", fontWeight: "500" }}>Status:</span>
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: getStatusColor(order.status).color,
                  backgroundColor: getStatusColor(order.status).backgroundColor,
                  padding: "2px 8px",
                  borderRadius: "4px"
                }}
              >
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Items Table */}
      <div
        style={{
          marginBottom: "32px",
        }}
      >
        <div
          style={{
            fontSize: "18px",
            fontWeight: "700",
            color: "#1f2937",
            marginBottom: "16px",
            borderBottom: "2px solid #fce7f3",
            paddingBottom: "8px"
          }}
        >
          🛒 Order Items
        </div>
        
        <table
          style={{
            width: "100%",
            fontSize: "14px",
            borderCollapse: "collapse",
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#ec4899", color: "white" }}>
              <th
                style={{
                  padding: "16px 12px",
                  textAlign: "left",
                  fontWeight: "600",
                  fontSize: "14px",
                  letterSpacing: "0.5px"
                }}
              >
                Platform
              </th>
              <th
                style={{
                  padding: "16px 12px",
                  textAlign: "center",
                  fontWeight: "600",
                  fontSize: "14px",
                  letterSpacing: "0.5px"
                }}
              >
                Account Type
              </th>
              <th
                style={{
                  padding: "16px 12px",
                  textAlign: "center",
                  fontWeight: "600",
                  fontSize: "14px",
                  letterSpacing: "0.5px"
                }}
              >
                Qty
              </th>
              <th
                style={{
                  padding: "16px 12px",
                  textAlign: "right",
                  fontWeight: "600",
                  fontSize: "14px",
                  letterSpacing: "0.5px"
                }}
              >
                Unit Price
              </th>
              <th
                style={{
                  padding: "16px 12px",
                  textAlign: "right",
                  fontWeight: "600",
                  fontSize: "14px",
                  letterSpacing: "0.5px"
                }}
              >
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, idx) => {
              const platform = platforms.find((p) => p.platform === item.platform);
              const isEvenRow = idx % 2 === 0;
              return (
                <tr 
                  key={idx}
                  style={{ 
                    backgroundColor: isEvenRow ? "#fdf2f8" : "#ffffff",
                    borderBottom: "1px solid #fce7f3"
                  }}
                >
                  <td
                    style={{
                      padding: "16px 12px",
                      fontWeight: "600",
                      color: "#374151"
                    }}
                  >
                    {item.platform || platform?.platform || "Unknown Platform"}
                  </td>
                  <td
                    style={{
                      padding: "16px 12px",
                      textAlign: "center",
                      color: "#6b7280",
                      fontWeight: "500"
                    }}
                  >
                    <span
                      style={{
                        backgroundColor: "#fce7f3",
                        color: "#be185d",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "600"
                      }}
                    >
                      {platform?.account_type || "Standard"}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "16px 12px",
                      textAlign: "center",
                      fontWeight: "600",
                      color: "#374151"
                    }}
                  >
                    {item.quantity}
                  </td>
                  <td
                    style={{
                      padding: "16px 12px",
                      textAlign: "right",
                      fontWeight: "600",
                      color: "#374151"
                    }}
                  >
                    ${item.unitPrice.toFixed(2)}
                  </td>
                  <td
                    style={{
                      padding: "16px 12px",
                      textAlign: "right",
                      fontWeight: "700",
                      color: "#059669",
                      fontSize: "15px"
                    }}
                  >
                    ${item.total_price.toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Totals */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "32px"
        }}
      >
        <div
          style={{
            backgroundColor: "#fdf2f8",
            padding: "24px",
            borderRadius: "16px",
            border: "2px solid #fce7f3",
            minWidth: "300px"
          }}
        >
          <div
            style={{
              fontSize: "18px",
              fontWeight: "700",
              color: "#1f2937",
              marginBottom: "16px",
              textAlign: "center"
            }}
          >
            💰 Summary
          </div>
          
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
            <span style={{ fontSize: "16px", fontWeight: "500", color: "#6b7280" }}>
              Subtotal:
            </span>
            <span style={{ fontSize: "16px", fontWeight: "600", color: "#374151" }}>
              ${order.total_amount.toFixed(2)}
            </span>
          </div>
          
          {/* {order.discount_amount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
              <span style={{ fontSize: "16px", fontWeight: "500", color: "#dc2626" }}>
                Discount:
            </span>
          </div>
          
          {/* Discount section commented out until discount_amount is available
          {order.discount_amount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
              <span style={{ fontSize: "16px", fontWeight: "500", color: "#dc2626" }}>
                Discount:
              </span>
              <span style={{ fontSize: "16px", fontWeight: "600", color: "#dc2626" }}>
                -${order.discount_amount.toFixed(2)}
              </span>
            </div>
          )}
          */}
          
          <hr style={{ 
            margin: "16px 0", 
            border: "none", 
            borderTop: "2px solid #ec4899",
            opacity: 0.6
          }} />
          
          <div 
            style={{ 
              display: "flex", 
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <span
              style={{
                fontSize: "20px",
                fontWeight: "800",
                color: "#1f2937"
              }}
            >
              Grand Total:
            </span>
            <span
              style={{
                fontSize: "24px",
                fontWeight: "800",
                color: "#ec4899",
                backgroundColor: "white",
                padding: "8px 16px",
                borderRadius: "8px",
                border: "2px solid #ec4899"
              }}
            >
              ${order.total_amount.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Details */}
      {paymentDetails && (
        <div
          style={{
            backgroundColor: "#f8fafc",
            padding: "24px",
            borderRadius: "16px",
            border: "2px solid #e2e8f0",
            marginBottom: "32px"
          }}
        >
          <div
            style={{
              fontSize: "18px",
              fontWeight: "700",
              color: "#1f2937",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center"
            }}
          >
            💳 Payment Information
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <div style={{ fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "8px" }}>
                Payment Method
              </div>
              <div
                style={{
                  fontSize: "14px",
                  color: "#6b7280",
                  backgroundColor: "#fce7f3",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  fontWeight: "600"
                }}
              >
                {paymentDetails.payment_method}
              </div>
            </div>
            
            {paymentDetails.transaction_id && (
              <div>
                <div style={{ fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "8px" }}>
                  Transaction ID
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#6b7280",
                    fontFamily: "monospace",
                    backgroundColor: "#f1f5f9",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    wordBreak: "break-all"
                  }}
                >
                  {paymentDetails.transaction_id}
                </div>
              </div>
            )}
            
            {paymentDetails.crypto_currency && (
              <div>
                <div style={{ fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "8px" }}>
                  Cryptocurrency
                </div>
                <div style={{ fontSize: "14px", color: "#6b7280" }}>
                  {paymentDetails.crypto_currency}
                  {paymentDetails.crypto_network && (
                    <span style={{ color: "#9ca3af" }}> ({paymentDetails.crypto_network})</span>
                  )}
                </div>
              </div>
            )}
            
            {paymentDetails.bank_transaction_reference && (
              <div>
                <div style={{ fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "8px" }}>
                  Bank Reference
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#6b7280",
                    fontFamily: "monospace",
                    backgroundColor: "#f1f5f9",
                    padding: "8px 12px",
                    borderRadius: "8px"
                  }}
                >
                  {paymentDetails.bank_transaction_reference}
                </div>
              </div>
            )}
            
            {paymentDetails.cash_received_by && (
              <div>
                <div style={{ fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "8px" }}>
                  Received By
                </div>
                <div style={{ fontSize: "14px", color: "#6b7280" }}>
                  {paymentDetails.cash_received_by}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Footer */}
      <div
        style={{
          borderTop: "3px solid #ec4899",
          paddingTop: "24px",
          textAlign: "center"
        }}
      >
        <div
          style={{
            backgroundColor: "#fdf2f8",
            padding: "20px",
            borderRadius: "16px",
            border: "2px solid #fce7f3"
          }}
        >
          <div
            style={{
              fontSize: "18px",
              fontWeight: "700",
              color: "#ec4899",
              marginBottom: "8px"
            }}
          >
            🎮 Thank You for Your Purchase!
          </div>
          <div
            style={{
              fontSize: "14px",
              color: "#6b7280",
              marginBottom: "12px",
              lineHeight: "1.6"
            }}
          >
            Your gaming accounts will be delivered within 24 hours.
            <br />
            For any questions or support, please don't hesitate to contact us.
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "24px",
              fontSize: "13px",
              color: "#9ca3af"
            }}
          >
            <div>📧 support@usagaming.com</div>
            <div>📞 +1-800-123-4567</div>
            <div>💬 Live Chat Available 24/7</div>
          </div>
          <div
            style={{
              marginTop: "16px",
              fontSize: "12px",
              color: "#9ca3af",
              fontStyle: "italic"
            }}
          >
            Invoice generated on {formatDate(new Date().toISOString())}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Invoice;
