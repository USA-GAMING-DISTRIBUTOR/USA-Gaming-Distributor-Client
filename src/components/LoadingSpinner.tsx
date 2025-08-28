import React from "react";

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
  stroke?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 20,
  className = "",
  stroke = "#ec4899",
}) => {
  return (
    <span className={`inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 50 50"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="animate-spin"
      >
        <circle
          cx="25"
          cy="25"
          r="20"
          stroke={stroke}
          strokeWidth="5"
          strokeDasharray="31.4 31.4"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
};

export default LoadingSpinner;
