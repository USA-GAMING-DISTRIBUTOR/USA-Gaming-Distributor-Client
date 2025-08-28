import React, { useEffect, useState } from "react";
import { Edit, Trash2, Plus } from "lucide-react";
import { supabase } from "../lib/supabase";

interface Employee {
  id: string;
  username: string;
  role: string;
  created_at: string;
}

const EmployeePanel: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "Employee",
  });
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ username: "", password: "" });
  const handleEditClick = (emp: Employee) => {
    setEditId(emp.id);
    setEditForm({ username: emp.username, password: "" });
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const updateData: { username: string; password?: string } = {
      username: editForm.username,
    };
    if (editForm.password) updateData.password = editForm.password;
    await supabase.from("users").update(updateData).eq("id", editId);
    setEditId(null);
    setEditForm({ username: "", password: "" });
    fetchEmployees();
    setLoading(false);
  };

  const fetchEmployees = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("users")
      .select("id, username, role, created_at")
      .eq("role", "Employee");
    if (!error && data) setEmployees(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase
      .from("users")
      .insert([
        { username: form.username, password: form.password, role: form.role },
      ]);
    if (!error) {
      setForm({ username: "", password: "", role: "Employee" });
      fetchEmployees();
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    await supabase.from("users").delete().eq("id", id);
    fetchEmployees();
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Employees</h2>
        <button
          className="bg-pink-500 text-white px-4 py-2 rounded-lg flex items-center"
          onClick={() => setShowModal(true)}
        >
          <Plus className="w-4 h-4 mr-2" /> Add Employee
        </button>
      </div>
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backdropFilter: "blur(8px)", background: "rgba(0,0,0,0.2)" }}
        >
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add Employee</h3>
            <form onSubmit={handleAddEmployee} className="space-y-4">
              <input
                name="username"
                value={form.username}
                onChange={handleInputChange}
                placeholder="Username"
                className="w-full px-3 py-2 border rounded"
                required
              />
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleInputChange}
                placeholder="Password"
                className="w-full px-3 py-2 border rounded"
                required
              />
              <select
                name="role"
                value={form.role}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded"
                required
              >
                <option value="Employee">Employee</option>
                <option value="Admin">Admin</option>
              </select>
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
              <th className="py-2 px-4 text-left">Username</th>
              <th className="py-2 px-4 text-left">Role</th>
              <th className="py-2 px-4 text-left">Created At</th>
              <th className="py-2 px-4 text-left"></th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id} className="border-b hover:bg-gray-50">
                <td className="py-2 px-4">
                  {editId === emp.id ? (
                    <form
                      className="flex space-x-2"
                      onSubmit={handleEditSubmit}
                    >
                      <input
                        name="username"
                        value={editForm.username}
                        onChange={handleEditInputChange}
                        className="px-2 py-1 rounded border"
                        required
                      />
                      <input
                        name="password"
                        type="password"
                        value={editForm.password}
                        onChange={handleEditInputChange}
                        className="px-2 py-1 rounded border"
                        placeholder="New password"
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
                    emp.username
                  )}
                </td>
                <td className="py-2 px-4">{emp.role}</td>
                <td className="py-2 px-4">
                  {new Date(emp.created_at).toLocaleString()}
                </td>
                <td className="py-2 px-4">
                  <button
                    className="p-1 text-blue-500 hover:bg-blue-50 rounded mr-2"
                    onClick={() => handleEditClick(emp)}
                    disabled={loading}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                    onClick={() => handleDelete(emp.id)}
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

export default EmployeePanel;
