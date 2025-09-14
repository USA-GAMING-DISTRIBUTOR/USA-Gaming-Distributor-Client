import React from "react";

export interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  width?: string;
}

export interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T, index: number) => void;
  className?: string;
  striped?: boolean;
  hoverable?: boolean;
}

/**
 * Reusable Table component with sorting and custom rendering
 */
function Table<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  emptyMessage = "No data available",
  onRowClick,
  className = "",
  striped = true,
  hoverable = true,
}: TableProps<T>) {
  const getValue = (row: T, key: keyof T | string): any => {
    if (typeof key === "string" && key.includes(".")) {
      // Handle nested keys like 'user.name'
      return key.split(".").reduce((obj, k) => obj?.[k], row);
    }
    return row[key as keyof T];
  };

  if (loading) {
    return (
      <div className="w-full">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded mb-4"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-8 bg-gray-100 rounded mb-2"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg ${className}`}
    >
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                  column.className || ""
                }`}
                style={{ width: column.width }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody
          className={`bg-white divide-y divide-gray-200 ${
            striped ? "divide-y" : ""
          }`}
        >
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-12 text-center text-sm text-gray-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr
                key={index}
                className={`
                  ${striped && index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  ${hoverable ? "hover:bg-gray-100" : ""}
                  ${onRowClick ? "cursor-pointer" : ""}
                  transition-colors duration-150
                `}
                onClick={() => onRowClick?.(row, index)}
              >
                {columns.map((column) => {
                  const value = getValue(row, column.key);
                  return (
                    <td
                      key={String(column.key)}
                      className={`px-6 py-4 whitespace-nowrap text-sm ${
                        column.className || "text-gray-900"
                      }`}
                    >
                      {column.render ? column.render(value, row, index) : value}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
