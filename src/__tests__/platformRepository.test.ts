import { describe, it, expect } from 'vitest';
import { mapRowToPlatform } from '../repositories/platformRepository';

describe('mapRowToPlatform', () => {
  it('maps complete row correctly', () => {
    const row = {
      id: '123',
      platform: 'Steam',
      account_type: 'Email',
      inventory: 42,
      cost_price: 9.99,
      low_stock_alert: 5,
      created_at: '2025-01-01T00:00:00.000Z',
      updated_at: '2025-01-02T00:00:00.000Z',
      deleted_at: null,
    };

    const result = mapRowToPlatform(row);
    expect(result).toEqual({
      id: '123',
      platform: 'Steam',
      account_type: 'Email',
      inventory: 42,
      cost_price: 9.99,
      low_stock_alert: 5,
      created_at: '2025-01-01T00:00:00.000Z',
      updated_at: '2025-01-02T00:00:00.000Z',
      deleted_at: null,
    });
  });

  it('applies defaults and type coercions for missing fields', () => {
    const row = {
      platform: undefined,
      account_type: null,
      // inventory, cost_price, low_stock_alert missing
    } as unknown as Record<string, unknown>;

    const result = mapRowToPlatform(row);
    expect(result.id).toBe('');
    expect(result.platform).toBe('');
    expect(result.account_type).toBe('');
    expect(result.inventory).toBe(0);
    expect(result.cost_price).toBe(0);
    expect(result.low_stock_alert).toBe(10); // default in mapper
    expect(result.created_at).toBeNull();
    expect(result.updated_at).toBeNull();
    expect(result.deleted_at).toBeNull();
  });
});
