import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  LogOut,
  Shield,
  UserCheck,
  User as UserIcon,
  Edit,
  X,
  Search,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { logout, createUser, updateUser, clearError, fetchAllUsers } from '../store/authSlice';
import type { UserRole, CreateUserFormData } from '../domains/auth/types';
import { validateUserCreate, validateUserUpdate } from '../utils/FormValidator';
import LoadingSpinner from './LoadingSpinner';
import Pagination from './common/Pagination';

const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user, users, isLoading, error } = useAppSelector((state) => state.auth);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<CreateUserFormData>({
    username: '',
    password: '',
    role: 'Admin',
  });
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    username: '',
    password: '',
    role: 'Admin' as UserRole,
  });
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [createFormErrors, setCreateFormErrors] = useState<Record<string, string>>({});
  const [editFormErrors, setEditFormErrors] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  useEffect(() => {
    dispatch(fetchAllUsers());
    if (error) {
      dispatch(clearError());
    }
  }, [dispatch, error]);

  // Reset page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Filter users based on search term
  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Pagination logic
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear validation error for this field when user starts typing
    if (createFormErrors[name]) {
      setCreateFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateFormErrors({});

    // Validate form data
    const validation = validateUserCreate(formData);
    if (!validation.success) {
      setCreateFormErrors(validation.errors);
      return;
    }

    const result = await dispatch(
      createUser({
        username: formData.username,
        password: formData.password,
        role: formData.role,
        created_by: user?.id || null,
      }),
    );

    if (createUser.fulfilled.match(result)) {
      setFormData({ username: '', password: '', role: 'Admin' });
      setShowCreateForm(false);
      setCreateFormErrors({});
    }
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleEditUser = (userId: string) => {
    const userToEdit = users.find((u) => u.id === userId);
    if (userToEdit) {
      setEditFormData({
        username: userToEdit.username,
        password: '', // Don't populate password for security
        role: userToEdit.role,
      });
      setEditingUserId(userId);
      setEditFormErrors({}); // Clear any existing errors
    }
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditFormData({
      username: '',
      password: '',
      role: 'Admin',
    });
    setShowPasswordField(false);
    setEditFormErrors({}); // Clear any existing errors
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear validation error for this field when user starts typing
    if (editFormErrors[name]) {
      setEditFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleUpdateUser = async (userId: string) => {
    setEditFormErrors({});

    // Validate form data
    const validation = validateUserUpdate(editFormData);
    if (!validation.success) {
      setEditFormErrors(validation.errors);
      return;
    }

    const updateData = {
      id: userId,
      username: editFormData.username,
      role: editFormData.role,
      ...(editFormData.password && { password: editFormData.password }),
    };

    const result = await dispatch(updateUser(updateData));

    if (updateUser.fulfilled.match(result)) {
      // Reset edit state on success
      setEditingUserId(null);
      setEditFormData({
        username: '',
        password: '',
        role: 'Admin',
      });
      setShowPasswordField(false);
      setEditFormErrors({});
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'SuperAdmin':
        return <Shield className="w-5 h-5 text-pink-500" />;
      case 'Admin':
        return <UserCheck className="w-5 h-5 text-violet-500" />;
      case 'Employee':
        return <UserIcon className="w-5 h-5 text-indigo-500" />;
      default:
        return <UserIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'SuperAdmin':
        return 'bg-pink-100 text-pink-800';
      case 'Admin':
        return 'bg-violet-100 text-violet-800';
      case 'Employee':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-pink-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-pink-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-pink-600 mr-3" />
              <h1 className="text-xl font-semibold text-pink-900">SuperAdmin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {getRoleIcon(user?.role || 'Employee')}
                <span className="text-sm font-medium text-pink-700">
                  {user?.username} ({user?.role})
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-pink-700 hover:text-pink-900 hover:bg-pink-100 rounded-md transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 rounded-md bg-red-100 border border-red-400 text-red-700">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-pink-100 rounded-lg">
                <Users className="w-6 h-6 text-pink-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-semibold text-gray-900">{users.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-violet-100 rounded-lg">
                <UserCheck className="w-6 h-6 text-pink-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Admins</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {users.filter((u) => u.role === 'Admin').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <UserIcon className="w-6 h-6 text-pink-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Employees</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {users.filter((u) => u.role === 'Employee').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Create User Section */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-pink-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-pink-900">User Management</h2>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="flex items-center space-x-2 px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create User</span>
              </button>
            </div>
          </div>

          {showCreateForm && (
            <div className="p-6 border-b border-pink-200 bg-pink-50">
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label
                    htmlFor="username"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className={`block w-full px-3 py-2 border rounded-md focus:ring-pink-500 focus:border-pink-500 ${
                      createFormErrors.username
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300'
                    }`}
                    placeholder="Enter username"
                    disabled={isLoading}
                  />
                  {createFormErrors.username && (
                    <p className="mt-1 text-sm text-red-600">{createFormErrors.username}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`block w-full px-3 py-2 border rounded-md focus:ring-pink-500 focus:border-pink-500 ${
                      createFormErrors.password
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300'
                    }`}
                    placeholder="Enter password"
                    disabled={isLoading}
                  />
                  {createFormErrors.password && (
                    <p className="mt-1 text-sm text-red-600">{createFormErrors.password}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className={`block w-full px-3 py-2 border rounded-md focus:ring-pink-500 focus:border-pink-500 ${
                      createFormErrors.role
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300'
                    }`}
                    disabled={isLoading}
                  >
                    <option value="Admin">Admin</option>
                    <option value="Employee">Employee</option>
                  </select>
                  {createFormErrors.role && (
                    <p className="mt-1 text-sm text-red-600">{createFormErrors.role}</p>
                  )}
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <LoadingSpinner size={20} />
                        <span>Creating...</span>
                      </div>
                    ) : (
                      'Create User'
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Edit User Modal */}
        {editingUserId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-pink-900">Edit User</h3>
                <button onClick={handleCancelEdit} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    name="username"
                    value={editFormData.username}
                    onChange={handleEditInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-pink-500 focus:border-pink-500 ${
                      editFormErrors.username
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300'
                    }`}
                    placeholder="Enter username"
                  />
                  {editFormErrors.username && (
                    <p className="mt-1 text-sm text-red-600">{editFormErrors.username}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    name="role"
                    value={editFormData.role}
                    onChange={handleEditInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-pink-500 focus:border-pink-500 ${
                      editFormErrors.role
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300'
                    }`}
                  >
                    <option value="Admin">Admin</option>
                    <option value="Employee">Employee</option>
                  </select>
                  {editFormErrors.role && (
                    <p className="mt-1 text-sm text-red-600">{editFormErrors.role}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <button
                      type="button"
                      onClick={() => setShowPasswordField(!showPasswordField)}
                      className="text-sm text-pink-600 hover:text-pink-800"
                    >
                      {showPasswordField ? 'Hide' : 'Change Password'}
                    </button>
                  </div>
                  {showPasswordField && (
                    <>
                      <input
                        type="password"
                        name="password"
                        value={editFormData.password}
                        onChange={handleEditInputChange}
                        className={`w-full px-3 py-2 border rounded-md focus:ring-pink-500 focus:border-pink-500 ${
                          editFormErrors.password
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                            : 'border-gray-300'
                        }`}
                        placeholder="Enter new password (leave blank to keep current)"
                      />
                      {editFormErrors.password && (
                        <p className="mt-1 text-sm text-red-600">{editFormErrors.password}</p>
                      )}
                    </>
                  )}
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => handleUpdateUser(editingUserId)}
                    className="flex-1 bg-pink-600 text-white px-4 py-2 rounded-md hover:bg-pink-700 transition-colors"
                  >
                    Update User
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Users List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">All Users</h3>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">User</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Role</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Created At</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Created By</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((u) => (
                  <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getRoleIcon(u.role)}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{u.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(
                          u.role,
                        )}`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(u.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {u.created_by
                        ? users.find((creator) => creator.id === u.created_by)?.username ||
                          'Unknown'
                        : 'System'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => handleEditUser(u.id)}
                        className="text-pink-600 hover:text-pink-800 p-2 rounded-md hover:bg-pink-50 transition-colors"
                        title="Edit user"
                        disabled={u.role === 'SuperAdmin'} // Prevent editing SuperAdmin
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {users.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalItems={users.length}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
