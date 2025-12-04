import React, { useEffect, useState } from 'react';
import { Plus, Search, Filter, X, Edit, Trash2, CheckCircle, XCircle, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Pagination from './common/Pagination';
import { useAppSelector } from '../hooks/redux';

interface Issue {
  id: string;
  customer_id: string;
  issue_text: string;
  created_by: string;
  status: string | null;
  created_at: string | null;
  customers?:
    | {
        name: string;
      }
    | any;
  users?:
    | {
        username: string;
      }
    | any;
}

interface Customer {
  id: string;
  name: string;
}

interface User {
  id: string;
  username: string;
}

const CustomerIssuesPanel: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Create/Edit Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentIssueId, setCurrentIssueId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    customer_id: '',
    issue_text: '',
  });

  // View Modal State
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  // Filter State
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: '',
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  const fetchCustomers = async () => {
    const { data } = await supabase.from('customers').select('id, name').order('name');
    if (data) setCustomers(data);
  };

  const fetchUsers = async () => {
    const { data } = await supabase.from('users').select('id, username');
    if (data) setUsers(data);
  };

  const fetchIssues = async () => {
    setLoading(true);
    setError(null);

    let query = supabase
      .from('customer_issues')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.startDate) {
      query = query.gte('created_at', new Date(filters.startDate).toISOString());
    }
    if (filters.endDate) {
      query = query.lte('created_at', new Date(filters.endDate).toISOString());
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    // Role-based filtering
    if (user?.role === 'Employee') {
      query = query.eq('created_by', user.id);
    }

    const { data, error: fetchError } = await query;

    if (fetchError) {
      setError('Failed to fetch issues: ' + fetchError.message);
      setLoading(false);
      return;
    }

    if (data) {
      setIssues(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchIssues();
    fetchCustomers();
    fetchUsers();
  }, [filters]); // Refetch when filters change

  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setFormData({ customer_id: '', issue_text: '' });
    setCurrentIssueId(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (issue: Issue) => {
    setIsEditing(true);
    setFormData({
      customer_id: issue.customer_id || '',
      issue_text: issue.issue_text,
    });
    setCurrentIssueId(issue.id);
    setShowModal(true);
  };

  const handleOpenViewModal = (issue: Issue) => {
    setSelectedIssue(issue);
    setShowViewModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    let error;

    if (isEditing && currentIssueId) {
      let query = supabase
        .from('customer_issues')
        .update({
          customer_id: formData.customer_id || null,
          issue_text: formData.issue_text,
        })
        .eq('id', currentIssueId);

      // If not admin/superadmin, restrict to own issues
      if (user.role !== 'Admin' && user.role !== 'SuperAdmin') {
        query = query.eq('created_by', user.id);
      }

      const { error: updateError } = await query;
      error = updateError;
    } else {
      const { error: createError } = await supabase.from('customer_issues').insert([
        {
          customer_id: formData.customer_id || null,
          issue_text: formData.issue_text,
          created_by: user.id,
          status: 'Open',
        },
      ]);
      error = createError;
    }

    if (error) {
      setError(`Failed to ${isEditing ? 'update' : 'create'} issue: ` + error.message);
    } else {
      setShowModal(false);
      setFormData({ customer_id: '', issue_text: '' });
      fetchIssues();
    }
    setLoading(false);
  };

  const handleDeleteIssue = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this issue?')) return;
    if (!user) return;

    setLoading(true);
    let query = supabase.from('customer_issues').delete().eq('id', id);

    // If not admin/superadmin, restrict to own issues
    if (user.role !== 'Admin' && user.role !== 'SuperAdmin') {
      query = query.eq('created_by', user.id);
    }

    const { error: deleteError } = await query;

    if (deleteError) {
      setError('Failed to delete issue: ' + deleteError.message);
    } else {
      fetchIssues();
    }
    setLoading(false);
  };

  const handleStatusChange = async (id: string, status: string) => {
    setLoading(true);
    const { error: updateError } = await supabase
      .from('customer_issues')
      .update({ status })
      .eq('id', id);

    if (updateError) {
      setError('Failed to update status: ' + updateError.message);
    } else {
      fetchIssues();
    }
    setLoading(false);
  };

  // Pagination logic
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedIssues = issues.slice(startIndex, endIndex);

  const canEditOrDelete = (issue: Issue) => {
    if (!user) return false;
    if (user.role === 'Admin' || user.role === 'SuperAdmin') return true;
    return issue.created_by === user.id;
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-lg font-semibold">Customer Issues</h2>

        <div className="flex flex-wrap gap-2 items-center">
          {/* Filters for Admin/SuperAdmin */}
          {(user?.role === 'Admin' || user?.role === 'SuperAdmin') && (
            <>
              <input
                type="datetime-local"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="px-3 py-2 border rounded-lg text-sm"
                placeholder="Start Date & Time"
              />
              <input
                type="datetime-local"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="px-3 py-2 border rounded-lg text-sm"
                placeholder="End Date & Time"
              />
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="px-3 py-2 border rounded-lg text-sm"
              >
                <option value="">All Statuses</option>
                <option value="Open">Open</option>
                <option value="Resolved">Resolved</option>
                <option value="Unresolved">Unresolved</option>
              </select>
            </>
          )}

          {/* Create Button for All Roles */}
          <button
            onClick={handleOpenCreateModal}
            className="bg-pink-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-pink-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Issue
          </button>
        </div>
      </div>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Customer</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Issue</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Created By</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && issues.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-4">
                  Loading...
                </td>
              </tr>
            ) : paginatedIssues.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-4">
                  No issues found
                </td>
              </tr>
            ) : (
              paginatedIssues.map((issue) => (
                <tr key={issue.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    {issue.created_at ? new Date(issue.created_at).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="py-3 px-4">
                    {issue.customer_id
                      ? customers.find((c) => c.id === issue.customer_id)?.name || issue.customer_id
                      : 'N/A'}
                  </td>
                  <td className="py-3 px-4 max-w-xs truncate" title={issue.issue_text}>
                    {issue.issue_text}
                  </td>
                  <td className="py-3 px-4">
                    {users.find((u) => u.id === issue.created_by)?.username || issue.created_by}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        issue.status === 'Resolved'
                          ? 'bg-green-100 text-green-800'
                          : issue.status === 'Unresolved'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {issue.status || 'Open'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2 items-center">
                      <button
                        onClick={() => handleOpenViewModal(issue)}
                        className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {(user?.role === 'Admin' || user?.role === 'SuperAdmin') && (
                        <>
                          <button
                            className="p-1 text-green-600 hover:bg-green-100 rounded"
                            onClick={() => handleStatusChange(issue.id, 'Resolved')}
                            disabled={loading || issue.status === 'Resolved'}
                            title="Resolve"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            className="p-1 text-yellow-600 hover:bg-yellow-100 rounded"
                            onClick={() => handleStatusChange(issue.id, 'Unresolved')}
                            disabled={loading || issue.status === 'Unresolved'}
                            title="Unresolve"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {canEditOrDelete(issue) && (
                        <>
                          <button
                            onClick={() => handleOpenEditModal(issue)}
                            className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                            title="Edit"
                            disabled={loading}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteIssue(issue.id)}
                            className="p-1 text-red-600 hover:bg-red-100 rounded"
                            title="Delete"
                            disabled={loading}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {issues.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalItems={issues.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(n) => {
            setItemsPerPage(n);
            setCurrentPage(1);
          }}
        />
      )}

      {/* Create/Edit Issue Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-white/10 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md shadow-2xl flex flex-col">
            <div className="bg-pink-600 text-white p-4 rounded-t-lg flex justify-between items-center">
              <h3 className="text-lg font-bold">{isEditing ? 'Edit Issue' : 'Create New Issue'}</h3>
              <button onClick={() => setShowModal(false)} className="hover:text-pink-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer (Optional)
                </label>
                <select
                  value={formData.customer_id}
                  onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                >
                  <option value="">Select Customer (Optional)</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Issue Description
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.issue_text}
                  onChange={(e) => setFormData({ ...formData, issue_text: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                  placeholder="Describe the issue..."
                />
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 mr-2 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50"
                >
                  {loading
                    ? isEditing
                      ? 'Updating...'
                      : 'Creating...'
                    : isEditing
                      ? 'Update Issue'
                      : 'Create Issue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showViewModal && selectedIssue && (
        <div className="fixed inset-0 bg-white/10 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md shadow-2xl flex flex-col">
            <div className="bg-pink-600 text-white p-4 rounded-t-lg flex justify-between items-center">
              <h3 className="text-lg font-bold">Issue Details</h3>
              <button onClick={() => setShowViewModal(false)} className="hover:text-pink-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Date</label>
                <p className="text-gray-900">
                  {selectedIssue.created_at
                    ? new Date(selectedIssue.created_at).toLocaleString()
                    : 'N/A'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Customer</label>
                <p className="text-gray-900">
                  {selectedIssue.customer_id
                    ? customers.find((c) => c.id === selectedIssue.customer_id)?.name ||
                      selectedIssue.customer_id
                    : 'N/A'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Created By</label>
                <p className="text-gray-900">
                  {users.find((u) => u.id === selectedIssue.created_by)?.username ||
                    selectedIssue.created_by}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    selectedIssue.status === 'Resolved'
                      ? 'bg-green-100 text-green-800'
                      : selectedIssue.status === 'Unresolved'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {selectedIssue.status || 'Open'}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Description</label>
                <div className="bg-gray-50 p-3 rounded-lg text-gray-900 whitespace-pre-wrap break-words">
                  {selectedIssue.issue_text}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
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

export default CustomerIssuesPanel;
