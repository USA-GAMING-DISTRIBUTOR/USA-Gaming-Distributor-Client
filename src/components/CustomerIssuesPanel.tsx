import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

interface Issue {
  id: string;
  customer_id: string;
  issue_text: string;
  created_by: string;
  status: string | null;
  created_at: string | null;
}

const CustomerIssuesPanel: React.FC = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIssues = async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from("customer_issues")
      .select("id, customer_id, issue_text, created_by, status, created_at")
      .order("created_at", { ascending: false });
    if (fetchError) {
      setError("Failed to fetch issues: " + fetchError.message);
      setLoading(false);
      return;
    }
    if (data) setIssues(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  const handleStatusChange = async (id: string, status: string) => {
    setLoading(true);
    setError(null);
    const { error: updateError } = await supabase
      .from("customer_issues")
      .update({ status })
      .eq("id", id);
    if (updateError) {
      setError("Failed to update issue status: " + updateError.message);
      setLoading(false);
      return;
    }
    fetchIssues();
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <h2 className="text-lg font-semibold mb-4">Customer Issues</h2>
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="py-2 px-4 text-left">Created At</th>
              <th className="py-2 px-4 text-left">Customer</th>
              <th className="py-2 px-4 text-left">Issue</th>
              <th className="py-2 px-4 text-left">Created By</th>
              <th className="py-2 px-4 text-left">Status</th>
              <th className="py-2 px-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {issues.map((issue) => (
              <tr key={issue.id} className="border-b hover:bg-gray-50">
                <td className="py-2 px-4">
                  {issue.created_at
                    ? new Date(issue.created_at).toLocaleString()
                    : "N/A"}
                </td>
                <td className="py-2 px-4">{issue.customer_id}</td>
                <td className="py-2 px-4">{issue.issue_text}</td>
                <td className="py-2 px-4">{issue.created_by}</td>
                <td className="py-2 px-4">{issue.status || "N/A"}</td>
                <td className="py-2 px-4">
                  <button
                    className="bg-green-500 text-white px-3 py-1 rounded mr-2"
                    onClick={() => handleStatusChange(issue.id, "Resolved")}
                    disabled={loading || issue.status === "Resolved"}
                  >
                    Mark Resolved
                  </button>
                  <button
                    className="bg-yellow-500 text-white px-3 py-1 rounded"
                    onClick={() => handleStatusChange(issue.id, "Unresolved")}
                    disabled={loading || issue.status === "Unresolved"}
                  >
                    Mark Unresolved
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

export default CustomerIssuesPanel;
