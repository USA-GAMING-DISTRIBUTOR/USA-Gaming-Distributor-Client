import React from "react";

export interface BaseLayoutProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Base layout component that provides common structure
 * All other layouts should extend this for consistency
 */
const BaseLayout: React.FC<BaseLayoutProps> = ({
  children,
  className = "",
}) => {
  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>{children}</div>
  );
};

export default BaseLayout;
