/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from 'react';

import { LoadingSpinner } from './common/Loader';
import { reportRepository } from '../repositories/reportRepository';

type Filters = {
  from?: string;
  to?: string;
  customerId?: string | null;
  platformId?: string | null;
  employeeId?: string | null;
  paymentMethod?: string | null;
  groupBy?: 'none' | 'customer' | 'platform' | 'employee' | 'payment_method';
};

// (Allow some `any` usage in this file for flexible report shapes)

const ReportsPanel: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState({
    platforms: [],
    customers: [],
    employees: [],
    paymentMethods: [],
  });
  const [filters, setFilters] = useState<Filters>({ groupBy: 'none' });
  const [data, setData] = useState<{ orders: any[]; items: any[]; payments: any[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const res = await reportRepository.fetchFilters();
      if (!mounted) return;
      if (!res.ok) setError((res as any).error || 'Failed to load filters');
      else
        setOptions(res.data || { platforms: [], customers: [], employees: [], paymentMethods: [] });
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Build nicer payment method options (include bank subtypes and crypto subtypes)
  const paymentOptions = useMemo(() => {
    const raw: string[] = options.paymentMethods || [];

    const pretty = (s: string) =>
      String(s)
        .replace(/_/g, ' ')
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

    return raw.map((m) => {
      if (!m) return { value: '', label: '' };
      if (m === 'bank') return { value: 'bank', label: 'Bank' };
      if (m === 'cash') return { value: 'cash', label: 'Cash' };
      if (m.startsWith('bank:')) {
        const sub = m.split(':')[1] || '';
        const label = `Bank — ${pretty(sub)}`;
        return { value: m, label };
      }
      if (m.startsWith('crypto:')) {
        const sub = m.split(':')[1] || '';
        // detect currency (UPPER) vs network (lower)
        if (sub === sub.toUpperCase()) return { value: m, label: `${sub} (Crypto)` };
        return { value: m, label: `${sub.toUpperCase()} (Crypto network)` };
      }
      // fallback
      return { value: m, label: m };
    });
  }, [options.paymentMethods]);

  const applyFilters = async () => {
    setLoading(true);
    setError(null);
    const res = await reportRepository.fetchOrdersWithDetails(filters);
    setLoading(false);
    if (!res.ok) return setError((res as any).error || 'Failed to load report data');
    setData(res.data);
  };

  // Aggregations
  const totals = useMemo(() => {
    if (!data) return { sales: 0, profit: 0, orders: 0 };
    const sales = (data.orders || []).reduce(
      (s: number, o: any) => s + Number(o.total_amount || 0),
      0,
    );
    const profit = (data.items || []).reduce((p: number, it: any) => {
      const unitPrice = Number(it.unit_price || 0);
      const cost = Number(it.game_coins?.cost_price ?? 0);
      return p + (unitPrice - cost) * Number(it.quantity || 0);
    }, 0);
    const orders = (data.orders || []).length;
    return { sales, profit, orders };
  }, [data]);

  const grouped = useMemo(() => {
    if (!data || !filters.groupBy || filters.groupBy === 'none') return null;
    const map = new Map<
      string,
      { label: string; sales: number; profit: number; orders: Set<string> }
    >();
    for (const order of data.orders) {
      const orderItems = data.items.filter((i: any) => i.order_id === order.id);
      let key = '';
      let label = '';
      switch (filters.groupBy) {
        case 'customer':
          key = order.customer_id || 'unknown';
          label =
            (order.customer_id &&
              (options.customers || []).find((c: any) => c.id === order.customer_id)?.name) ||
            order.customer_id ||
            'Unknown';
          break;
        case 'employee':
          key = order.created_by || 'unknown';
          label =
            (order.created_by &&
              (options.employees || []).find((u: any) => u.id === order.created_by)?.username) ||
            order.created_by ||
            'Unknown';
          break;
        case 'payment_method':
          key = order.payment_method || 'unknown';
          label = order.payment_method || 'Unknown';
          break;
        case 'platform':
          for (const it of orderItems) {
            const pk = it.platform_id || 'unknown';
            const platformRow = (options.platforms || []).find((p: any) => p.id === it.platform_id);
            const lbl =
              platformRow?.platform && platformRow?.account_type
                ? `${platformRow.platform} (${platformRow.account_type})`
                : it.game_coins?.platform || it.platform_id || 'Unknown';
            const existing = map.get(pk) ?? {
              label: lbl,
              sales: 0,
              profit: 0,
              orders: new Set<string>(),
            };
            existing.sales += Number(it.total_price || it.unit_price * it.quantity || 0);
            const cost = Number(it.game_coins?.cost_price ?? 0);
            existing.profit += (Number(it.unit_price || 0) - cost) * Number(it.quantity || 0);
            existing.orders.add(order.id);
            map.set(pk, existing);
          }
          continue;
        default:
          key = 'unknown';
      }

      const existing = map.get(key) ?? { label, sales: 0, profit: 0, orders: new Set<string>() };
      existing.sales += Number(order.total_amount || 0);
      for (const it of orderItems) {
        const cost = Number(it.game_coins?.cost_price ?? 0);
        existing.profit += (Number(it.unit_price || 0) - cost) * Number(it.quantity || 0);
      }
      existing.orders.add(order.id);
      map.set(key, existing);
    }

    return Array.from(map.entries()).map(([key, val]) => ({
      id: key,
      label: val.label,
      sales: val.sales,
      profit: val.profit,
      orders: val.orders.size,
    }));
  }, [data, filters.groupBy, options.customers, options.platforms, options.employees]);

  const exportCsv = () => {
    if (!data) return;
    const headers = ['order_id', 'order_number', 'created_at', 'customer_id', 'total_amount'];
    const rows = data.orders.map((o: any) => [
      o.id,
      o.order_number,
      o.created_at,
      o.customer_id,
      o.total_amount,
    ]);
    const csv = [
      headers.join(','),
      ...rows.map((r: any[]) => r.map((c) => `"${String(c ?? '')}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      <div className="bg-white p-4 rounded shadow mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">From</label>
            <input
              type="date"
              className="mt-1 block w-full border rounded p-2"
              value={filters.from ?? ''}
              onChange={(e) => setFilters((s) => ({ ...s, from: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">To</label>
            <input
              type="date"
              className="mt-1 block w-full border rounded p-2"
              value={filters.to ?? ''}
              onChange={(e) => setFilters((s) => ({ ...s, to: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Group By</label>
            <select
              className="mt-1 block w-full border rounded p-2"
              value={filters.groupBy}
              onChange={(e) => setFilters((s) => ({ ...s, groupBy: e.target.value as any }))}
            >
              <option value="none">None</option>
              <option value="customer">Customer</option>
              <option value="platform">Platform</option>
              <option value="employee">Employee</option>
              <option value="payment_method">Payment Method</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Customer</label>
            <select
              className="mt-1 block w-full border rounded p-2"
              value={filters.customerId ?? ''}
              onChange={(e) => setFilters((s) => ({ ...s, customerId: e.target.value || null }))}
            >
              <option value="">All</option>
              {options.customers.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Platform</label>
            <select
              className="mt-1 block w-full border rounded p-2"
              value={filters.platformId ?? ''}
              onChange={(e) => setFilters((s) => ({ ...s, platformId: e.target.value || null }))}
            >
              <option value="">All</option>
              {options.platforms.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.platform} {p.account_type ? `(${p.account_type})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Employee</label>
            <select
              className="mt-1 block w-full border rounded p-2"
              value={filters.employeeId ?? ''}
              onChange={(e) => setFilters((s) => ({ ...s, employeeId: e.target.value || null }))}
            >
              <option value="">All</option>
              {options.employees.map((u: any) => (
                <option key={u.id} value={u.id}>
                  {u.username}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Payment Method</label>
            <select
              className="mt-1 block w-full border rounded p-2"
              value={filters.paymentMethod ?? ''}
              onChange={(e) => setFilters((s) => ({ ...s, paymentMethod: e.target.value || null }))}
            >
              <option value="">All</option>
              {paymentOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={applyFilters}
            disabled={loading}
            className={`px-4 py-2 rounded flex items-center gap-2 ${
              loading ? 'bg-gray-300 text-gray-700 cursor-not-allowed' : 'bg-blue-600 text-white'
            }`}
          >
            {loading ? (
              <div className="px-4 py-2">
                <LoadingSpinner size="sm" />
              </div>
            ) : (
              'Apply'
            )}
          </button>

          <button
            onClick={() => setFilters({ groupBy: 'none' })}
            disabled={loading}
            className={`px-3 py-2 rounded ${loading ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-gray-200'}`}
          >
            Reset
          </button>

          <button
            className={`ml-auto px-3 py-2 rounded flex items-center gap-2 ${
              loading ? 'bg-gray-300 text-gray-700 cursor-not-allowed' : 'bg-green-600 text-white'
            }`}
            onClick={exportCsv}
            disabled={loading}
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Export</span>
              </>
            ) : (
              'Export CSV'
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded mb-4">Error: {error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Total Sales</div>
          <div className="text-2xl font-bold">${totals.sales.toFixed(2)}</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Profit (est.)</div>
          <div className="text-2xl font-bold">${totals.profit.toFixed(2)}</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Orders</div>
          <div className="text-2xl font-bold">{totals.orders}</div>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-3">Details</h2>

        {filters.groupBy && filters.groupBy !== 'none' && grouped ? (
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="text-left border-b">
                <th className="p-2">Group</th>
                <th className="p-2">Sales</th>
                <th className="p-2">Profit</th>
                <th className="p-2">Orders</th>
              </tr>
            </thead>
            <tbody>
              {grouped.map((g: any) => (
                <tr key={g.id} className="border-b">
                  <td className="p-2">{g.label}</td>
                  <td className="p-2">${g.sales.toFixed(2)}</td>
                  <td className="p-2">${g.profit.toFixed(2)}</td>
                  <td className="p-2">{g.orders}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div>
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr className="text-left border-b">
                  <th className="p-2">Order #</th>
                  <th className="p-2">Created At</th>
                  <th className="p-2">Customer</th>
                  <th className="p-2">Payment Method</th>
                  <th className="p-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {(data?.orders || []).map((o: any) => (
                  <tr key={o.id} className="border-b">
                    <td className="p-2">{o.order_number}</td>
                    <td className="p-2">{new Date(o.created_at || '').toLocaleString()}</td>
                    <td className="p-2">
                      {(o.customer_id &&
                        (options.customers || []).find((c: any) => c.id === o.customer_id)?.name) ||
                        o.customer_id ||
                        '—'}
                    </td>
                    <td className="p-2">{o.payment_method ?? '—'}</td>
                    <td className="p-2">${Number(o.total_amount || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPanel;
