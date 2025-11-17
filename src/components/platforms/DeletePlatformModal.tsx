import React from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import type { Platform } from '../../types/platform';

interface DeletePlatformModalProps {
  isOpen: boolean;
  loading?: boolean;
  platform: Platform | null;
  onConfirm: () => void;
  onClose: () => void;
  accentColor?: 'pink' | 'blue' | 'green' | 'red';
}

const DeletePlatformModal: React.FC<DeletePlatformModalProps> = ({
  isOpen,
  loading = false,
  platform,
  onConfirm,
  onClose,
  accentColor = 'pink',
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Delete"
      subtitle="This action is irreversible"
      headerVariant="themed"
      headerColor={accentColor}
      overlayVariant="blur"
      size="sm"
    >
      <div className="space-y-4">
        <p className="text-gray-700">
          Are you sure you want to delete the platform "{platform?.platform}"? This action cannot be
          undone.
        </p>
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end items-center flex-shrink-0">
          <div className="flex gap-3">
          <Button variant="secondary" type="button" onClick={onClose} color={accentColor}>
            Cancel
          </Button>
          <Button variant="danger" type="button" loading={loading} onClick={onConfirm}>
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default DeletePlatformModal;
