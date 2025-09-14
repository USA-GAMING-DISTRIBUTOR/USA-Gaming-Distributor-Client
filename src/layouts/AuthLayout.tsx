import React from "react";

interface AuthLayoutProps {
  children: React.ReactNode;
}

/**
 * Authentication layout matching your original pink/purple theme
 */
const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-400 via-pink-500 to-pink-600 flex items-center justify-center p-4">
      <div className="max-w-sm w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            Welcome Back!
          </h1>
        </div>

        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
