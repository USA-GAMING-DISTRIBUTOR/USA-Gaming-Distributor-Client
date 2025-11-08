import { supabase } from '../lib/supabase';

import type { PurchaseHistoryRecordDTO } from '../domains/platforms/types/dto';
import type { Database } from '../types/database.types';
import type { PurchaseHistory } from '../types/purchaseHistory';
import type { RepoResult } from '../types/repository';
type PHRow = Database['public']['Tables']['purchase_history']['Row'];
type JoinedRow = PHRow & {
  game_coins?: { platform: string } | null;
  users?: { username: string } | null;
  // legacy optional denormalized fields may not be present in row
  platform_name?: string;
  purchased_by_username?: string;
};

/**
 * Normalize joined purchase history rows into the PurchaseHistory domain model.
 * Falls back to denormalized legacy fields when relations are absent.
 */
const mapRow = (row: JoinedRow): PurchaseHistory => ({
  id: row.id,
  platform_id: row.platform_id,
  quantity: row.quantity,
  cost_per_unit: row.cost_per_unit,
  total_cost: row.total_cost,
  supplier: row.supplier,
  notes: row.notes,
  previous_inventory: row.previous_inventory,
  new_inventory: row.new_inventory,
  purchased_by: row.purchased_by,
  created_at: row.created_at,
  platform_name: row.game_coins?.platform ?? row.platform_name ?? '',
  purchased_by_username: row.users?.username ?? row.purchased_by_username ?? '',
});

/** Repository providing read + record operations for purchase history entries. */
export const purchaseHistoryRepository = {
  /** List history entries for a single platform (most recent first). */
  async listForPlatform(platformId: string): Promise<RepoResult<PurchaseHistory[]>> {
    const { data, error } = await supabase
      .from('purchase_history')
      .select(
        `*, game_coins!purchase_history_platform_id_fkey(platform), users!purchase_history_purchased_by_fkey(username)`,
      )
      .eq('platform_id', platformId)
      .order('created_at', { ascending: false });

    if (error) return { ok: false, error: error.message, code: error.code };
    return { ok: true, data: (data || []).map(mapRow) };
  },

  /** List all purchase history entries across platforms (most recent first). */
  async listAll(): Promise<RepoResult<PurchaseHistory[]>> {
    const { data, error } = await supabase
      .from('purchase_history')
      .select(
        `*, game_coins!purchase_history_platform_id_fkey(platform), users!purchase_history_purchased_by_fkey(username)`,
      )
      .order('created_at', { ascending: false });

    if (error) return { ok: false, error: error.message, code: error.code };
    return { ok: true, data: (data || []).map(mapRow) };
  },

  /** Record a new inventory purchase mutation (atomic behavior may later move to RPC). */
  async record(input: PurchaseHistoryRecordDTO): Promise<RepoResult<null>> {
    const { error } = await supabase.from('purchase_history').insert([input]);
    if (error) return { ok: false, error: error.message, code: error.code };
    return { ok: true, data: null };
  },
};
