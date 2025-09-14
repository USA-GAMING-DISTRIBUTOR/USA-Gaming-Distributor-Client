import React from "react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
  icon?: React.ReactNode;
}

/**
 * Reusable Input component with your original purple theme
 */
const Input: React.FC<InputProps> = ({
  label,
  error,
  helper,
  icon,
  className = "",
  ...props
}) => {
  const inputClasses = `
    w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors
    ${
      error
        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
        : "border-pink-300 focus:border-pink-500 focus:ring-pink-500"
    }
    ${icon ? "pl-10" : ""}
    ${className}
  `;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-pink-900 mb-1">
          {label}
        </label>
      )}

      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-pink-400">{icon}</span>
          </div>
        )}
        <input className={inputClasses} {...props} />
      </div>

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

      {helper && !error && (
        <p className="mt-1 text-sm text-pink-600">{helper}</p>
      )}
    </div>
  );
};

export default Input;
