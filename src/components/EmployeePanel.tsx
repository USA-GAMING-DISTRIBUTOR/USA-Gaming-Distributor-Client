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
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ username: "", password: "", role: "Employee" });
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
    const updateData: any = { username: editForm.username };
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("users").insert([
      { username: form.username, password: form.password, role: form.role },
    ]);
    if (!error) {
      setForm({ username: "", password: "", role: "Employee" });
      setShowForm(false);
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
          onClick={() => setShowForm(!showForm)}
        >
          <Plus className="w-4 h-4 mr-2" /> Add Employee
        </button>
      </div>
      {showForm && (
        <form className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4" onSubmit={handleAddEmployee}>
          <input
            name="username"
            value={form.username}
            onChange={handleInputChange}
            placeholder="Username"
            className="px-3 py-2 rounded-lg border"
            required
          />
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleInputChange}
            placeholder="Password"
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
                    <form className="flex space-x-2" onSubmit={handleEditSubmit}>
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
                      <button type="submit" className="bg-pink-500 text-white px-2 py-1 rounded" disabled={loading}>
                        Save
                      </button>
                      <button type="button" className="bg-gray-300 text-gray-700 px-2 py-1 rounded" onClick={() => setEditId(null)}>
                        Cancel
                      </button>
                    </form>
                  ) : (
                    emp.username
                  )}
                </td>
                <td className="py-2 px-4">{emp.role}</td>
                <td className="py-2 px-4">{new Date(emp.created_at).toLocaleString()}</td>
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
