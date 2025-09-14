/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import {
  Edit,
  Trash2,
  Plus,
  Package,
  AlertTriangle,
  X,
  History,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import type { Platform, PlatformCreateData } from "../types/platform";
import type { PurchaseHistory } from "../types/purchaseHistory";

const PlatformPanel: React.FC = () => {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(
    null
  );
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistory[]>([]);

  const [form, setForm] = useState<PlatformCreateData>({
    platform_name: "",
    account_type: "",
    inventory: 0,
    cost_price: 0,
  });

  const [editForm, setEditForm] = useState<PlatformCreateData>({
    platform_name: "",
    account_type: "",
    inventory: 0,
    cost_price: 0,
  });

  const [purchaseForm, setPurchaseForm] = useState({
    quantity: 0,
    cost_per_unit: 0,
    supplier: "",
    notes: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<{
    account_type: string;
    stock_status: "all" | "low_stock" | "out_of_stock";
  }>({
    account_type: "all",
    stock_status: "all",
  });

  const fetchPlatforms = async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from("game_coins")
      .select("*")
      .order("platform", { ascending: true });

    if (fetchError) {
      setError("Failed to fetch platforms: " + fetchError.message);
      setLoading(false);
      return;
    }

    // Transform data to match our updated Platform interface
    const transformedPlatforms: Platform[] = (data || []).map(
      (platform: Record<string, unknown>) => ({
        id: String(platform.id || ""),
        platform_name: String(
          platform.platform || platform.platform_name || ""
        ),
        account_type: String(platform.account_type || "Standard"),
        inventory: Number(platform.inventory || 0),
        cost_price: Number(platform.cost_price || 0),
        created_at: platform.created_at ? String(platform.created_at) : null,
        updated_at: platform.updated_at
          ? String(platform.updated_at)
          : platform.created_at
          ? String(platform.created_at)
          : null,
      })
    );

    setPlatforms(transformedPlatforms);
    setLoading(false);
  };

  const fetchPurchaseHistory = async (platformId: string) => {
    setLoading(true);
    try {
      // Note: Using any type to bypass TypeScript limitations until schema is updated
      const { data, error } = await supabase
        .from("purchase_history" as any)
        .select(
          `
          *,
          game_coins!purchase_history_platform_id_fkey(platform),
          users!purchase_history_purchased_by_fkey(username)
        `
        )
        .eq("platform_id", platformId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        const transformedHistory: PurchaseHistory[] = data.map((item: any) => ({
          id: item.id,
          platform_id: item.platform_id,
          quantity: item.quantity,
          cost_per_unit: item.cost_per_unit,
          total_cost: item.total_cost,
          supplier: item.supplier,
          notes: item.notes,
          previous_inventory: item.previous_inventory,
          new_inventory: item.new_inventory,
          purchased_by: item.purchased_by,
          created_at: item.created_at,
          platform_name: item.game_coins?.platform || "Unknown",
          purchased_by_username: item.users?.username || "System",
        }));
        setPurchaseHistory(transformedHistory);
      } else {
        console.warn("Failed to fetch purchase history:", error);
        setPurchaseHistory([]);
      }
    } catch (err) {
      console.warn("Purchase history table may not exist yet:", err);
      setPurchaseHistory([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPlatforms();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === "inventory" || name === "cost_price"
          ? parseFloat(value) || 0
          : value,
    }));
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]:
        name === "inventory" || name === "cost_price"
          ? parseFloat(value) || 0
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: insertError } = await supabase.from("game_coins").insert([
      {
        platform: form.platform_name,
        account_type: form.account_type,
        inventory: form.inventory,
        cost_price: form.cost_price,
      },
    ]);

    if (insertError) {
      setError("Failed to create platform: " + insertError.message);
      setLoading(false);
      return;
    }

    setForm({
      platform_name: "",
      account_type: "",
      inventory: 0,
      cost_price: 0,
    });
    setShowCreateModal(false);
    fetchPlatforms();
    setLoading(false);
  };

  const handleEdit = (platform: Platform) => {
    setSelectedPlatform(platform);
    setEditForm({
      platform_name: platform.platform_name,
      account_type: platform.account_type,
      inventory: platform.inventory,
      cost_price: platform.cost_price,
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlatform) return;

    setLoading(true);
    setError(null);

    const { error: updateError } = await supabase
      .from("game_coins")
      .update({
        platform: editForm.platform_name,
        account_type: editForm.account_type,
        inventory: editForm.inventory,
        cost_price: editForm.cost_price,
      })
      .eq("id", selectedPlatform.id);

    if (updateError) {
      setError("Failed to update platform: " + updateError.message);
      setLoading(false);
      return;
    }

    setShowEditModal(false);
    setSelectedPlatform(null);
    fetchPlatforms();
    setLoading(false);
  };

  const handleDelete = (platform: Platform) => {
    setSelectedPlatform(platform);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedPlatform) return;

    setLoading(true);
    setError(null);

    const { error: deleteError } = await supabase
      .from("game_coins")
      .delete()
      .eq("id", selectedPlatform.id);

    if (deleteError) {
      setError("Failed to delete platform: " + deleteError.message);
      setLoading(false);
      return;
    }

    setShowDeleteModal(false);
    setSelectedPlatform(null);
    fetchPlatforms();
    setLoading(false);
  };

  const openPurchaseModal = (platform: Platform) => {
    setSelectedPlatform(platform);
    setPurchaseForm({
      quantity: 0,
      cost_per_unit: platform.cost_price,
      supplier: "",
      notes: "",
    });
    setShowPurchaseModal(true);
  };

  const showPurchaseHistory = async (platform: Platform) => {
    setSelectedPlatform(platform);
    await fetchPurchaseHistory(platform.id);
    setShowHistoryModal(true);
  };

  const handlePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlatform) return;

    setLoading(true);
    setError(null);

    try {
      const newInventory = selectedPlatform.inventory + purchaseForm.quantity;
      const totalCost = purchaseForm.quantity * purchaseForm.cost_per_unit;

      // Update platform inventory
      const { error: updateError } = await supabase
        .from("game_coins")
        .update({
          inventory: newInventory,
        })
        .eq("id", selectedPlatform.id);

      if (updateError) throw updateError;

      // Try to record purchase history (will work once schema is updated)
      try {
        const { error: historyError } = await supabase
          .from("purchase_history" as any)
          .insert([
            {
              platform_id: selectedPlatform.id,
              quantity: purchaseForm.quantity,
              cost_per_unit: purchaseForm.cost_per_unit,
              total_cost: totalCost,
              supplier: purchaseForm.supplier || null,
              notes: purchaseForm.notes || null,
              previous_inventory: selectedPlatform.inventory,
              new_inventory: newInventory,
              purchased_by: null, // You can add user context here if needed
            },
          ]);

        if (historyError) {
          console.warn("Failed to record purchase history:", historyError);
          // Don't fail the entire operation for history recording
        }
      } catch (historyErr) {
        console.warn("Purchase history table may not exist yet:", historyErr);
      }

      setPurchaseForm({
        quantity: 0,
        cost_per_unit: 0,
        supplier: "",
        notes: "",
      });
      setShowPurchaseModal(false);
      setSelectedPlatform(null);
      fetchPlatforms();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update inventory"
      );
    } finally {
      setLoading(false);
    }
  };

  // Filter platforms
  const filteredPlatforms = platforms.filter((platform) => {
    const matchesAccountType =
      filter.account_type === "all" ||
      platform.account_type === filter.account_type;
    const matchesStockStatus =
      filter.stock_status === "all" ||
      (filter.stock_status === "low_stock" &&
        platform.inventory < 100 &&
        platform.inventory > 0) ||
      (filter.stock_status === "out_of_stock" && platform.inventory === 0);

    return matchesAccountType && matchesStockStatus;
  });

  // Get unique account types for filter dropdown
  const uniqueAccountTypes = [...new Set(platforms.map((p) => p.account_type))];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          Platform Management
        </h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Platform
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <select
          value={filter.account_type}
          onChange={(e) =>
            setFilter((prev) => ({ ...prev, account_type: e.target.value }))
          }
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
          value={filter.stock_status}
          onChange={(e) =>
            setFilter((prev) => ({
              ...prev,
              stock_status: e.target.value as
                | "all"
                | "low_stock"
                | "out_of_stock",
            }))
          }
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
        >
          <option value="all">All Stock Levels</option>
          <option value="low_stock">Low Stock (&lt; 100)</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>
      </div>

      {/* Platforms Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Platform Name
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Account Type
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Inventory
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Cost Price
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Status
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-8">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
                  </div>
                </td>
              </tr>
            ) : filteredPlatforms.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500">
                  No platforms found
                </td>
              </tr>
            ) : (
              filteredPlatforms.map((platform) => (
                <tr
                  key={platform.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 px-4 font-medium">
                    {platform.platform_name}
                  </td>
                  <td className="py-3 px-4">{platform.account_type}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <span
                        className={`${
                          platform.inventory < 100
                            ? "text-red-600 font-semibold"
                            : ""
                        }`}
                      >
                        {platform.inventory}
                      </span>
                      {platform.inventory < 100 && (
                        <AlertTriangle className="w-4 h-4 ml-2 text-red-500" />
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    ${platform.cost_price.toFixed(2)}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        platform.inventory === 0
                          ? "bg-red-100 text-red-800"
                          : platform.inventory < 100
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {platform.inventory === 0
                        ? "Out of Stock"
                        : platform.inventory < 100
                        ? "Low Stock"
                        : "In Stock"}
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

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add New Platform</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Platform Name
                </label>
                <input
                  type="text"
                  name="platform_name"
                  value={form.platform_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Type
                </label>
                <input
                  type="text"
                  name="account_type"
                  value={form.account_type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="e.g., Standard, Premium, Enterprise"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Initial Inventory
                </label>
                <input
                  type="number"
                  name="inventory"
                  value={form.inventory}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cost Price (in cents)
                </label>
                <input
                  type="number"
                  name="cost_price"
                  value={form.cost_price}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50"
                >
                  {loading ? "Creating..." : "Create Platform"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedPlatform && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Edit Platform</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Platform Name
                </label>
                <input
                  type="text"
                  name="platform_name"
                  value={editForm.platform_name}
                  onChange={handleEditInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Type
                </label>
                <input
                  type="text"
                  name="account_type"
                  value={editForm.account_type}
                  onChange={handleEditInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="e.g., Standard, Premium, Enterprise"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Inventory
                </label>
                <input
                  type="number"
                  name="inventory"
                  value={editForm.inventory}
                  onChange={handleEditInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cost Price (in cents)
                </label>
                <input
                  type="number"
                  name="cost_price"
                  value={editForm.cost_price}
                  onChange={handleEditInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50"
                >
                  {loading ? "Updating..." : "Update Platform"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedPlatform && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-red-600">
                Confirm Delete
              </h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-gray-700 mb-6">
              Are you sure you want to delete the platform "
              {selectedPlatform.platform_name}"? This action cannot be undone.
            </p>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? "Deleting..." : "Delete Platform"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Stock Modal */}
      {showPurchaseModal && selectedPlatform && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Add Stock - {selectedPlatform.platform_name}
              </h3>
              <button
                onClick={() => setShowPurchaseModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePurchaseSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity to Add
                </label>
                <input
                  type="number"
                  value={purchaseForm.quantity}
                  onChange={(e) =>
                    setPurchaseForm((prev) => ({
                      ...prev,
                      quantity: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cost per Unit
                </label>
                <input
                  type="number"
                  value={purchaseForm.cost_per_unit}
                  onChange={(e) =>
                    setPurchaseForm((prev) => ({
                      ...prev,
                      cost_per_unit: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier
                </label>
                <input
                  type="text"
                  value={purchaseForm.supplier}
                  onChange={(e) =>
                    setPurchaseForm((prev) => ({
                      ...prev,
                      supplier: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Supplier name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  value={purchaseForm.notes}
                  onChange={(e) =>
                    setPurchaseForm((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Additional notes"
                />
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">
                  Current Stock:{" "}
                  <span className="font-medium">
                    {selectedPlatform.inventory}
                  </span>
                </p>
                <p className="text-sm text-gray-600">
                  After Addition:{" "}
                  <span className="font-medium">
                    {selectedPlatform.inventory + purchaseForm.quantity}
                  </span>
                </p>
                <p className="text-sm text-gray-600">
                  Total Cost:{" "}
                  <span className="font-medium">
                    $
                    {(
                      purchaseForm.quantity * purchaseForm.cost_per_unit
                    ).toFixed(2)}
                  </span>
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPurchaseModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || purchaseForm.quantity <= 0}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {loading ? "Adding..." : "Add Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Purchase History Modal */}
      {showHistoryModal && selectedPlatform && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Purchase History - {selectedPlatform.platform_name}
              </h3>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {purchaseHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <History className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No purchase history found for this platform.</p>
                <p className="text-sm mt-2">
                  Add stock to start tracking purchase history.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Date
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Quantity
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Cost/Unit
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Total Cost
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Supplier
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Inventory Change
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseHistory.map((purchase) => (
                      <tr
                        key={purchase.id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3 px-4">
                          {new Date(purchase.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 font-medium">
                          {purchase.quantity}
                        </td>
                        <td className="py-3 px-4">
                          ${purchase.cost_per_unit.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 font-medium">
                          ${purchase.total_cost.toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          {purchase.supplier || "-"}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-600">
                            {purchase.previous_inventory} →{" "}
                            {purchase.new_inventory}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {purchase.notes || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatformPanel;
