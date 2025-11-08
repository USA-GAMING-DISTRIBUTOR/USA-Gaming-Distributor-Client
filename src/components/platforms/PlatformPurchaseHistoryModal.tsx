import React from 'react';

import Modal from '../common/Modal';
import Pagination from '../common/Pagination';
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
}) => {
  const useVirtualized = purchaseHistory.length >= UI_CONSTANTS.VIRTUALIZATION_THRESHOLD;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Purchase History - ${platformName ?? 'Platform'}`} size="xl">
      {useVirtualized ? (
        <VirtualizedPurchaseHistoryTable loading={loading} rows={purchaseHistory} variant="platform" />
      ) : (
        <PurchaseHistoryTable loading={loading} rows={paginated} variant="platform" pageSize={pageSize} />
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

      <div className="mt-6 flex justify-end">
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

export default PlatformPurchaseHistoryModal;
