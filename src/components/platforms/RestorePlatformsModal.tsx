import React from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import type { Platform } from '../../types/platform';

interface RestorePlatformsModalProps {
  isOpen: boolean;
  loading?: boolean;
  platforms: Platform[];
  onRestore: (platform: Platform) => void;
  onClose: () => void;
}

const RestorePlatformsModal: React.FC<RestorePlatformsModalProps> = ({
  isOpen,
  loading = false,
  platforms,
  onRestore,
  onClose,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Restore Deleted Platforms" size="lg">
      {platforms.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No deleted platforms found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {platforms.map((platform) => (
            <div
              key={platform.id}
              className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex justify-between items-center"
            >
              <div>
                <h4 className="font-semibold text-gray-800">{platform.platform}</h4>
                <p className="text-sm text-gray-600">Account Type: {platform.account_type}</p>
                <p className="text-xs text-gray-500">
                  Deleted:{' '}
                  {platform.deleted_at ? new Date(platform.deleted_at).toLocaleString() : 'Unknown'}
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                disabled={loading}
                onClick={() => onRestore(platform)}
              >
                {loading ? 'Restoring...' : 'Restore'}
              </Button>
            </div>
          ))}
        </div>
      )}
      <div className="mt-6 flex justify-end">
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
};

export default RestorePlatformsModal;
