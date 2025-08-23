import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

interface Log {
  id: string;
  action: string;
  user_id: string;
  details: string;
  timestamp: string;
}

const ActivityLogPanel: React.FC = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from("logs")
      .select("id, action, user_id, details, timestamp")
      .order("timestamp", { ascending: false });
    if (fetchError) {
      setError("Failed to fetch logs: " + fetchError.message);
      setLoading(false);
      return;
    }
    if (data) setLogs(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <h2 className="text-lg font-semibold mb-4">Activity Log</h2>
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="py-2 px-4 text-left">Timestamp</th>
              <th className="py-2 px-4 text-left">User</th>
              <th className="py-2 px-4 text-left">Action</th>
              <th className="py-2 px-4 text-left">Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b hover:bg-gray-50">
                <td className="py-2 px-4">{new Date(log.timestamp).toLocaleString()}</td>
                <td className="py-2 px-4">{log.user_id}</td>
                <td className="py-2 px-4">{log.action}</td>
                <td className="py-2 px-4">{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ActivityLogPanel;
