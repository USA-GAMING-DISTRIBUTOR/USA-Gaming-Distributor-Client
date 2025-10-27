import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Pagination from "./common/Pagination";

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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

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

  // Pagination logic
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedIssues = issues.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

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
      <table className="w-full border-collapse">
      <thead>
      <tr className="border-b border-gray-200">
      <th className="text-left py-3 px-4 font-semibold text-gray-700">
        Created At
      </th>
      <th className="text-left py-3 px-4 font-semibold text-gray-700">
        Customer
      </th>
        <th className="text-left py-3 px-4 font-semibold text-gray-700">
            Issue
          </th>
        <th className="text-left py-3 px-4 font-semibold text-gray-700">
        Created By
      </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Status
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedIssues.map((issue) => (
              <tr
                key={issue.id}
                className="border-b border-gray-100 hover:bg-gray-50"
              >
                <td className="py-3 px-4">
                {issue.created_at
                ? new Date(issue.created_at).toLocaleString()
                : "N/A"}
                </td>
                <td className="py-3 px-4">{issue.customer_id}</td>
                <td className="py-3 px-4">{issue.issue_text}</td>
                <td className="py-3 px-4">{issue.created_by}</td>
                <td className="py-3 px-4">{issue.status || "N/A"}</td>
                <td className="py-3 px-4">
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

      {/* Pagination */}
      {issues.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalItems={issues.length}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      )}
    </div>
  );
};

export default CustomerIssuesPanel;
