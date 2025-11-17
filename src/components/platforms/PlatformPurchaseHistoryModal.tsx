import React from 'react';

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
      {useVirtualized ? (
        <VirtualizedPurchaseHistoryTable
          loading={loading}
          rows={purchaseHistory}
          variant="platform"
        />
      ) : (
        <PurchaseHistoryTable
          loading={loading}
          rows={paginated}
          variant="platform"
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

      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end items-center flex-shrink-0">
        <Button variant="secondary" onClick={onClose} color={accentColor}>
          Close
        </Button>
      </div>
    </Modal>
  );
};

export default PlatformPurchaseHistoryModal;
