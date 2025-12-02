import React, { useState, useMemo } from 'react';

import Modal from '../common/Modal';
import Pagination from '../common/Pagination';
import Button from '../common/Button';
import PurchaseHistoryTable from './PurchaseHistoryTable';
import VirtualizedPurchaseHistoryTable from './VirtualizedPurchaseHistoryTable';
import { UI_CONSTANTS } from '@utils/constants';
import type { PurchaseHistory } from '../../types/purchaseHistory';

interface PlatformPurchaseHistoryModalProps {
  isOpen: boolean;
  loading?: boolean;
  platformName: string | null;
  purchaseHistory: PurchaseHistory[];
  paginated: PurchaseHistory[];
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (size: number) => void;
  onClose: () => void;
  accentColor?: 'pink' | 'blue' | 'green' | 'red';
}

const PlatformPurchaseHistoryModal: React.FC<PlatformPurchaseHistoryModalProps> = ({
  isOpen,
  loading = false,
  platformName,
  purchaseHistory,
  paginated,
  page,
  pageSize,
  onPageChange,
  onItemsPerPageChange,
  onClose,
  accentColor = 'pink',
}) => {
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
      const matchesSupplier = filterSupplier === 'all' || p.supplier === filterSupplier;

      let matchesDate = true;
      if (startDate || endDate) {
        const purchaseDate = new Date(p.created_at).setHours(0, 0, 0, 0);
        const start = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : null;
        const end = endDate ? new Date(endDate).setHours(0, 0, 0, 0) : null;

        if (start && purchaseDate < start) matchesDate = false;
        if (end && purchaseDate > end) matchesDate = false;
      }

      return matchesSupplier && matchesDate;
    });
  }, [purchaseHistory, filterSupplier, startDate, endDate]);

  const currentPaginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredHistory.slice(start, start + pageSize);
  }, [filteredHistory, page, pageSize]);
  const useVirtualized = purchaseHistory.length >= UI_CONSTANTS.VIRTUALIZATION_THRESHOLD;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Purchase History - ${platformName ?? 'Platform'}`}
      subtitle={platformName ? `Transactions for ${platformName}` : 'Platform purchase history'}
      headerVariant="themed"
      headerColor={accentColor}
      overlayVariant="blur"
      size="xl"
    >
      <div className="mb-4 flex flex-col md:flex-row gap-4">
        <div className="flex gap-2 flex-1">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm w-full"
            placeholder="Start Date"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm w-full"
            placeholder="End Date"
          />
        </div>
        <select
          value={filterSupplier}
          onChange={(e) => setFilterSupplier(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm flex-1"
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
        <VirtualizedPurchaseHistoryTable
          loading={loading}
          rows={filteredHistory}
          variant="platform"
        />
      ) : (
        <PurchaseHistoryTable
          loading={loading}
          rows={currentPaginated}
          variant="platform"
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

      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end items-center flex-shrink-0">
        <Button variant="secondary" onClick={onClose} color={accentColor}>
          Close
        </Button>
      </div>
    </Modal>
  );
};

export default PlatformPurchaseHistoryModal;
