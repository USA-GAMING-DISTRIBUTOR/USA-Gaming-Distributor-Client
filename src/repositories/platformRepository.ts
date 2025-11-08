import { supabase } from '../lib/supabase';

import type { PlatformCreateDTO, PlatformUpdateDTO } from '../domains/platforms/types/dto';
import type { TablesInsert, TablesUpdate } from '../types/database.types';
import type { Platform } from '../types/platform';
import type { RepoResult } from '../types/repository';

/**
 * Map a raw database row to a strongly typed Platform.
 * - Converts unknown/nullable fields to safe primitives with defaults.
 * - Keeps function pure for isolated unit tests (no Supabase dependency).
 */
export const mapRowToPlatform = (row: Record<string, unknown>): Platform => ({
  id: String(row.id ?? ''),
  platform: String(row.platform ?? ''),
  account_type: String(row.account_type ?? ''),
  inventory: Number(row.inventory ?? 0),
  cost_price: Number(row.cost_price ?? 0),
  low_stock_alert: Number(row.low_stock_alert ?? 10),
  created_at: (row.created_at as string) ?? null,
  updated_at: (row.updated_at as string) ?? null,
  deleted_at: (row.deleted_at as string) ?? null,
});

/**
 * Data access layer for the `game_coins` table.
 * Returns discriminated RepoResult values for ergonomic error handling.
 */
export const platformRepository = {
  /** Fetch all platforms ordered by name; soft-deleted rows excluded by default. */
  async list(includeDeleted = false): Promise<RepoResult<Platform[]>> {
    const query = supabase.from('game_coins').select('*').order('platform', { ascending: true });
    const { data, error } = includeDeleted ? await query : await query.is('deleted_at', null);
    if (error) return { ok: false, error: error.message, code: error.code };
    return { ok: true, data: (data || []).map(mapRowToPlatform) };
  },

  /** Get a single platform by id. Returns `ok: true` with `data: null` when not found. */
  async get(id: string): Promise<RepoResult<Platform | null>> {
    const { data, error } = await supabase.from('game_coins').select('*').eq('id', id).single();
    if (error) return { ok: false, error: error.message, code: error.code };
    return { ok: true, data: data ? mapRowToPlatform(data) : null };
  },

  /** Create a new platform using a validated DTO; returns the created row. */
  async create(input: PlatformCreateDTO): Promise<RepoResult<Platform>> {
    const { data, error } = await supabase
      .from('game_coins')
      .insert([input as unknown as TablesInsert<'game_coins'>])
      .select('*')
      .single();
    if (error || !data)
      return { ok: false, error: error?.message || 'Create failed', code: error?.code };
    return { ok: true, data: mapRowToPlatform(data) };
  },

  /** Partially update a platform and return the updated row. */
  async update(id: string, changes: PlatformUpdateDTO): Promise<RepoResult<Platform>> {
    const { data, error } = await supabase
      .from('game_coins')
      .update(changes as unknown as TablesUpdate<'game_coins'>)
      .eq('id', id)
      .select('*')
      .single();
    if (error || !data)
      return { ok: false, error: error?.message || 'Update failed', code: error?.code };
    return { ok: true, data: mapRowToPlatform(data) };
  },

  /** Soft delete a platform by setting `deleted_at` timestamp. */
  async softDelete(id: string): Promise<RepoResult<Platform>> {
    const { data, error } = await supabase
      .from('game_coins')
      .update({ deleted_at: new Date().toISOString() } as unknown as TablesUpdate<'game_coins'>)
      .eq('id', id)
      .select('*')
      .single();
    if (error || !data)
      return { ok: false, error: error?.message || 'Delete failed', code: error?.code };
    return { ok: true, data: mapRowToPlatform(data) };
  },

  /** Restore a soft-deleted platform by nulling `deleted_at`. */
  async restore(id: string): Promise<RepoResult<Platform>> {
    const { data, error } = await supabase
      .from('game_coins')
      .update({ deleted_at: null } as unknown as TablesUpdate<'game_coins'>)
      .eq('id', id)
      .select('*')
      .single();
    if (error || !data)
      return { ok: false, error: error?.message || 'Restore failed', code: error?.code };
    return { ok: true, data: mapRowToPlatform(data) };
  },
};
