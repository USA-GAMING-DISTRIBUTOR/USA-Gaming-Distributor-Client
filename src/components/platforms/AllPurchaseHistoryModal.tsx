import React from 'react';

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
  const totalValue = purchaseHistory.reduce((sum, p) => sum + p.total_cost, 0);

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
