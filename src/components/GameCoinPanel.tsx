import React, { useEffect, useState } from "react";
import { Edit, Trash2, Plus } from "lucide-react";
import { supabase } from "../lib/supabase";

interface Coin {
  id: string;
  platform: string;
  inventory: number;
  cost_price: number;
  created_at: string | null;
}

const GameCoinPanel: React.FC = () => {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    platform: "",
    inventory: "",
    cost_price: "",
  });
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    platform: "",
    inventory: "",
    cost_price: "",
  });
  const [error, setError] = useState<string | null>(null);

  const fetchCoins = async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from("game_coins")
      .select("id, platform, inventory, cost_price, created_at");
    if (fetchError) {
      setError("Failed to fetch game coins: " + fetchError.message);
      setLoading(false);
      return;
    }
    if (data) setCoins(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchCoins();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddCoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: addError } = await supabase.from("game_coins").insert([
      {
        platform: form.platform,
        inventory: Number(form.inventory),
        cost_price: Number(form.cost_price),
      },
    ]);
    if (addError) {
      setError("Failed to add game coin: " + addError.message);
      setLoading(false);
      return;
    }
    setForm({ platform: "", inventory: "", cost_price: "" });
    setShowModal(false);
    fetchCoins();
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    setError(null);
    const { error: deleteError } = await supabase
      .from("game_coins")
      .delete()
      .eq("id", id);
    if (deleteError) {
      setLoading(false);
      return;
    }
    fetchCoins();
    setLoading(false);
  };

  const handleEditClick = (coin: Coin) => {
    setEditId(coin.id);
    setEditForm({
      platform: coin.platform,
      inventory: coin.inventory.toString(),
      cost_price: coin.cost_price.toString(),
    });
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditCoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;

    setLoading(true);
    const { error } = await supabase
      .from("game_coins")
      .update({
        platform: editForm.platform,
        inventory: Number(editForm.inventory),
        cost_price: Number(editForm.cost_price),
      })
      .eq("id", editId);

    if (error) {
      setError("Failed to edit game coin: " + error.message);
      setLoading(false);
      return;
    }
    setEditId(null);
    setEditForm({ platform: "", inventory: "", cost_price: "" });
    fetchCoins();
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
      )}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Platforms</h2>
        <button
          className="bg-pink-500 text-white px-4 py-2 rounded-lg flex items-center"
          onClick={() => setShowModal(true)}
        >
          <Plus className="w-4 h-4 mr-2" /> Add Platform
        </button>
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-white/10 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-pink-600 to-pink-700 text-white p-6 flex-shrink-0">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold">Add Platform</h3>
                  <p className="text-pink-100 text-sm mt-1">Create a new gaming platform</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="text-pink-100 hover:text-white p-2 rounded-lg hover:bg-pink-600/50 transition-colors"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
            <form id="gamecoin-form" onSubmit={handleAddCoin} className="space-y-4">
              <input
                name="platform"
                value={form.platform}
                onChange={handleInputChange}
                placeholder="Platform"
                className="w-full px-3 py-2 border rounded"
                required
              />
              <input
                name="inventory"
                value={form.inventory}
                onChange={handleInputChange}
                placeholder="Inventory"
                type="number"
                min={0}
                className="w-full px-3 py-2 border rounded"
                required
              />
              <input
                name="cost_price"
                value={form.cost_price}
                onChange={handleInputChange}
                placeholder="Cost Price"
                type="number"
                min={0}
                className="w-full px-3 py-2 border rounded"
                required
              />
              </form>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end items-center flex-shrink-0">
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="gamecoin-form"
                  className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="py-2 px-4 text-left">Platform</th>
              <th className="py-2 px-4 text-left">Inventory</th>
              <th className="py-2 px-4 text-left">Cost Price</th>
              <th className="py-2 px-4 text-left">Created At</th>
              <th className="py-2 px-4 text-left"></th>
            </tr>
          </thead>
          <tbody>
            {coins.map((coin) => (
              <tr key={coin.id} className="border-b hover:bg-gray-50">
                <td className="py-2 px-4">
                  {editId === coin.id ? (
                    <form className="flex space-x-2" onSubmit={handleEditCoin}>
                      <input
                        name="platform"
                        value={editForm.platform}
                        onChange={handleEditInputChange}
                        className="px-2 py-1 rounded border"
                        required
                      />
                      <input
                        name="inventory"
                        type="number"
                        value={editForm.inventory}
                        onChange={handleEditInputChange}
                        className="px-2 py-1 rounded border"
                        required
                      />
                      <input
                        name="cost_price"
                        type="number"
                        value={editForm.cost_price}
                        onChange={handleEditInputChange}
                        className="px-2 py-1 rounded border"
                        required
                      />
                      <button
                        type="submit"
                        className="bg-pink-500 text-white px-2 py-1 rounded"
                        disabled={loading}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        className="bg-gray-300 text-gray-700 px-2 py-1 rounded"
                        onClick={() => setEditId(null)}
                      >
                        Cancel
                      </button>
                    </form>
                  ) : (
                    coin.platform
                  )}
                </td>
                <td className="py-2 px-4">{coin.inventory} Qty</td>
                <td className="py-2 px-4">$ {coin.cost_price}</td>
                <td className="py-2 px-4">
                  {coin.created_at
                    ? new Date(coin.created_at).toLocaleString()
                    : "N/A"}
                </td>
                <td className="py-2 px-4">
                  <button
                    className="p-1 text-blue-500 hover:bg-blue-50 rounded mr-2"
                    onClick={() => handleEditClick(coin)}
                    disabled={loading}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                    onClick={() => handleDelete(coin.id)}
                    disabled={loading}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GameCoinPanel;
