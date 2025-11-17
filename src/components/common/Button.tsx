import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  /** Accent color used for primary/secondary/ghost variants. Defaults to 'pink' */
  color?: 'pink' | 'blue' | 'green' | 'red';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Reusable Button component with your original purple theme
 */
const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  disabled,
  className = '',
  color = 'pink',
  children,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const colorMap: Record<string, { c600: string; c700: string; c500: string; c50: string }> = {
    pink: { c600: 'pink-600', c700: 'pink-700', c500: 'pink-500', c50: 'pink-50' },
    blue: { c600: 'blue-600', c700: 'blue-700', c500: 'blue-500', c50: 'blue-50' },
    green: { c600: 'green-600', c700: 'green-700', c500: 'green-500', c50: 'green-50' },
    red: { c600: 'red-600', c700: 'red-700', c500: 'red-500', c50: 'red-50' },
  };

  const accent = colorMap[color] ?? colorMap.pink;

  const variantClasses = {
    primary: `bg-${accent.c600} text-white hover:bg-${accent.c700} focus:ring-${accent.c500}`,
    secondary: `bg-white text-${accent.c600} border border-${accent.c600} hover:bg-${accent.c50} focus:ring-${accent.c500}`,
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    ghost: `text-${accent.c600} hover:text-${accent.c700} hover:bg-${accent.c50}`,
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  return (
    <button className={combinedClasses} disabled={disabled || loading} {...props}>
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {icon && !loading && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};

export default Button;
