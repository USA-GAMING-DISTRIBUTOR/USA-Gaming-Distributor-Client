import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';

import Modal from '../common/Modal';
import Button from '../common/Button';
import Pagination from '../common/Pagination';
import PurchaseHistoryTable from './PurchaseHistoryTable';
import VirtualizedPurchaseHistoryTable from './VirtualizedPurchaseHistoryTable';
import { formatCurrency } from '../../utils/format';
import { UI_CONSTANTS } from '@utils/constants';
import type { PurchaseHistory } from '../../types/purchaseHistory';

interface AllPurchaseHistoryModalProps {
  isOpen: boolean;
  loading?: boolean;
  purchaseHistory: PurchaseHistory[];
  paginated: PurchaseHistory[];
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (size: number) => void;
  onClose: () => void;
  accentColor?: 'pink' | 'blue' | 'green' | 'red';
}

const AllPurchaseHistoryModal: React.FC<AllPurchaseHistoryModalProps> = ({
  isOpen,
  loading = false,
  purchaseHistory,
  paginated,
  page,
  pageSize,
  onPageChange,
  onItemsPerPageChange,
  onClose,
  accentColor = 'pink',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const uniqueSuppliers = useMemo(() => {
    return Array.from(
      new Set(purchaseHistory.map((p) => p.supplier).filter(Boolean) as string[]),
    ).sort();
  }, [purchaseHistory]);

  const filteredHistory = useMemo(() => {
    return purchaseHistory.filter((p) => {
      const matchesSearch =
        (p.platform_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (p.supplier?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (p.notes?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      const matchesSupplier = filterSupplier === 'all' || p.supplier === filterSupplier;

      let matchesDate = true;
      if (startDate || endDate) {
        const purchaseDate = new Date(p.created_at).setHours(0, 0, 0, 0);
        const start = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : null;
        const end = endDate ? new Date(endDate).setHours(0, 0, 0, 0) : null;

        if (start && purchaseDate < start) matchesDate = false;
        if (end && purchaseDate > end) matchesDate = false;
      }

      return matchesSearch && matchesSupplier && matchesDate;
    });
  }, [purchaseHistory, searchTerm, filterSupplier, startDate, endDate]);

  // Recalculate pagination based on filtered results if not virtualized
  // Note: The parent controls pagination based on the full list passed in 'paginated'.
  // If we filter locally, we need to handle pagination locally or ignore the parent's 'paginated' prop for the table display.
  // Since we are doing client-side filtering here, we should slice the filtered list.

  const currentPaginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredHistory.slice(start, start + pageSize);
  }, [filteredHistory, page, pageSize]);

  const totalValue = filteredHistory.reduce((sum, p) => sum + p.total_cost, 0);

  const useVirtualized = purchaseHistory.length >= UI_CONSTANTS.VIRTUALIZATION_THRESHOLD;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="All Purchase History"
      subtitle="View purchases across all platforms"
      headerVariant="themed"
      headerColor={accentColor}
      overlayVariant="blur"
      size="xl"
    >
      <div className="mb-4 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search history..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
          />
        </div>
        <div className="flex gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
            placeholder="Start Date"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
            placeholder="End Date"
          />
        </div>
        <select
          value={filterSupplier}
          onChange={(e) => setFilterSupplier(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
        >
          <option value="all">All Suppliers</option>
          {uniqueSuppliers.map((supplier) => (
            <option key={supplier} value={supplier}>
              {supplier}
            </option>
          ))}
        </select>
      </div>

      {useVirtualized ? (
        <VirtualizedPurchaseHistoryTable loading={loading} rows={filteredHistory} variant="all" />
      ) : (
        <PurchaseHistoryTable
          loading={loading}
          rows={currentPaginated}
          variant="all"
          pageSize={pageSize}
        />
      )}

      {!useVirtualized && filteredHistory.length > 0 && !loading && (
        <div className="mt-4">
          <Pagination
            currentPage={page}
            totalItems={filteredHistory.length}
            itemsPerPage={pageSize}
            onPageChange={onPageChange}
            onItemsPerPageChange={onItemsPerPageChange}
          />
        </div>
      )}

      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between flex-shrink-0">
        <div className="text-sm text-gray-600">
          Total Records: {purchaseHistory.length} | Total Value: {formatCurrency(totalValue)}
        </div>
        <Button variant="secondary" onClick={onClose} color={accentColor}>
          Close
        </Button>
      </div>
    </Modal>
  );
};

export default AllPurchaseHistoryModal;
