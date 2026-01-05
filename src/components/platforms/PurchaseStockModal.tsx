import React from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import type { Platform } from '../../types/platform';

interface PurchaseFormState {
  quantity: number;
  cost_per_unit: number;
  supplier: string;
  notes: string;
}

interface PurchaseStockModalProps {
  isOpen: boolean;
  loading?: boolean;
  platform: Platform | null;
  form: PurchaseFormState;
  onChange: (changes: Partial<PurchaseFormState>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  accentColor?: 'pink' | 'blue' | 'green' | 'red';
}

const PurchaseStockModal: React.FC<PurchaseStockModalProps> = ({
  isOpen,
  loading = false,
  platform,
  form,
  onChange,
  onSubmit,
  onClose,
  accentColor = 'pink',
}) => {
  const totalCost = form.quantity * form.cost_per_unit;

  return (
    <Modal
      isOpen={isOpen && !!platform}
      onClose={onClose}
      title={platform ? `Add Stock - ${platform.platform}` : 'Add Stock'}
      subtitle={platform ? `Add inventory for ${platform.platform}` : 'Add inventory'}
      headerVariant="themed"
      headerColor={accentColor}
      overlayVariant="blur"
      size="md"
    >
      <form id="purchase-stock-form" onSubmit={onSubmit} className="space-y-4">
        <Input
          label="Quantity to Add"
          type="number"
          value={form.quantity}
          min={1}
          required
          onChange={(e) => onChange({ quantity: parseInt(e.target.value) || 0 })}
        />
        <Input
          label="Cost per Unit"
          type="number"
          value={form.cost_per_unit}
          min={0}
          step={0.0001}
          required
          onChange={(e) => onChange({ cost_per_unit: parseFloat(e.target.value) || 0 })}
        />
        <Input
          label="Supplier"
          type="text"
          value={form.supplier}
          placeholder="Supplier name"
          onChange={(e) => onChange({ supplier: e.target.value })}
        />
        <Input
          label="Notes"
          type="text"
          value={form.notes}
          placeholder="Additional notes"
          onChange={(e) => onChange({ notes: e.target.value })}
        />

        {platform && (
          <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700 space-y-1">
            <p>
              Current Stock: <span className="font-medium">{platform.inventory}</span>
            </p>
            <p>
              After Addition:{' '}
              <span className="font-medium">{platform.inventory + form.quantity}</span>
            </p>
            <p>
              Total Cost:{' '}
              <span className="font-medium">
                $
                {totalCost.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 4,
                })}
              </span>
            </p>
          </div>
        )}

        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end items-center flex-shrink-0">
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={onClose} color={accentColor}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              disabled={loading || form.quantity <= 0}
              color={accentColor}
            >
              {loading ? 'Adding...' : 'Add Stock'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default PurchaseStockModal;
