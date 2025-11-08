import React, { memo, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';

import { UI_CONSTANTS } from '@utils/constants';

import { formatCurrency, formatDateTime, formatNumber } from '../../utils/format';
import TableSkeleton from '../common/TableSkeleton';
import type { PurchaseHistory } from '../../types/purchaseHistory';
import type { ListChildComponentProps } from 'react-window';

interface VirtualizedPurchaseHistoryTableProps {
  loading?: boolean;
  rows: PurchaseHistory[];
  variant?: 'platform' | 'all';
  height?: number; // override max height if needed
}

/**
 * Virtualized table for large purchase history datasets using react-window.
 * Falls back to a simple skeleton state while loading. Column structure mirrors PurchaseHistoryTable.
 */
const VirtualizedPurchaseHistoryTable: React.FC<VirtualizedPurchaseHistoryTableProps> = ({
  loading = false,
  rows,
  variant = 'platform',
  height = UI_CONSTANTS.VIRTUAL_MAX_HEIGHT,
}) => {
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
          <TableSkeleton rows={8} columns={variant === 'all' ? 8 : 7} />
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

  // Renderer for each row (div-based to avoid invalid table structure under virtualization)
  const Row = ({ index, style }: ListChildComponentProps) => {
    const purchase = stableRows[index];
    return (
      <div
        key={purchase.id}
        style={style}
        className="border-b border-gray-100 hover:bg-gray-50 w-full grid grid-flow-col auto-cols-fr items-center"
      >
        {variant === 'all' && (
          <div className="py-3 px-4 font-medium min-w-[140px]">
            <span className="text-pink-600">{purchase.platform_name || 'Unknown Platform'}</span>
          </div>
        )}
        <div className="py-3 px-4 min-w-[160px]">{formatDateTime(purchase.created_at)}</div>
        <div className="py-3 px-4 font-medium min-w-[90px]">{formatNumber(purchase.quantity)}</div>
        <div className="py-3 px-4 min-w-[110px]">{formatCurrency(purchase.cost_per_unit)}</div>
        <div className="py-3 px-4 font-medium min-w-[120px]">{formatCurrency(purchase.total_cost)}</div>
        <div className="py-3 px-4 min-w-[140px]">{purchase.supplier || '-'}</div>
        <div className="py-3 px-4 min-w-[150px]">
          <span className="text-sm text-gray-600">
            {purchase.previous_inventory} → {purchase.new_inventory}
          </span>
        </div>
        <div className="py-3 px-4 text-sm text-gray-600 min-w-[160px]">{purchase.notes || '-'}</div>
      </div>
    );
  };

  // Adjust visible height based on number of rows (avoid large empty scroll area for fewer rows)
  const computedHeight = Math.min(height, stableRows.length * UI_CONSTANTS.VIRTUAL_ROW_HEIGHT);

  return (
    <div className="overflow-x-auto">
      <div className="w-full grid grid-flow-col auto-cols-fr border-b border-gray-200">
        {variant === 'all' && (
          <div className="text-left py-3 px-4 font-semibold text-gray-700">Platform</div>
        )}
        <div className="text-left py-3 px-4 font-semibold text-gray-700">Date</div>
        <div className="text-left py-3 px-4 font-semibold text-gray-700">Quantity</div>
        <div className="text-left py-3 px-4 font-semibold text-gray-700">Cost/Unit</div>
        <div className="text-left py-3 px-4 font-semibold text-gray-700">Total Cost</div>
        <div className="text-left py-3 px-4 font-semibold text-gray-700">Supplier</div>
        <div className="text-left py-3 px-4 font-semibold text-gray-700">Inventory Change</div>
        <div className="text-left py-3 px-4 font-semibold text-gray-700">Notes</div>
      </div>
      {/* Virtualized rows */}
      <List
        height={computedHeight}
        itemCount={stableRows.length}
        itemSize={UI_CONSTANTS.VIRTUAL_ROW_HEIGHT}
        width="100%"
        className="divide-y divide-gray-100"
      >
        {Row}
      </List>
    </div>
  );
};

VirtualizedPurchaseHistoryTable.displayName = 'VirtualizedPurchaseHistoryTable';
export default memo(VirtualizedPurchaseHistoryTable);
