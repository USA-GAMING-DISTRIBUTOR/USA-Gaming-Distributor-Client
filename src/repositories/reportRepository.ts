/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '../lib/supabase';

import type { RepoResult } from '../types/repository';

/**
 * Lightweight report repository: fetches filter options and order data
 * (orders, their items and payment details). Aggregation is performed
 * on the client so SQL stays simple and flexible for filters.
 */
export const reportRepository = {
  /** Fetch options used in filter dropdowns: platforms, customers, employees */
  async fetchFilters(): Promise<
    RepoResult<{ platforms: any[]; customers: any[]; employees: any[]; paymentMethods: string[] }>
  > {
    try {
      const [platformsRes, customersRes, usersRes] = await Promise.all([
        supabase
          .from('game_coins')
          .select('id,platform,account_type')
          .order('platform', { ascending: true }),
        supabase.from('customers').select('id,name').order('name', { ascending: true }),
        supabase.from('users').select('id,username,role').order('username', { ascending: true }),
      ]);

      if (platformsRes.error) return { ok: false, error: platformsRes.error.message };
      if (customersRes.error) return { ok: false, error: customersRes.error.message };
      if (usersRes.error) return { ok: false, error: usersRes.error.message };

      const employees = (usersRes.data || []).filter((u) => u.role !== undefined);

      // Fetch payment details aggregates to build payment method + subtype options
      const paymentRes = await supabase.from('payment_details').select(
        'payment_method,bank_transaction_type,crypto_currency,crypto_network,cash_receipt_number',
      );
      if (paymentRes.error) return { ok: false, error: paymentRes.error.message };

      const paymentRows = paymentRes.data || [];
      const methods = new Set<string>();
      // We only expose bank, cash and crypto subtypes (currency + network)
      for (const r of paymentRows) {
        const pmRaw = String(r.payment_method || '').toLowerCase();
        if (pmRaw === 'bank') {
          methods.add('bank');
          if (r.bank_transaction_type) {
            methods.add(`bank:${String(r.bank_transaction_type).toLowerCase()}`);
          }
        }
        if (pmRaw === 'cash') methods.add('cash');
        if (pmRaw === 'crypto') {
          // add currency subtypes (e.g. USDT, BTC)
          if (r.crypto_currency) methods.add(`crypto:${String(r.crypto_currency).toUpperCase()}`);
          // add network subtypes (e.g. bep20, trc20)
          if (r.crypto_network) methods.add(`crypto:${String(r.crypto_network).toLowerCase()}`);
        }
      }

      // Expose discovered methods and subtypes (e.g. 'bank', 'bank:transfer', 'crypto:USDT', 'crypto:bep20')
      // If common subtypes are missing (envs where payment_details are sparse), include sensible defaults
      if (!methods.has('bank:transfer')) methods.add('bank:transfer');
      if (!methods.has('crypto:USDC')) methods.add('crypto:USDC');
      const paymentMethods = Array.from(methods).sort((a, b) => a.localeCompare(b));

      return {
        ok: true,
        data: {
          platforms: platformsRes.data || [],
          customers: customersRes.data || [],
          employees,
          paymentMethods,
        },
      };
    } catch (err: any) {
      return { ok: false, error: err?.message ?? String(err) };
    }
  },

  /**
   * Fetch orders in a date range and related order_items and payments.
   * Filters may include: from, to (ISO strings), customerId, platformId, employeeId, paymentMethod
   */
  async fetchOrdersWithDetails(filters: {
    from?: string;
    to?: string;
    customerId?: string | null;
    platformId?: string | null;
    employeeId?: string | null;
    paymentMethod?: string | null;
  }): Promise<RepoResult<any>> {
    try {
      let query = supabase.from('orders').select('*').order('created_at', { ascending: false });

        if (filters.from) query = query.gte('created_at', filters.from);
        if (filters.to) query = query.lte('created_at', filters.to);
        if (filters.customerId) query = query.eq('customer_id', filters.customerId);
        if (filters.employeeId) query = query.eq('created_by', filters.employeeId);
        // If paymentMethod contains a subtype (format: base:subtype) we'll filter by base method at order level
        if (filters.paymentMethod) {
          const [baseRaw] = String(filters.paymentMethod).split(':');
          const base = String(baseRaw || '').trim();
          if (base) query = query.ilike('payment_method', `%${base}%`);
        }

      const { data: orders, error: ordersError } = await query;
      if (ordersError) return { ok: false, error: ordersError.message };

      const orderIds = (orders || []).map((o: any) => o.id).filter(Boolean);

      // Debug: log requested order ids for easier correlation when payments are missing
      console.debug('[reportRepository] orderIds', orderIds);

      // If no orders found, return empty structure early
      if (orderIds.length === 0) {
        return { ok: true, data: { orders: [], items: [], payments: [] } };
      }

      const [itemsRes, paymentsRes] = await Promise.all([
        supabase
          .from('order_items')
          .select('*, game_coins(id,platform,cost_price)')
          .in('order_id', orderIds),
        supabase.from('payment_details').select('*').in('order_id', orderIds),
      ]);

      if (itemsRes.error) return { ok: false, error: itemsRes.error.message };
      if (paymentsRes.error) return { ok: false, error: paymentsRes.error.message };

      // Debug: when filtering by bank subtype, log orders/payments to browser console
      if (filters.paymentMethod && String(filters.paymentMethod).toLowerCase().startsWith('bank')) {
        console.debug('[reportRepository] fetched orders count', (orders || []).length);
        console.debug('[reportRepository] fetched payments', paymentsRes.data || []);
      }

      // Optionally filter by platformId at item level if provided
      const items = (itemsRes.data || []).filter((it: any) =>
        filters.platformId ? it.platform_id === filters.platformId : true,
      );

      // Start with all fetched orders; we'll narrow below by platform and/or payment subtypes
      let finalOrders = orders || [];

      // If a platformId filter was provided, only keep orders that contain at least one item
      // for the requested platform. `items` was already filtered to the selected platform above.
      if (filters.platformId) {
        const orderIdsWithPlatform = new Set((items || []).map((it: any) => it.order_id));
        finalOrders = (finalOrders || []).filter((o: any) => orderIdsWithPlatform.has(o.id));
      }
      if (filters.paymentMethod && filters.paymentMethod.includes(':')) {
        const [base, subtypeRaw] = String(filters.paymentMethod).split(':');
        const subtype = subtypeRaw || '';
        const payments = paymentsRes.data || [];
        const matchingOrderIds = new Set<string>();

        for (const p of payments) {
          const pmRaw = String(p.payment_method || '').toLowerCase();
          const baseLower = String(base || '').toLowerCase();

          // Flexible match: allow stored values like 'Bank Transfer' to match base 'bank'
          if (!pmRaw.includes(baseLower)) continue;

          if (!subtype) {
            matchingOrderIds.add(p.order_id);
            continue;
          }

          // For crypto subtypes we created values like `crypto:USDT` or `crypto:bep20`.
          if (baseLower === 'crypto' && subtype) {
            const sub = String(subtype).trim();
            if (
              (p.crypto_currency && String(p.crypto_currency).toUpperCase() === sub.toUpperCase()) ||
              (p.crypto_network && String(p.crypto_network).toLowerCase() === sub.toLowerCase())
            ) {
              matchingOrderIds.add(p.order_id);
            }
          }

          if (baseLower === 'bank') {
            // Try to match subtype against multiple possible fields: explicit bank_transaction_type
            // or a nested `payment_data.transaction_type` (some rows store the type inside JSON).
            let rawType = '';
            try {
              if (p.bank_transaction_type) rawType = String(p.bank_transaction_type);
              else if (p.payment_data) {
                // payment_data may be a JSON string or an object depending on how it's stored
                const pd = typeof p.payment_data === 'string' ? JSON.parse(p.payment_data) : p.payment_data;
                rawType = String(pd?.transaction_type ?? pd?.transactionType ?? '');
              }
            } catch (e) {
              rawType = '';
            }

            const sub = String(subtype).trim();
            const normalize = (x: string) => String(x || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            const nRaw = normalize(rawType);
            const nSub = normalize(sub);
            if (nRaw && (nRaw === nSub || nRaw.includes(nSub) || nSub.includes(nRaw))) {
              matchingOrderIds.add(p.order_id);
              continue;
            }

            // As a fallback, also check the payment_method text itself for the subtype string
            const pmNormalized = pmRaw.replace(/[^a-z0-9]/g, '');
            if (pmNormalized.includes(nSub) || nSub.includes(pmNormalized)) {
              matchingOrderIds.add(p.order_id);
              continue;
            }
          }

          if (baseLower === 'cash') {
            if (!subtype) matchingOrderIds.add(p.order_id);
          }
        }

        finalOrders = (finalOrders || []).filter((o: any) => matchingOrderIds.has(o.id));
      }

      return { ok: true, data: { orders: finalOrders, items, payments: paymentsRes.data || [] } };
    } catch (err: any) {
      return { ok: false, error: err?.message ?? String(err) };
    }
  },
};

export default reportRepository;
