import React from 'react';

interface TableSkeletonProps {
  rows?: number;
  columns?: number | string[];
  className?: string;
}

/**
 * Renders skeleton rows for a table body. Place inside a <tbody>.
 * - columns: number of columns or array of width classes for each cell skeleton
 */
const TableSkeleton: React.FC<TableSkeletonProps> = ({ rows = 5, columns = 6, className = '' }) => {
  const colCount = typeof columns === 'number' ? columns : columns.length;
  const widthClasses =
    typeof columns === 'number' ? ['w-5/6', 'w-2/3', 'w-1/2', 'w-1/3'] : (columns as string[]);

  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr key={rIdx} className={`border-b border-gray-100 ${className}`}>
          {Array.from({ length: colCount }).map((__, cIdx) => (
            <td key={cIdx} className="py-3 px-4">
              <div className="animate-pulse">
                <div
                  className={`h-4 bg-gray-200 rounded ${widthClasses[cIdx % widthClasses.length]}`}
                />
              </div>
            </td>
          ))}
        </tr>
      ))}
    </>
  );
};

export default TableSkeleton;
