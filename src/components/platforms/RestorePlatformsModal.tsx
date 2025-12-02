import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import type { Platform } from '../../types/platform';

interface RestorePlatformsModalProps {
  isOpen: boolean;
  loading?: boolean;
  platforms: Platform[];
  onRestore: (platform: Platform) => void;
  onClose: () => void;
  accentColor?: 'pink' | 'blue' | 'green' | 'red';
}

const RestorePlatformsModal: React.FC<RestorePlatformsModalProps> = ({
  isOpen,
  loading = false,
  platforms,
  onRestore,
  onClose,
  accentColor = 'pink',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const uniqueTypes = useMemo(() => {
    return Array.from(new Set(platforms.map((p) => p.account_type))).sort();
  }, [platforms]);

  const filteredPlatforms = useMemo(() => {
    return platforms.filter((p) => {
      const matchesSearch = p.platform.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || p.account_type === filterType;
      return matchesSearch && matchesType;
    });
  }, [platforms, searchTerm, filterType]);
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Restore Deleted Platforms"
      subtitle="Recover deleted platform records"
      headerVariant="themed"
      headerColor={accentColor}
      overlayVariant="blur"
      size="lg"
    >
      <div className="mb-4 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search platforms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
        >
          <option value="all">All Types</option>
          {uniqueTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {filteredPlatforms.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No matching platforms found</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {filteredPlatforms.map((platform) => (
            <div
              key={platform.id}
              className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex justify-between items-center hover:bg-white transition-colors"
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
                color={accentColor}
                onClick={() => onRestore(platform)}
              >
                {loading ? 'Restoring...' : 'Restore'}
              </Button>
            </div>
          ))}
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

export default RestorePlatformsModal;
