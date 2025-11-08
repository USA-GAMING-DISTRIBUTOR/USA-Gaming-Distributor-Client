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
}

const DeletePlatformModal: React.FC<DeletePlatformModalProps> = ({
  isOpen,
  loading = false,
  platform,
  onConfirm,
  onClose,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Delete" size="sm">
      <div className="space-y-4">
        <p className="text-gray-700">
          Are you sure you want to delete the platform "{platform?.platform}"? This action cannot be
          undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" type="button" loading={loading} onClick={onConfirm}>
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DeletePlatformModal;
