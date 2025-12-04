import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';
import { Plus, Edit2, Trash2, X, Search, User } from 'lucide-react';
import { LoadingSpinner } from './common/Loader';
import Pagination from './common/Pagination';
import { useAppSelector } from '../hooks/redux';

type UsernameRow = Database['public']['Tables']['usernames']['Row'];
interface Username {
  id: string;
  name: string;
  username: string;
  created_at: string;
  updated_at: string;
}

const UsernamesPanel: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [usernames, setUsernames] = useState<Username[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUsername, setEditingUsername] = useState<Username | null>(null);

  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [formData, setFormData] = useState<{
    name: string;
    username: string;
  }>({
    name: '',
    username: '',
  });

  // Filter usernames based on search term
  const filteredUsernames = usernames.filter(
    (username) =>
      username.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      username.username.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Pagination logic
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsernames = filteredUsernames.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  useEffect(() => {
    fetchUsernames();
  }, []);

  // Reset page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const fetchUsernames = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('usernames').select('*').order('name');

      if (error) throw error;

      const transformedUsernames: Username[] = (data || []).map((u: UsernameRow) => ({
        id: u.id,
        name: u.name,
        username: u.username,
        created_at: u.created_at ?? new Date().toISOString(),
        updated_at: u.updated_at ?? u.created_at ?? new Date().toISOString(),
      }));

      setUsernames(transformedUsernames);
    } catch (error) {
      console.error('Error fetching usernames:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      if (editingUsername) {
        const { error } = await supabase
          .from('usernames')
          .update({
            name: formData.name,
            username: formData.username,
          })
          .eq('id', editingUsername.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('usernames').insert({
          name: formData.name,
          username: formData.username,
        });

        if (error) throw error;
      }

      await fetchUsernames();
      closeModal();
    } catch (error) {
      console.error('Error saving username:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this username?')) return;

    try {
      setLoading(true);
      const { error } = await supabase.from('usernames').delete().eq('id', id);

      if (error) throw error;
      await fetchUsernames();
    } catch (error) {
      console.error('Error deleting username:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (username?: Username) => {
    if (username) {
      setEditingUsername(username);
      setFormData({
        name: username.name,
        username: username.username,
      });
    } else {
      setEditingUsername(null);
      setFormData({
        name: '',
        username: '',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUsername(null);
    setFormData({
      name: '',
      username: '',
    });
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Username Management</h2>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search usernames..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          {user?.role !== 'Employee' && (
            <button
              onClick={() => openModal()}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Username
            </button>
          )}
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg shadow-inner overflow-hidden">
        {/* Usernames Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Username</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Created Date</th>
                {user?.role !== 'Employee' && (
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="text-center py-8">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredUsernames.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-500">
                    {usernames.length === 0
                      ? 'No usernames found. Add your first username to get started.'
                      : searchTerm
                        ? `No usernames found matching "${searchTerm}".`
                        : 'No usernames found.'}
                  </td>
                </tr>
              ) : (
                paginatedUsernames.map((username) => (
                  <tr key={username.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{username.name}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{username.username}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {new Date(username.created_at).toLocaleDateString()}
                    </td>
                    {user?.role !== 'Employee' && (
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openModal(username)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Edit username"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(username.id)}
                            disabled={loading}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete username"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredUsernames.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={filteredUsernames.length}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-white/10 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-6 flex-shrink-0">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold">
                    {editingUsername ? 'Edit Username' : 'Add Username'}
                  </h2>
                  <p className="text-indigo-100 text-sm mt-1">
                    {editingUsername ? 'Update username information' : 'Create a new username'}
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="text-indigo-100 hover:text-white p-2 rounded-lg hover:bg-indigo-600/50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <form id="username-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        username: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end items-center flex-shrink-0">
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="username-form"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading && <LoadingSpinner size="sm" />}
                  {editingUsername ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsernamesPanel;
