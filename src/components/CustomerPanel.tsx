// ...existing code...
import React, { useEffect, useState } from "react";
import { Edit, Trash2, Plus } from "lucide-react";
import { supabase } from "../lib/supabase";

interface Customer {
  id: string;
  name: string;
  contact_info: string;
  created_at: string;
}

const CustomerPanel: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", contact_info: "" });
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", contact_info: "" });

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from("customers")
      .select("id, name, contact_info, created_at")
      .order("created_at", { ascending: false });
    if (fetchError) {
      setError("Failed to fetch customers: " + fetchError.message);
      setLoading(false);
      return;
    }
    if (data) setCustomers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: addError } = await supabase
      .from("customers")
      .insert([{ name: form.name, contact_info: form.contact_info }]);
    if (addError) {
      setError("Failed to add customer: " + addError.message);
      setLoading(false);
      return;
    }
    setForm({ name: "", contact_info: "" });
    fetchCustomers();
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    setError(null);
    const { error: deleteError } = await supabase
      .from("customers")
      .delete()
      .eq("id", id);
    if (deleteError) {
      setError("Failed to delete customer: " + deleteError.message);
      setLoading(false);
      return;
    }
    fetchCustomers();
    setLoading(false);
  };

  const handleEditClick = (customer: Customer) => {
    setEditId(customer.id);
    setEditForm({ name: customer.name, contact_info: customer.contact_info });
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: editError } = await supabase
      .from("customers")
      .update({ name: editForm.name, contact_info: editForm.contact_info })
      .eq("id", editId);
    if (editError) {
      setError("Failed to update customer: " + editError.message);
      setLoading(false);
      return;
    }
    setEditId(null);
    setEditForm({ name: "", contact_info: "" });
    fetchCustomers();
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Customers</h2>
        <button
          className="bg-pink-500 text-white px-4 py-2 rounded shadow flex items-center"
          onClick={() => setShowModal(true)}
        >
          <Plus className="w-4 h-4 mr-1 inline" /> Add Customer
        </button>
      </div>
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
      )}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backdropFilter: "blur(8px)", background: "rgba(0,0,0,0.2)" }}
        >
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add Customer</h3>
            <form onSubmit={handleAddCustomer} className="space-y-4">
              <input
                name="name"
                value={form.name}
                onChange={handleInputChange}
                placeholder="Customer Name"
                className="w-full px-3 py-2 border rounded"
                required
              />
              <input
                name="contact_info"
                value={form.contact_info}
                onChange={handleInputChange}
                placeholder="Contact Info"
                className="w-full px-3 py-2 border rounded"
                required
              />
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-200 rounded"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-pink-500 text-white rounded"
                >
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="py-2 px-4 text-left">Name</th>
              <th className="py-2 px-4 text-left">Contact Info</th>
              <th className="py-2 px-4 text-left">Created At</th>
              <th className="py-2 px-4 text-left"></th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id} className="border-b hover:bg-gray-50">
                <td className="py-2 px-4">
                  {editId === customer.id ? (
                    <form
                      className="flex space-x-2"
                      onSubmit={handleEditSubmit}
                    >
                      <input
                        name="name"
                        value={editForm.name}
                        onChange={handleEditInputChange}
                        className="px-2 py-1 rounded border"
                        required
                      />
                      <input
                        name="contact_info"
                        value={editForm.contact_info}
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
                    customer.name
                  )}
                </td>
                <td className="py-2 px-4">{customer.contact_info}</td>
                <td className="py-2 px-4">
                  {new Date(customer.created_at).toLocaleString()}
                </td>
                <td className="py-2 px-4">
                  <button
                    className="p-1 text-blue-500 hover:bg-blue-50 rounded mr-2"
                    onClick={() => handleEditClick(customer)}
                    disabled={loading}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                    onClick={() => handleDelete(customer.id)}
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

export default CustomerPanel;
