import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Pagination from './common/Pagination';

interface Log {
  id: string;
  action: string;
  user_id: string | null;
  details: string | null;
  timestamp: string | null;
}

const ActivityLogPanel: React.FC = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  const fetchLogs = async () => {
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('logs')
      .select('id, action, user_id, details, timestamp')
      .order('timestamp', { ascending: false });
    if (fetchError) {
      setError('Failed to fetch logs: ' + fetchError.message);
      return;
    }
    if (data) setLogs(data);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Pagination logic
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLogs = logs.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <h2 className="text-lg font-semibold mb-4">Activity Log</h2>
      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Timestamp</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">User</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Action</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Details</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLogs.map((log) => (
              <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">
                  {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                </td>
                <td className="py-3 px-4">{log.user_id || 'N/A'}</td>
                <td className="py-3 px-4">{log.action}</td>
                <td className="py-3 px-4">{log.details || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {logs.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalItems={logs.length}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      )}
    </div>
  );
};

export default ActivityLogPanel;
