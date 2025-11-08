import React, { useMemo } from 'react';

import { formatCurrency, formatDateTime, formatNumber } from '../../utils/format';
import TableSkeleton from '../common/TableSkeleton';

import type { PurchaseHistory } from '../../types/purchaseHistory';

interface PurchaseHistoryTableProps {
  loading?: boolean;
  rows: PurchaseHistory[];
  variant?: 'platform' | 'all';
  pageSize?: number;
}

/**
 * Reusable table rendering purchase history records.
 * variant 'platform' omits platform column; 'all' includes it.
 */
const PurchaseHistoryTable: React.FC<PurchaseHistoryTableProps> = ({
  loading = false,
  rows,
  variant = 'platform',
  pageSize = 10,
}) => {
  // Stable memoized rows reference to avoid unnecessary map re-renders in parent memoization scenarios.
  const stableRows = useMemo(() => rows, [rows]);

  if (loading) {
    return (
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-200">
            {variant === 'all' && (
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Platform</th>
            )}
            <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">Quantity</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">Cost/Unit</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">Total Cost</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">Supplier</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">Inventory Change</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">Notes</th>
          </tr>
        </thead>
        <tbody>
          <TableSkeleton rows={Math.min(pageSize, 8)} columns={variant === 'all' ? 8 : 7} />
        </tbody>
      </table>
    );
  }

  if (!loading && stableRows.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No purchase history found{variant === 'platform' ? ' for this platform' : ''}.</p>
        <p className="text-sm mt-2">Add stock to start tracking purchase history.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-200">
            {variant === 'all' && (
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Platform</th>
            )}
            <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">Quantity</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">Cost/Unit</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">Total Cost</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">Supplier</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">Inventory Change</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">Notes</th>
          </tr>
        </thead>
        <tbody>
          {stableRows.map((purchase) => (
            <tr key={purchase.id} className="border-b border-gray-100 hover:bg-gray-50">
              {variant === 'all' && (
                <td className="py-3 px-4 font-medium">
                  <span className="text-pink-600">
                    {purchase.platform_name || 'Unknown Platform'}
                  </span>
                </td>
              )}
              <td className="py-3 px-4">{formatDateTime(purchase.created_at)}</td>
              <td className="py-3 px-4 font-medium">{formatNumber(purchase.quantity)}</td>
              <td className="py-3 px-4">{formatCurrency(purchase.cost_per_unit)}</td>
              <td className="py-3 px-4 font-medium">{formatCurrency(purchase.total_cost)}</td>
              <td className="py-3 px-4">{purchase.supplier || '-'}</td>
              <td className="py-3 px-4">
                <span className="text-sm text-gray-600">
                  {purchase.previous_inventory} → {purchase.new_inventory}
                </span>
              </td>
              <td className="py-3 px-4 text-sm text-gray-600">{purchase.notes || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

PurchaseHistoryTable.displayName = 'PurchaseHistoryTable';
export default React.memo(PurchaseHistoryTable);
