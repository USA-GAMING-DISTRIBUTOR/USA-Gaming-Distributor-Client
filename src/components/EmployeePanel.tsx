import React, { useEffect, useState } from 'react';
import { Edit, Trash2, Plus, X, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Pagination from './common/Pagination';

interface Employee {
  id: string;
  username: string;
  role: string;
  created_at: string | null;
}

const EmployeePanel: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState({
    username: '',
    password: '',
    role: 'Employee',
  });
  const [editForm, setEditForm] = useState({
    username: '',
    password: '',
    role: 'Employee',
  });

  const [dateFilter, setDateFilter] = useState({
    start: '',
    end: '',
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  // Filter employees based on search term
  const filteredEmployees = employees.filter((emp) =>
    emp.username.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleEditClick = (emp: Employee) => {
    setSelectedEmployee(emp);
    setEditForm({
      username: emp.username,
      password: '',
      role: emp.role,
    });
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedEmployee(null);
    setEditForm({ username: '', password: '', role: 'Employee' });
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    setLoading(true);
    const updateData: { username: string; role: string; password?: string } = {
      username: editForm.username,
      role: editForm.role,
    };
    if (editForm.password) updateData.password = editForm.password;

    const { error } = await supabase.from('users').update(updateData).eq('id', selectedEmployee.id);

    if (!error) {
      handleCloseEditModal();
      fetchEmployees();
    }
    setLoading(false);
  };

  const fetchEmployees = async () => {
    setLoading(true);
    let query = supabase
      .from('users')
      .select('id, username, role, created_at')
      .eq('role', 'Employee');

    if (dateFilter.start) {
      const startDate = new Date(dateFilter.start);
      if (!isNaN(startDate.getTime())) {
        query = query.gte('created_at', startDate.toISOString());
      }
    }

    if (dateFilter.end) {
      const endDate = new Date(dateFilter.end);
      if (!isNaN(endDate.getTime())) {
        query = query.lte('created_at', endDate.toISOString());
      }
    }

    const { data, error } = await query;
    if (!error && data) setEmployees(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchEmployees();
  }, [dateFilter]);

  // Reset page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Pagination logic
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedEmployees = filteredEmployees.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase
      .from('users')
      .insert([{ username: form.username, password: form.password, role: form.role }]);
    if (!error) {
      setForm({ username: '', password: '', role: 'Employee' });
      fetchEmployees();
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    await supabase.from('users').delete().eq('id', id);
    fetchEmployees();
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Employees</h2>
        <div className="flex items-center gap-4">
          <input
            type="datetime-local"
            value={dateFilter.start}
            onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          <input
            type="datetime-local"
            value={dateFilter.end}
            onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>
          <button
            className="bg-pink-500 text-white px-4 py-2 rounded-lg flex items-center"
            onClick={() => setShowModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" /> Add Employee
          </button>
        </div>
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-white/10 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-pink-600 to-pink-700 text-white p-6 flex-shrink-0">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold">Add Employee</h3>
                  <p className="text-pink-100 text-sm mt-1">Create a new employee account</p>
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
              <form id="employee-form" onSubmit={handleAddEmployee} className="space-y-4">
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
                  form="employee-form"
                  className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {showEditModal && selectedEmployee && (
        <div className="fixed inset-0 bg-white/10 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-pink-600 text-white px-6 py-4 rounded-t-xl flex-shrink-0">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Edit Employee</h3>
                <button onClick={handleCloseEditModal} className="text-white/80 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <form id="editEmployeeForm" onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    name="username"
                    value={editForm.username}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password (leave blank to keep current)
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={editForm.password}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="Enter new password (optional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    name="role"
                    value={editForm.role}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    required
                  >
                    <option value="Employee">Employee</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end items-center flex-shrink-0">
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="editEmployeeForm"
                  disabled={loading}
                  className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Employee'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Username</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Role</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Created At</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="text-center py-8">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
                  </div>
                </td>
              </tr>
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-gray-500">
                  No employees found
                </td>
              </tr>
            ) : (
              paginatedEmployees.map((emp) => (
                <tr key={emp.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{emp.username}</td>
                  <td className="py-3 px-4">{emp.role}</td>
                  <td className="py-3 px-4">
                    {emp.created_at ? new Date(emp.created_at).toLocaleString() : 'N/A'}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditClick(emp)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Edit Employee"
                        disabled={loading}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(emp.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Delete Employee"
                        disabled={loading}
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
      {employees.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalItems={employees.length}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      )}
    </div>
  );
};

export default EmployeePanel;
