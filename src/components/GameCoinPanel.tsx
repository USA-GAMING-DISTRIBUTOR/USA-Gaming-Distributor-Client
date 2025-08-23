import React, { useEffect, useState } from "react";
import { Edit, Trash2, Plus } from "lucide-react";
import { supabase } from "../lib/supabase";

interface Coin {
  id: string;
  platform: string;
  inventory: number;
  cost_price: number;
  created_at: string;
}

const GameCoinPanel: React.FC = () => {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ platform: "", inventory: "", cost_price: "" });
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ platform: "", inventory: "", cost_price: "" });
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
    setShowForm(false);
    fetchCoins();
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    setError(null);
    const { error: deleteError } = await supabase.from("game_coins").delete().eq("id", id);
    if (deleteError) {
      setError("Failed to delete game coin: " + deleteError.message);
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

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: editError } = await supabase
      .from("game_coins")
      .update({
        platform: editForm.platform,
        inventory: Number(editForm.inventory),
        cost_price: Number(editForm.cost_price),
      })
      .eq("id", editId);
    if (editError) {
      setError("Failed to update game coin: " + editError.message);
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
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Game Coins</h2>
        <button
          className="bg-pink-500 text-white px-4 py-2 rounded-lg flex items-center"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus className="w-4 h-4 mr-2" /> Add Coin
        </button>
      </div>
      {showForm && (
        <form className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4" onSubmit={handleAddCoin}>
          <input
            name="platform"
            value={form.platform}
            onChange={handleInputChange}
            placeholder="Gaming Platform"
            className="px-3 py-2 rounded-lg border"
            required
          />
          <input
            name="inventory"
            type="number"
            value={form.inventory}
            onChange={handleInputChange}
            placeholder="Inventory"
            className="px-3 py-2 rounded-lg border"
            required
          />
          <input
            name="cost_price"
            type="number"
            value={form.cost_price}
            onChange={handleInputChange}
            placeholder="Cost Price"
            className="px-3 py-2 rounded-lg border"
            required
          />
          <button
            type="submit"
            className="bg-pink-500 text-white px-4 py-2 rounded-lg"
            disabled={loading}
          >
            Add
          </button>
        </form>
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
                    <form className="flex space-x-2" onSubmit={handleEditSubmit}>
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
                      <button type="submit" className="bg-pink-500 text-white px-2 py-1 rounded" disabled={loading}>
                        Save
                      </button>
                      <button type="button" className="bg-gray-300 text-gray-700 px-2 py-1 rounded" onClick={() => setEditId(null)}>
                        Cancel
                      </button>
                    </form>
                  ) : (
                    coin.platform
                  )}
                </td>
                <td className="py-2 px-4">{coin.inventory} Qty</td>
                <td className="py-2 px-4">$ {coin.cost_price}</td>
                <td className="py-2 px-4">{new Date(coin.created_at).toLocaleString()}</td>
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
