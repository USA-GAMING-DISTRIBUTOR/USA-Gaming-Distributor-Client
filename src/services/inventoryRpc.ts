import { supabase } from '../lib/supabase';

import type { RepoResult } from '../types/repository';

export type RecordPurchaseAtomicInput = {
  platform_id: string;
  quantity: number;
  cost_per_unit: number;
  supplier?: string | null;
  notes?: string | null;
  purchased_by: string; // user id (uuid)
};

export type RecordPurchaseAtomicOutput = {
  purchase_history_id: string;
  previous_inventory: number;
  new_inventory: number;
  total_cost: number;
};

/**
 * Calls the Postgres function `record_purchase_and_update_inventory` to atomically
 * update inventory and insert a purchase history record.
 *
 * NOTE: The database function is documented in `docs/ATOMIC_INVENTORY.md` and
 * may not exist yet in your environment until the migration is applied.
 */
export async function recordPurchaseAtomic(
  input: RecordPurchaseAtomicInput,
): Promise<RepoResult<RecordPurchaseAtomicOutput>> {
  // Temporarily suppress type error: RPC function not yet in generated types.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client: any = supabase;
  const { data, error } = await client.rpc('record_purchase_and_update_inventory', {
    p_platform_id: input.platform_id,
    p_quantity: input.quantity,
    p_cost_per_unit: input.cost_per_unit,
    p_supplier: input.supplier ?? null,
    p_notes: input.notes ?? null,
    p_purchased_by: input.purchased_by,
  }).single();

  if (error) return { ok: false, error: error.message, code: error.code };
  return { ok: true, data: data as RecordPurchaseAtomicOutput };
}
