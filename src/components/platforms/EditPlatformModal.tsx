import React from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import type { PlatformCreateData } from '../../types/platform';

interface EditPlatformModalProps {
  isOpen: boolean;
  loading?: boolean;
  form: PlatformCreateData;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  accentColor?: 'pink' | 'blue' | 'green' | 'red';
}

const EditPlatformModal: React.FC<EditPlatformModalProps> = ({
  isOpen,
  loading = false,
  form,
  onChange,
  onSubmit,
  onClose,
  accentColor = 'pink',
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Platform"
      subtitle="Update platform information"
      headerVariant="themed"
      headerColor={accentColor}
      overlayVariant="blur"
      size="md"
    >
      <form id="edit-platform-form" onSubmit={onSubmit} className="space-y-4">
        <Input
          label="Platform Name"
          type="text"
          name="platform_name"
          value={form.platform_name}
          onChange={onChange}
          required
        />

        <Input
          label="Account Type"
          type="text"
          name="account_type"
          value={form.account_type}
          onChange={onChange}
          placeholder="e.g., Standard, Premium, Enterprise"
          required
        />

        <Input
          label="Inventory"
          type="number"
          name="inventory"
          value={form.inventory}
          onChange={onChange}
          min={0}
          required
        />

        <Input
          label="Cost Price (in cents)"
          type="number"
          name="cost_price"
          value={form.cost_price}
          onChange={onChange}
          min={0}
          step={0.01}
          required
        />

        <Input
          label="Low Stock Alert Threshold"
          type="number"
          name="low_stock_alert"
          value={form.low_stock_alert}
          onChange={onChange}
          min={0}
          helper="Alert when inventory falls below this number"
          required
        />

        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end items-center flex-shrink-0">
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={onClose} color={accentColor}>
              Cancel
            </Button>
            <Button type="submit" loading={loading} color={accentColor}>
              {loading ? 'Updating...' : 'Update Platform'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default EditPlatformModal;
