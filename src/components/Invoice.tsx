import React from 'react';
import { formatCurrency, formatNumber } from '../utils/format';
import type { Order } from '../types/order';
import type { Customer } from '../types/customer';
import type { Platform } from '../types/platform';

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
    crypto_username?: string;
    crypto_wallet_address?: string;
    crypto_transaction_hash?: string;
    bank_transaction_reference?: string;
    bank_sender_name?: string;
    bank_sender_bank?: string;
    bank_purpose?: string;
    bank_transaction_type?: string;
    bank_transaction_time?: string;
    bank_amount_in_currency?: string;
    bank_exchange_rate?: string;
    cash_received_by?: string;
    cash_receipt_number?: string;
    notes?: string;
    created_at?: string;
  };
}

const Invoice: React.FC<InvoiceProps> = ({ order, customer, platforms, paymentDetails }) => {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      style={{
        background: '#ffffff',
        padding: '40px',
        borderRadius: '20px',
        boxShadow: '0 10px 40px rgba(236, 72, 153, 0.15)',
        maxWidth: '800px',
        margin: '0 auto',
        fontFamily: "'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        border: '2px solid #fce7f3',
        lineHeight: '1.6',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '40px',
          paddingBottom: '24px',
          borderBottom: '3px solid #ec4899',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img
            src="/usa-gaming-logo.jpg"
            alt="USA Gaming Distributor Logo"
            style={{
              height: '64px',
              width: '64px',
              marginRight: '20px',
              borderRadius: '12px',
              objectFit: 'cover',
              border: '2px solid #fce7f3',
              flexShrink: 0,
            }}
          />
          <div>
            <div
              style={{
                fontWeight: '800',
                fontSize: '28px',
                color: '#ec4899',
                marginBottom: '4px',
                letterSpacing: '-0.5px',
              }}
            >
              USA Gaming Distributor
            </div>
            <div
              style={{
                fontSize: '14px',
                color: '#6b7280',
                marginBottom: '8px',
                lineHeight: 1.5,
              }}
            >
              📧 USAGamingDistributor@gmail.com | 📞 +1 (347) 690-3982
            </div>
            <div
              style={{
                fontSize: '14px',
                color: '#6b7280',
                display: 'block',
                height: '18px',
                lineHeight: '28px',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: '16px',
                  height: '16px',
                  verticalAlign: 'middle',
                  marginTop: '1px',
                  marginRight: '4px',
                  lineHeight: '18px',
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 1219.547 1225.016"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ display: 'block', width: '100%', height: '100%' }}
                  aria-hidden="true"
                >
                  <path
                    fill="#E0E0E0"
                    d="M1041.858 178.02C927.206 63.289 774.753.07 612.325 0 277.617 0 5.232 272.298 5.098 606.991c-.039 106.986 27.915 211.42 81.048 303.476L0 1225.016l321.898-84.406c88.689 48.368 188.547 73.855 290.166 73.896h.258.003c334.654 0 607.08-272.346 607.222-607.023.056-162.208-63.052-314.724-177.689-429.463zm-429.533 933.963h-.197c-90.578-.048-179.402-24.366-256.878-70.339l-18.438-10.93-191.021 50.083 51-186.176-12.013-19.087c-50.525-80.336-77.198-173.175-77.16-268.504.111-278.186 226.507-504.503 504.898-504.503 134.812.056 261.519 52.604 356.814 147.965 95.289 95.36 147.728 222.128 147.688 356.948-.118 278.195-226.522 504.543-504.693 504.543z"
                  />
                  <linearGradient
                    id="whatsapp-grad"
                    x1="609.77"
                    x2="609.77"
                    y1="1190.114"
                    y2="21.084"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop offset="0" stopColor="#20b038"></stop>
                    <stop offset="1" stopColor="#60d66a"></stop>
                  </linearGradient>
                  <path
                    fill="url(#whatsapp-grad)"
                    d="M27.875 1190.114l82.211-300.18c-50.719-87.852-77.391-187.523-77.359-289.602.133-319.398 260.078-579.25 579.469-579.25 155.016.07 300.508 60.398 409.898 169.891 109.414 109.492 169.633 255.031 169.57 409.812-.133 319.406-260.094 579.281-579.445 579.281-.023 0 .016 0 0 0h-.258c-96.977-.031-192.266-24.375-276.898-70.5l-307.188 80.548z"
                  />
                  <path
                    fill="#FFF"
                    fillRule="evenodd"
                    d="M462.273 349.294c-11.234-24.977-23.062-25.477-33.75-25.914-8.742-.375-18.75-.352-28.742-.352-10 0-26.25 3.758-39.992 18.766-13.75 15.008-52.5 51.289-52.5 125.078 0 73.797 53.75 145.102 61.242 155.117 7.5 10 103.758 166.266 256.203 226.383 126.695 49.961 152.477 40.023 179.977 37.523s88.734-36.273 101.234-71.297c12.5-35.016 12.5-65.031 8.75-71.305-3.75-6.25-13.75-10-28.75-17.5s-88.734-43.789-102.484-48.789-23.75-7.5-33.75 7.516c-10 15-38.727 48.773-47.477 58.773-8.75 10.023-17.5 11.273-32.5 3.773-15-7.523-63.305-23.344-120.609-74.438-44.586-39.75-74.688-88.844-83.438-103.859-8.75-15-.938-23.125 6.586-30.602 6.734-6.719 15-17.508 22.5-26.266 7.484-8.758 9.984-15.008 14.984-25.008 5-10.016 2.5-18.773-1.25-26.273s-32.898-81.67-46.234-111.326z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <span
                style={{
                  display: 'inline-block',
                  lineHeight: '28px',
                  verticalAlign: 'top',
                  marginRight: '12px',
                }}
              >
                +1 (347) 690-3982
              </span>
              <span
                style={{
                  display: 'inline-block',
                  margin: '0 12px 0 0',
                  lineHeight: '28px',
                  verticalAlign: 'middle',
                }}
              >
                |
              </span>
              <span
                style={{
                  display: 'inline-block',
                  width: '16px',
                  height: '16px',
                  verticalAlign: 'middle',
                  marginTop: '1px',
                  marginRight: '4px',
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 1024 1024"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ display: 'block', width: '100%', height: '100%' }}
                  aria-hidden="true"
                >
                  <path
                    fill="#1877f2"
                    d="M1024,512C1024,229.23016,794.76978,0,512,0S0,229.23016,0,512c0,255.554,187.231,467.37012,432,505.77777V660H302V512H432V399.2C432,270.87982,508.43854,200,625.38922,200C681.40765,200,740,210,740,210V336H675.43713C611.83508,336,592,375.46667,592,415.95728V512H734L711.3,660H592v357.77777C836.769,979.37012,1024,767.554,1024,512Z"
                  />
                  <path
                    fill="#fff"
                    d="M711.3,660,734,512H592V415.95728C592,375.46667,611.83508,336,675.43713,336H740V210s-58.59235-10-114.61078-10C508.43854,200,432,270.87982,432,399.2V512H302V660H432v357.77777a517.39619,517.39619,0,0,0,160,0V660Z"
                  />
                </svg>
              </span>
              <a
                style={{
                  color: '#ec4899',
                  textDecoration: 'underline',
                  display: 'inline-block',
                  lineHeight: '28px',
                  verticalAlign: 'top',
                }}
                href="https://www.facebook.com/USAGamingDistributor"
              >
                www.facebook.com/USAGamingDistributor
              </a>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              fontSize: '32px',
              fontWeight: '800',
              color: '#1f2937',
              marginBottom: '8px',
              letterSpacing: '-1px',
            }}
          >
            INVOICE
          </div>
          <div
            style={{
              backgroundColor: '#fce7f3',
              color: '#be185d',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              display: 'inline-block',
            }}
          >
            #{order.id.slice(-8).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Invoice Details & Customer Info */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '32px',
          marginBottom: '32px',
        }}
      >
        {/* Bill To */}
        <div>
          <div
            style={{
              fontSize: '18px',
              fontWeight: '700',
              color: '#1f2937',
              marginBottom: '12px',
              borderBottom: '2px solid #fce7f3',
              paddingBottom: '8px',
            }}
          >
            📋 Bill To
          </div>
          <div
            style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px',
            }}
          >
            {customer?.name || 'Unknown Customer'}
          </div>
          {customer?.contact_numbers && customer.contact_numbers.length > 0 && (
            <>
              {customer.contact_numbers.map((num, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    marginBottom: '4px',
                  }}
                >
                  📞 {num}
                </div>
              ))}
            </>
          )}
          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>
            Customer ID: {customer?.id.slice(-8).toUpperCase() || 'N/A'}
          </div>
        </div>

        {/* Invoice Info */}
        <div>
          <div
            style={{
              fontSize: '18px',
              fontWeight: '700',
              color: '#1f2937',
              marginBottom: '12px',
              borderBottom: '2px solid #fce7f3',
              paddingBottom: '8px',
            }}
          >
            📄 Invoice Details
          </div>
          <div style={{ display: 'grid', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span
                style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  fontWeight: '500',
                }}
              >
                Date:
              </span>
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                }}
              >
                {formatDate(order.created_at)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span
                style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  fontWeight: '500',
                }}
              >
                Payment Method:
              </span>
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  backgroundColor: '#fce7f3',
                  padding: '2px 8px',
                  borderRadius: '4px',
                }}
              >
                {order.payment_method}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div
        style={{
          marginBottom: '32px',
        }}
      >
        <div
          style={{
            fontSize: '18px',
            fontWeight: '700',
            color: '#1f2937',
            marginBottom: '16px',
            borderBottom: '2px solid #fce7f3',
            paddingBottom: '8px',
          }}
        >
          🛒 Order Items
        </div>

        <table
          style={{
            width: '100%',
            fontSize: '14px',
            borderCollapse: 'collapse',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
          }}
        >
          <thead>
            <tr style={{ backgroundColor: '#ec4899', color: 'white' }}>
              <th
                style={{
                  padding: '16px 12px',
                  textAlign: 'left',
                  fontWeight: '600',
                  fontSize: '14px',
                  letterSpacing: '0.5px',
                }}
              >
                Platform
              </th>
              <th
                style={{
                  padding: '16px 12px',
                  textAlign: 'left',
                  fontWeight: '600',
                  fontSize: '14px',
                  letterSpacing: '0.5px',
                }}
              >
                Username
              </th>
              <th
                style={{
                  padding: '16px 12px',
                  textAlign: 'center',
                  fontWeight: '600',
                  fontSize: '14px',
                  letterSpacing: '0.5px',
                }}
              >
                Qty
              </th>
              <th
                style={{
                  padding: '16px 12px',
                  textAlign: 'right',
                  fontWeight: '600',
                  fontSize: '14px',
                  letterSpacing: '0.5px',
                }}
              >
                Per Coin Price
              </th>
              <th
                style={{
                  padding: '16px 12px',
                  textAlign: 'right',
                  fontWeight: '600',
                  fontSize: '14px',
                  letterSpacing: '0.5px',
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
                    backgroundColor: isEvenRow ? '#fdf2f8' : '#ffffff',
                    borderBottom: '1px solid #fce7f3',
                  }}
                >
                  <td
                    style={{
                      padding: '16px 12px',
                      fontWeight: '600',
                      color: '#374151',
                    }}
                  >
                    {item.platform || platform?.platform || 'Unknown Platform'}
                  </td>
                  <td
                    style={{
                      padding: '16px 12px',
                      fontWeight: '500',
                      color: '#6b7280',
                    }}
                  >
                    {item.username ? (
                      <span
                        style={{
                          backgroundColor: '#dbeafe',
                          color: '#1e40af',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                          display: 'inline-flex',
                          alignItems: 'center',
                        }}
                      >
                        👤 {item.username}
                      </span>
                    ) : (
                      <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>No username</span>
                    )}
                  </td>
                  <td
                    style={{
                      padding: '16px 12px',
                      textAlign: 'center',
                      fontWeight: '600',
                      color: '#374151',
                    }}
                  >
                    {formatNumber(item.quantity)}
                  </td>
                  <td
                    style={{
                      padding: '16px 12px',
                      textAlign: 'right',
                      fontWeight: '600',
                      color: '#374151',
                    }}
                  >
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td
                    style={{
                      padding: '16px 12px',
                      textAlign: 'right',
                      fontWeight: '700',
                      color: '#059669',
                      fontSize: '15px',
                    }}
                  >
                    {formatCurrency(item.total_price)}
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
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: '32px',
        }}
      >
        <div
          style={{
            backgroundColor: '#fdf2f8',
            padding: '24px',
            borderRadius: '16px',
            border: '2px solid #fce7f3',
            minWidth: '300px',
          }}
        >
          <div
            style={{
              fontSize: '18px',
              fontWeight: '700',
              color: '#1f2937',
              marginBottom: '16px',
              textAlign: 'center',
            }}
          >
            💰 Summary
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '12px',
            }}
          >
            <span style={{ fontSize: '16px', fontWeight: '500', color: '#6b7280' }}>Subtotal:</span>
            <span style={{ fontSize: '16px', fontWeight: '600', color: '#374151' }}>
              {formatCurrency(order.total_amount)}
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

          <hr
            style={{
              margin: '16px 0',
              border: 'none',
              borderTop: '2px solid #ec4899',
              opacity: 0.6,
            }}
          />

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontSize: '20px',
                fontWeight: '800',
                color: '#1f2937',
              }}
            >
              Grand Total:
            </span>
            <span
              style={{
                fontSize: '24px',
                fontWeight: '800',
                color: '#ec4899',
                backgroundColor: 'white',
                padding: '8px 16px',
                borderRadius: '8px',
                border: '2px solid #ec4899',
              }}
            >
              {formatCurrency(order.total_amount)}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Details */}
      {paymentDetails && (
        <div
          style={{
            backgroundColor: '#f8fafc',
            padding: '24px',
            borderRadius: '16px',
            border: '2px solid #e2e8f0',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              fontSize: '18px',
              fontWeight: '700',
              color: '#1f2937',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            💳 Payment Information
          </div>

          <div style={{ marginBottom: '16px' }}>
            {/* Basic Payment Info */}
            {paymentDetails.transaction_id && (
              <div
                style={{
                  backgroundColor: '#ffffff',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  marginBottom: '16px',
                }}
              >
                <div>
                  <span
                    style={{
                      fontWeight: '600',
                      color: '#374151',
                      fontSize: '13px',
                      marginRight: '8px',
                    }}
                  >
                    Transaction ID:
                  </span>
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '12px',
                      backgroundColor: '#f1f5f9',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      wordBreak: 'break-all',
                    }}
                  >
                    {paymentDetails.transaction_id}
                  </span>
                </div>
              </div>
            )}

            {/* Method-specific details */}
            {order.payment_method === 'Crypto' && (
              <div
                style={{
                  backgroundColor: '#ffffff',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  marginBottom: '16px',
                }}
              >
                <div
                  style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#ea580c',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ marginRight: '8px' }}>₿</span>
                  Crypto Payment
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr',
                    gap: '8px',
                    fontSize: '13px',
                  }}
                >
                  {paymentDetails.crypto_currency && (
                    <div>
                      <span style={{ fontWeight: '600', color: '#374151' }}>Currency:</span>
                      <span
                        style={{
                          marginLeft: '8px',
                          backgroundColor: '#fed7aa',
                          color: '#c2410c',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600',
                        }}
                      >
                        {paymentDetails.crypto_currency}
                      </span>
                    </div>
                  )}
                  {paymentDetails.crypto_network && (
                    <div>
                      <span style={{ fontWeight: '600', color: '#374151' }}>Network:</span>
                      <span
                        style={{
                          marginLeft: '8px',
                          backgroundColor: '#dbeafe',
                          color: '#1e40af',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600',
                        }}
                      >
                        {paymentDetails.crypto_network}
                      </span>
                    </div>
                  )}
                  {/* Prefer wallet address in invoice; fallback to username if address missing. */}
                  {/* USDT/USDC -> Username */}
                  {['USDT', 'USDC'].includes(paymentDetails.crypto_currency || '') &&
                    paymentDetails.crypto_username && (
                      <div>
                        <span style={{ fontWeight: '600', color: '#374151' }}>Username:</span>
                        <span style={{ marginLeft: '8px', fontFamily: 'monospace' }}>
                          {paymentDetails.crypto_username}
                        </span>
                      </div>
                    )}

                  {/* TRC20/BEP20/Bitcoin -> Wallet Address */}
                  {['TRC20', 'BEP20', 'Bitcoin'].includes(paymentDetails.crypto_network || '') &&
                    paymentDetails.crypto_wallet_address && (
                      <div>
                        <span style={{ fontWeight: '600', color: '#374151' }}>Wallet Address:</span>
                        <span style={{ marginLeft: '8px', fontFamily: 'monospace' }}>
                          {paymentDetails.crypto_wallet_address}
                        </span>
                      </div>
                    )}

                  {paymentDetails.crypto_transaction_hash && (
                    <div>
                      <span style={{ fontWeight: '600', color: '#374151' }}>Transaction Hash:</span>
                      <div
                        style={{
                          marginTop: '4px',
                          fontFamily: 'monospace',
                          fontSize: '11px',
                          backgroundColor: '#f1f5f9',
                          padding: '6px 8px',
                          borderRadius: '4px',
                          wordBreak: 'break-all',
                          color: '#374151',
                        }}
                      >
                        {paymentDetails.crypto_transaction_hash}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {order.payment_method === 'Bank Transfer' && (
              <div
                style={{
                  backgroundColor: '#ffffff',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  marginBottom: '16px',
                }}
              >
                <div
                  style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#2563eb',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ marginRight: '8px' }}>🏦</span>
                  Bank Transfer
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                    fontSize: '13px',
                  }}
                >
                  {paymentDetails.bank_transaction_reference && (
                    <div>
                      <span style={{ fontWeight: '600', color: '#374151' }}>Reference Number:</span>
                      <div
                        style={{
                          marginTop: '2px',
                          fontFamily: 'monospace',
                          fontSize: '12px',
                          backgroundColor: '#f1f5f9',
                          padding: '4px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        {paymentDetails.bank_transaction_reference}
                      </div>
                    </div>
                  )}
                  {paymentDetails.bank_sender_name && (
                    <div>
                      <span style={{ fontWeight: '600', color: '#374151' }}>Sender:</span>
                      <div style={{ marginTop: '2px' }}>{paymentDetails.bank_sender_name}</div>
                    </div>
                  )}
                  {paymentDetails.bank_sender_bank && (
                    <div>
                      <span style={{ fontWeight: '600', color: '#374151' }}>Institution:</span>
                      <div style={{ marginTop: '2px' }}>{paymentDetails.bank_sender_bank}</div>
                    </div>
                  )}
                  {paymentDetails.bank_purpose && (
                    <div>
                      <span style={{ fontWeight: '600', color: '#374151' }}>Purpose:</span>
                      <div style={{ marginTop: '2px' }}>{paymentDetails.bank_purpose}</div>
                    </div>
                  )}
                  {paymentDetails.bank_transaction_type && (
                    <div>
                      <span style={{ fontWeight: '600', color: '#374151' }}>Transaction Type:</span>
                      <div style={{ marginTop: '2px' }}>{paymentDetails.bank_transaction_type}</div>
                    </div>
                  )}
                  {paymentDetails.bank_transaction_time && (
                    <div>
                      <span style={{ fontWeight: '600', color: '#374151' }}>Transaction Time:</span>
                      <div style={{ marginTop: '2px', fontSize: '12px' }}>
                        {new Date(paymentDetails.bank_transaction_time).toLocaleString()}
                      </div>
                    </div>
                  )}
                  {paymentDetails.bank_amount_in_currency && (
                    <div style={{ gridColumn: 'span 2' }}>
                      <div
                        style={{
                          backgroundColor: '#f8fafc',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        <span style={{ fontWeight: '600', color: '#374151' }}>Local Amount:</span>
                        <div
                          style={{
                            fontSize: '14px',
                            fontWeight: '700',
                            color: '#1f2937',
                            marginTop: '2px',
                          }}
                        >
                          {paymentDetails.bank_amount_in_currency} {paymentDetails.currency}
                        </div>
                        {paymentDetails.bank_exchange_rate && (
                          <div
                            style={{
                              fontSize: '11px',
                              color: '#6b7280',
                              marginTop: '2px',
                            }}
                          >
                            Rate: {paymentDetails.bank_exchange_rate}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {order.payment_method === 'Cash' && (
              <div
                style={{
                  backgroundColor: '#ffffff',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  marginBottom: '16px',
                }}
              >
                <div
                  style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#059669',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ marginRight: '8px' }}>💵</span>
                  Cash Payment
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                    fontSize: '13px',
                  }}
                >
                  {paymentDetails.cash_received_by && (
                    <div>
                      <span style={{ fontWeight: '600', color: '#374151' }}>Received By:</span>
                      <div style={{ marginTop: '2px' }}>{paymentDetails.cash_received_by}</div>
                    </div>
                  )}
                  {paymentDetails.cash_receipt_number && (
                    <div>
                      <span style={{ fontWeight: '600', color: '#374151' }}>Receipt #:</span>
                      <div
                        style={{
                          marginTop: '2px',
                          fontFamily: 'monospace',
                          fontSize: '12px',
                          backgroundColor: '#f1f5f9',
                          padding: '4px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        {paymentDetails.cash_receipt_number}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Additional Notes */}
            {paymentDetails.notes && (
              <div
                style={{
                  backgroundColor: '#fef3c7',
                  border: '1px solid #f59e0b',
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                }}
              >
                <span
                  style={{
                    fontWeight: '600',
                    color: '#92400e',
                    fontSize: '13px',
                  }}
                >
                  Payment Notes:
                </span>
                <p
                  style={{
                    color: '#78350f',
                    fontSize: '13px',
                    marginTop: '4px',
                    lineHeight: '1.4',
                  }}
                >
                  {paymentDetails.notes}
                </p>
              </div>
            )}

            {/* Timestamp */}
            {paymentDetails.created_at && (
              <div
                style={{
                  fontSize: '11px',
                  color: '#6b7280',
                  textAlign: 'right',
                  borderTop: '1px solid #e2e8f0',
                  paddingTop: '8px',
                }}
              >
                <span style={{ fontWeight: '600' }}>Recorded:</span>{' '}
                {new Date(paymentDetails.created_at).toLocaleString()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          borderTop: '3px solid #ec4899',
          paddingTop: '24px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            backgroundColor: '#fdf2f8',
            padding: '20px',
            borderRadius: '16px',
            border: '2px solid #fce7f3',
          }}
        >
          <div
            style={{
              fontSize: '18px',
              fontWeight: '700',
              color: '#ec4899',
              marginBottom: '8px',
            }}
          >
            Thank You For Trusting USA Gaming Distributor
          </div>
          <div
            style={{
              fontSize: '14px',
              color: '#6b7280',
              marginBottom: '12px',
              lineHeight: '1.6',
            }}
          >
            Kindly Review Your Invoice And Let Us Know If You Require Any Assistance.
            <br />
            For any questions or support, please don't hesitate to contact us.
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '24px',
              fontSize: '13px',
              color: '#9ca3af',
            }}
          >
            <div>📧 USAGamingDistributor@gmail.com</div>
            <div>📞 +1 (347) 690-3982</div>
          </div>
          <div
            style={{
              marginTop: '16px',
              fontSize: '12px',
              color: '#9ca3af',
              fontStyle: 'italic',
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
