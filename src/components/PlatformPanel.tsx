/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { Edit, Trash2, Plus, Package, AlertTriangle, History } from 'lucide-react';
import { usePlatforms } from '../domains/platforms/hooks/usePlatforms';
// Domain hook encapsulates fetching, filtering, pagination, and CRUD
import type { Platform, PlatformCreateData } from '../types/platform';
import Pagination from './common/Pagination';
import TableSkeleton from './common/TableSkeleton';
import ErrorDisplay from './common/ErrorDisplay';
import CreatePlatformModal from './platforms/CreatePlatformModal';
import EditPlatformModal from './platforms/EditPlatformModal';
import DeletePlatformModal from './platforms/DeletePlatformModal';
import PurchaseStockModal from './platforms/PurchaseStockModal';
import PlatformPurchaseHistoryModal from './platforms/PlatformPurchaseHistoryModal';
import AllPurchaseHistoryModal from './platforms/AllPurchaseHistoryModal';
import RestorePlatformsModal from './platforms/RestorePlatformsModal';
import { INVENTORY_CONSTANTS } from '../utils/constants';

const PlatformPanel: React.FC = () => {
  const {
    // data
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    platforms,
    deletedPlatforms,
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
    setPage,
    setPageSize,
    setPhPage,
    setPhPageSize,
    setAllPhPage,
    setAllPhPageSize,
    setCreateForm,
    setEditForm,

    // actions
    fetchDeletedPlatforms,
    fetchPurchaseHistoryFor,
    fetchAllPurchaseHistory,
    createPlatform,
    updatePlatform,
    softDelete,
    restore,
  } = usePlatforms();

  const [localError, setLocalError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showAllHistoryModal, setShowAllHistoryModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [showRestoreModal, setShowRestoreModal] = useState(false);

  const [purchaseForm, setPurchaseForm] = useState({
    quantity: 0,
    cost_per_unit: 0,
    supplier: '',
    notes: '',
  });

  // Local wrappers around domain forms
  const [form, setForm] = useState<PlatformCreateData>({
    platform_name: '',
    account_type: '',
    inventory: 0,
    cost_price: 0,
    low_stock_alert: INVENTORY_CONSTANTS.LOW_STOCK_DEFAULT,
  });

  // ensure local create form mirrors domain form
  React.useEffect(() => {
    setForm(createForm);
  }, [createForm]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === 'inventory' || name === 'cost_price' || name === 'low_stock_alert'
          ? parseFloat(value) || 0
          : value,
    }));
    // keep domain form in sync
    setCreateForm((prev) => ({
      ...prev,
      [name]:
        name === 'inventory' || name === 'cost_price' || name === 'low_stock_alert'
          ? parseFloat(value) || 0
          : value,
    }));
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]:
        name === 'inventory' || name === 'cost_price' || name === 'low_stock_alert'
          ? parseFloat(value) || 0
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    const res = await createPlatform(form);
    if (!res.ok) {
      setLocalError('Failed to create platform: ' + ('error' in res ? res.error : 'unknown'));
      return;
    }

    setForm({
      platform_name: '',
      account_type: '',
      inventory: 0,
      cost_price: 0,
      low_stock_alert: INVENTORY_CONSTANTS.LOW_STOCK_DEFAULT,
    });
    setCreateForm({
      platform_name: '',
      account_type: '',
      inventory: 0,
      cost_price: 0,
      low_stock_alert: INVENTORY_CONSTANTS.LOW_STOCK_DEFAULT,
    });
    setShowCreateModal(false);
  };

  const handleEdit = (platform: Platform) => {
    setSelectedPlatform(platform);
    setEditForm({
      platform_name: platform.platform, // Map platform to platform_name for the form
      account_type: platform.account_type,
      inventory: platform.inventory,
      cost_price: platform.cost_price,
      low_stock_alert: platform.low_stock_alert,
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlatform) return;

    setLocalError(null);

    const res = await updatePlatform(selectedPlatform.id, editForm);
    if (!res.ok) {
      setLocalError('Failed to update platform: ' + ('error' in res ? res.error : 'unknown'));
      return;
    }

    setShowEditModal(false);
    setSelectedPlatform(null);
  };

  const handleDelete = (platform: Platform) => {
    setSelectedPlatform(platform);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedPlatform) return;

    setLocalError(null);

    const res = await softDelete(selectedPlatform.id);
    if (!res.ok) {
      setLocalError('Failed to delete platform: ' + ('error' in res ? res.error : 'unknown'));
      return;
    }

    setShowDeleteModal(false);
    setSelectedPlatform(null);
  };

  const handleRestoreClick = async (platform: Platform) => {
    setSelectedPlatform(platform);
    setLocalError(null);

    try {
      const res = await restore(platform.id);
      if (!res.ok) throw new Error('error' in res ? res.error : 'unknown');

      setShowRestoreModal(false);
      setSelectedPlatform(null);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const openPurchaseModal = (platform: Platform) => {
    setSelectedPlatform(platform);
    setPurchaseForm({
      quantity: 0,
      cost_per_unit: platform.cost_price,
      supplier: '',
      notes: '',
    });
    setShowPurchaseModal(true);
  };

  const showPurchaseHistory = async (platform: Platform) => {
    setSelectedPlatform(platform);
    await fetchPurchaseHistoryFor(platform.id);
    setShowHistoryModal(true);
  };

  const handlePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlatform) return;

    setLocalError(null);

    try {
      const newInventory = selectedPlatform.inventory + purchaseForm.quantity;
      const totalCost = purchaseForm.quantity * purchaseForm.cost_per_unit;

      // Update platform inventory via domain hook
      const upd = await updatePlatform(selectedPlatform.id, {
        platform_name: selectedPlatform.platform,
        account_type: selectedPlatform.account_type,
        inventory: newInventory,
        cost_price: selectedPlatform.cost_price,
        low_stock_alert: selectedPlatform.low_stock_alert,
      });
      if (!upd.ok) throw new Error('error' in upd ? upd.error : 'unknown');

      // Try to record purchase history (will work once schema is updated)
      try {
        // Lazy import to avoid top-level dependency here
        const { purchaseHistoryRepository } = await import(
          '../repositories/purchaseHistoryRepository'
        );
        await purchaseHistoryRepository.record({
          platform_id: selectedPlatform.id,
          quantity: purchaseForm.quantity,
          cost_per_unit: purchaseForm.cost_per_unit,
          total_cost: totalCost,
          supplier: purchaseForm.supplier || null,
          notes: purchaseForm.notes || null,
          previous_inventory: selectedPlatform.inventory,
          new_inventory: newInventory,
          purchased_by: null,
          created_at: new Date().toISOString(),
        } as any);
      } catch {
        // non-fatal
      }

      setPurchaseForm({
        quantity: 0,
        cost_per_unit: 0,
        supplier: '',
        notes: '',
      });
      setShowPurchaseModal(false);
      setSelectedPlatform(null);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to update inventory');
    } finally {
      // no-op
    }
  };

  const combinedError = error || localError;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <ErrorDisplay message={combinedError} />

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Platform Management</h2>
        <div className="flex gap-3">
          <button
            onClick={() => {
              fetchAllPurchaseHistory();
              setShowAllHistoryModal(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <History className="w-4 h-4 mr-2" />
            View All History
          </button>
          <button
            onClick={() => {
              fetchDeletedPlatforms();
              setShowRestoreModal(true);
            }}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center mr-2"
          >
            <History className="w-4 h-4 mr-2" />
            Restore Platforms
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Platform
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <select
          value={filterAccountType}
          onChange={(e) => setFilterAccountType(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
        >
          <option value="all">All Account Types</option>
          {uniqueAccountTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        <select
          value={filterStock}
          onChange={(e) => setFilterStock(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
        >
          <option value="all">All Stock Levels</option>
          <option value="low_stock">Low Stock (below threshold)</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>
      </div>

      {/* Platforms Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Platform Name</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Account Type</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Inventory</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Cost Price</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeleton rows={Math.min(pageSize, 8)} columns={6} />
            ) : total === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500">
                  No platforms found
                </td>
              </tr>
            ) : (
              paginated.map((platform) => (
                <tr key={platform.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{platform.platform}</td>
                  <td className="py-3 px-4">{platform.account_type}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <span
                        className={`${
                          platform.inventory < platform.low_stock_alert
                            ? 'text-red-600 font-semibold'
                            : ''
                        }`}
                      >
                        {platform.inventory}
                      </span>
                      {platform.inventory < platform.low_stock_alert && (
                        <AlertTriangle className="w-4 h-4 ml-2 text-red-500" />
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">${platform.cost_price.toFixed(2)}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        platform.inventory === 0
                          ? 'bg-red-100 text-red-800'
                          : platform.inventory < platform.low_stock_alert
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {platform.inventory === 0
                        ? 'Out of Stock'
                        : platform.inventory < platform.low_stock_alert
                          ? 'Low Stock'
                          : 'In Stock'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(platform)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Edit Platform"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openPurchaseModal(platform)}
                        className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                        title="Add Stock"
                      >
                        <Package className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => showPurchaseHistory(platform)}
                        className="p-2 text-pink-600 hover:bg-pink-100 rounded-lg transition-colors"
                        title="Purchase History"
                      >
                        <History className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(platform)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Delete Platform"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalItems={total}
        itemsPerPage={pageSize}
        onPageChange={setPage}
        onItemsPerPageChange={(n: number) => setPageSize(n)}
      />

      {/* Create Modal */}
      <CreatePlatformModal
        isOpen={showCreateModal}
        loading={loading}
        form={form}
        onChange={handleInputChange}
        onSubmit={handleSubmit}
        onClose={() => setShowCreateModal(false)}
      />

      {/* Edit Modal */}
      {/* Edit Modal */}
      <EditPlatformModal
        isOpen={showEditModal && !!selectedPlatform}
        loading={loading}
        form={editForm}
        onChange={handleEditInputChange}
        onSubmit={handleEditSubmit}
        onClose={() => setShowEditModal(false)}
      />

      {/* Delete Confirmation Modal */}
      {/* Delete Confirmation Modal */}
      <DeletePlatformModal
        isOpen={showDeleteModal && !!selectedPlatform}
        loading={loading}
        platform={selectedPlatform}
        onConfirm={confirmDelete}
        onClose={() => setShowDeleteModal(false)}
      />

      <PurchaseStockModal
        isOpen={showPurchaseModal}
        loading={loading}
        platform={selectedPlatform}
        form={purchaseForm}
        onChange={(changes) => setPurchaseForm((prev) => ({ ...prev, ...changes }))}
        onSubmit={handlePurchaseSubmit}
        onClose={() => setShowPurchaseModal(false)}
      />

      <PlatformPurchaseHistoryModal
        isOpen={showHistoryModal && !!selectedPlatform}
        loading={loading}
        platformName={selectedPlatform?.platform || null}
        purchaseHistory={purchaseHistory}
        paginated={paginatedPh}
        page={phPage}
        pageSize={phPageSize}
        onPageChange={setPhPage}
        onItemsPerPageChange={(n: number) => setPhPageSize(n)}
        onClose={() => setShowHistoryModal(false)}
      />

      <AllPurchaseHistoryModal
        isOpen={showAllHistoryModal}
        loading={loading}
        purchaseHistory={allPurchaseHistory}
        paginated={paginatedAllPh}
        page={allPhPage}
        pageSize={allPhPageSize}
        onPageChange={setAllPhPage}
        onItemsPerPageChange={(n: number) => setAllPhPageSize(n)}
        onClose={() => setShowAllHistoryModal(false)}
      />

      <RestorePlatformsModal
        isOpen={showRestoreModal}
        loading={loading}
        platforms={deletedPlatforms}
        onRestore={handleRestoreClick}
        onClose={() => setShowRestoreModal(false)}
      />
    </div>
  );
};

export default PlatformPanel;
