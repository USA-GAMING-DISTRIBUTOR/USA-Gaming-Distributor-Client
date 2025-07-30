import React from "react";
import logoImage from "../assets/USA Gaming Distributor - Logo (1).jpg";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  className = "",
}) => {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <img
        src={logoImage}
        alt="Loading..."
        className={`${sizeClasses[size]}`}
      />
    </div>
  );
};

export default LoadingSpinner;
