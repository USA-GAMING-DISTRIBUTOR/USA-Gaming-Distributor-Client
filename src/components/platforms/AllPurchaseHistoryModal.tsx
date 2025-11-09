import React from 'react';

import Modal from '../common/Modal';
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
}) => {
  const totalValue = purchaseHistory.reduce((sum, p) => sum + p.total_cost, 0);

  const useVirtualized = purchaseHistory.length >= UI_CONSTANTS.VIRTUALIZATION_THRESHOLD;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="All Purchase History" size="xl">
      {useVirtualized ? (
        <VirtualizedPurchaseHistoryTable loading={loading} rows={purchaseHistory} variant="all" />
      ) : (
        <PurchaseHistoryTable
          loading={loading}
          rows={paginated}
          variant="all"
          pageSize={pageSize}
        />
      )}

      {!useVirtualized && purchaseHistory.length > 0 && !loading && (
        <div className="mt-4">
          <Pagination
            currentPage={page}
            totalItems={purchaseHistory.length}
            itemsPerPage={pageSize}
            onPageChange={onPageChange}
            onItemsPerPageChange={onItemsPerPageChange}
          />
        </div>
      )}

      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Total Records: {purchaseHistory.length} | Total Value: {formatCurrency(totalValue)}
        </div>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Close
        </button>
      </div>
    </Modal>
  );
};

export default AllPurchaseHistoryModal;
