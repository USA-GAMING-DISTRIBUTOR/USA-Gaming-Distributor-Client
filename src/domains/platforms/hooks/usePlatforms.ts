import { useCallback, useEffect, useMemo, useState } from 'react';
import { platformRepository } from '@repositories/platformRepository';
import { purchaseHistoryRepository } from '@repositories/purchaseHistoryRepository';
import { getError } from '../../..//types/repository';
import { platformCreateSchema, formatZodErrors } from '../validation/schemas';
import type { RepoResult } from '../../../types/repository';
import type { Platform, PlatformCreateData } from '../../../types/platform';
import type { PurchaseHistory } from '../../../types/purchaseHistory';
import { INVENTORY_CONSTANTS, UI_CONSTANTS } from '@utils/constants';

export type StockFilter = 'all' | 'low_stock' | 'out_of_stock';

export function usePlatforms() {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [deletedPlatforms, setDeletedPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filterAccountType, setFilterAccountType] = useState<string>('all');
  const [filterStock, setFilterStock] = useState<StockFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [createForm, setCreateForm] = useState<PlatformCreateData>({
    platform_name: '',
    account_type: '',
    inventory: 0,
    cost_price: 0,
    low_stock_alert: INVENTORY_CONSTANTS.LOW_STOCK_DEFAULT,
  });

  const [editForm, setEditForm] = useState<PlatformCreateData>({
    platform_name: '',
    account_type: '',
    inventory: 0,
    cost_price: 0,
    low_stock_alert: INVENTORY_CONSTANTS.LOW_STOCK_DEFAULT,
  });

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(UI_CONSTANTS.ITEMS_PER_PAGE as number);

  // Purchase history state
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistory[]>([]);
  const [allPurchaseHistory, setAllPurchaseHistory] = useState<PurchaseHistory[]>([]);
  const [phPage, setPhPage] = useState(1);
  const [phPageSize, setPhPageSize] = useState<number>(
    UI_CONSTANTS.PURCHASE_HISTORY_PAGE_SIZE as number,
  );
  const [allPhPage, setAllPhPage] = useState(1);
  const [allPhPageSize, setAllPhPageSize] = useState<number>(
    UI_CONSTANTS.PURCHASE_HISTORY_PAGE_SIZE as number,
  );

  const fetchPlatforms = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await platformRepository.list(false);
    if (res.ok) setPlatforms(res.data);
    else setError(getError(res));
    setLoading(false);
  }, []);

  const fetchDeletedPlatforms = useCallback(async () => {
    setLoading(true);
    const res = await platformRepository.list(true);
    if (res.ok) setDeletedPlatforms(res.data.filter((p) => p.deleted_at));
    else setError(getError(res));
    setLoading(false);
  }, []);

  const fetchPurchaseHistoryFor = useCallback(async (platformId: string) => {
    setLoading(true);
    const res = await purchaseHistoryRepository.listForPlatform(platformId);
    if (res.ok) setPurchaseHistory(res.data);
    else setError(getError(res));
    setLoading(false);
  }, []);

  const fetchAllPurchaseHistory = useCallback(async () => {
    setLoading(true);
    const res = await purchaseHistoryRepository.listAll();
    if (res.ok) setAllPurchaseHistory(res.data);
    else setError(getError(res));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPlatforms();
  }, [fetchPlatforms]);

  const filtered = useMemo(() => {
    return platforms.filter((p) => {
      const matchesType = filterAccountType === 'all' || p.account_type === filterAccountType;
      const matchesStock =
        filterStock === 'all' ||
        (filterStock === 'low_stock' && p.inventory < p.low_stock_alert && p.inventory > 0) ||
        (filterStock === 'out_of_stock' && p.inventory === 0);
      const matchesSearch =
        searchQuery === '' ||
        p.platform.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.account_type.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesStock && matchesSearch;
    });
  }, [platforms, filterAccountType, filterStock, searchQuery]);

  // Memoize pagination window calculations to keep array references stable
  const total = useMemo(() => filtered.length, [filtered]);
  const { start, end } = useMemo(() => {
    const s = (page - 1) * pageSize;
    return { start: s, end: s + pageSize };
  }, [page, pageSize]);
  const paginated = useMemo(() => filtered.slice(start, end), [filtered, start, end]);

  // Handlers
  const createPlatform = useCallback(
    async (form: PlatformCreateData): Promise<RepoResult<Platform>> => {
      setLoading(true);
      setError(null);
      // Validate form
      const parsed = platformCreateSchema.safeParse(form);
      if (!parsed.success) {
        const message = formatZodErrors(parsed.error.issues);
        setError(message);
        setLoading(false);
        return { ok: false, error: message, code: 'VALIDATION_ERROR' } as RepoResult<Platform>;
      }

      const res = await platformRepository.create({
        platform: parsed.data.platform_name,
        account_type: parsed.data.account_type,
        inventory: parsed.data.inventory,
        cost_price: parsed.data.cost_price,
        low_stock_alert: parsed.data.low_stock_alert,
        is_visible_to_employee: parsed.data.is_visible_to_employee ?? true,
      });
      if (!res.ok) setError(getError(res));
      await fetchPlatforms();
      setLoading(false);
      return res;
    },
    [fetchPlatforms],
  );

  const updatePlatform = useCallback(
    async (id: string, form: PlatformCreateData, userId?: string): Promise<RepoResult<Platform>> => {
      setLoading(true);
      setError(null);
      const parsed = platformCreateSchema.partial().safeParse(form);
      if (!parsed.success) {
        const message = formatZodErrors(parsed.error.issues);
        setError(message);
        setLoading(false);
        return { ok: false, error: message, code: 'VALIDATION_ERROR' } as RepoResult<Platform>;
      }
      const d = parsed.data;
      const res = await platformRepository.update(id, {
        platform: d.platform_name,
        account_type: d.account_type,
        inventory: d.inventory,
        cost_price: d.cost_price,
        low_stock_alert: d.low_stock_alert,
        is_visible_to_employee: d.is_visible_to_employee,
        last_edited_by: userId || null,
        last_edited_at: userId ? new Date().toISOString() : null,
      });
      if (!res.ok) setError(getError(res));
      await fetchPlatforms();
      setLoading(false);
      return res;
    },
    [fetchPlatforms],
  );

  const softDelete = useCallback(
    async (id: string) => {
      setLoading(true);
      const res = await platformRepository.softDelete(id);
      if (!res.ok) setError(getError(res));
      await fetchPlatforms();
      setLoading(false);
      return res;
    },
    [fetchPlatforms],
  );

  const restore = useCallback(
    async (id: string) => {
      setLoading(true);
      const res = await platformRepository.restore(id);
      if (!res.ok) setError(getError(res));
      await Promise.all([fetchPlatforms(), fetchDeletedPlatforms()]);
      setLoading(false);
      return res;
    },
    [fetchPlatforms, fetchDeletedPlatforms],
  );

  // Purchase history pagination helpers
  const { phStart, phEnd } = useMemo(() => {
    const s = (phPage - 1) * phPageSize;
    return { phStart: s, phEnd: s + phPageSize };
  }, [phPage, phPageSize]);
  const paginatedPh = useMemo(
    () => purchaseHistory.slice(phStart, phEnd),
    [purchaseHistory, phStart, phEnd],
  );

  const { allPhStart, allPhEnd } = useMemo(() => {
    const s = (allPhPage - 1) * allPhPageSize;
    return { allPhStart: s, allPhEnd: s + allPhPageSize };
  }, [allPhPage, allPhPageSize]);
  const paginatedAllPh = useMemo(
    () => allPurchaseHistory.slice(allPhStart, allPhEnd),
    [allPurchaseHistory, allPhStart, allPhEnd],
  );

  const uniqueAccountTypes = useMemo(
    () => Array.from(new Set(platforms.map((p) => p.account_type))),
    [platforms],
  );

  return {
    // data
    platforms,
    deletedPlatforms,
    filtered,
    paginated,
    total,
    purchaseHistory,
    allPurchaseHistory,
    paginatedPh,
    paginatedAllPh,
    uniqueAccountTypes,

    // ui state
    loading,
    error,
    filterAccountType,
    filterStock,
    searchQuery,
    page,
    pageSize,
    phPage,
    phPageSize,
    allPhPage,
    allPhPageSize,
    createForm,
    editForm,

    // setters
    setFilterAccountType,
    setFilterStock,
    setSearchQuery,
    setPage,
    setPageSize,
    setPhPage,
    setPhPageSize,
    setAllPhPage,
    setAllPhPageSize,
    setCreateForm,
    setEditForm,

    // actions
    fetchPlatforms,
    fetchDeletedPlatforms,
    fetchPurchaseHistoryFor,
    fetchAllPurchaseHistory,
    createPlatform,
    updatePlatform,
    softDelete,
    restore,
  };
}
