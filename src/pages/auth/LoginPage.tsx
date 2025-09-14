import React, { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { loginUser } from "../../store/authSlice";
import { validateLogin } from "../../utils/FormValidator";
import type { LoginFormData } from "../../utils/FormValidator";

/**
 * Login page component with your original design
 */
const LoginPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState<LoginFormData>({
    username: "",
    password: "",
  });

  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [rememberMe, setRememberMe] = useState<boolean>(false);

  useEffect(() => {
    setValidationErrors({});

    // Load saved credentials if they exist
    const savedCredentials = localStorage.getItem("rememberedCredentials");
    if (savedCredentials) {
      try {
        const { username, password } = JSON.parse(savedCredentials);
        setFormData({ username, password });
        setRememberMe(true);
      } catch {
        // Clear invalid stored data
        localStorage.removeItem("rememberedCredentials");
      }
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear validation error for this field when user starts typing
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    // Validate form data
    const validation = validateLogin(formData);
    if (!validation.success) {
      setValidationErrors(validation.errors);
      return;
    }

    // Save or remove credentials based on "Remember Me" checkbox
    if (rememberMe) {
      localStorage.setItem(
        "rememberedCredentials",
        JSON.stringify({
          username: formData.username.trim(),
          password: formData.password,
        })
      );
    } else {
      localStorage.removeItem("rememberedCredentials");
    }

    try {
      await dispatch(
        loginUser({
          username: formData.username.trim(),
          password: formData.password,
        })
      ).unwrap();
    } catch (error) {
      // Error is handled by the auth slice
      console.error("Login failed:", error);
    }
  };

  return (
    <>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-400 text-red-700 text-sm">
          <p>
            {error.includes("Database not set up")
              ? "Database connection error. Please contact support."
              : error.includes("Invalid username or password")
              ? "Invalid username or password."
              : error.includes("Database error")
              ? "Database connection issue. Please try again."
              : error.includes("Login failed")
              ? "Login failed. Please check your credentials."
              : error}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="username"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Username
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-pink-400 outline-none transition-all ${
              validationErrors.username
                ? "border-red-300 focus:ring-red-400 focus:border-red-400"
                : "border-gray-200"
            }`}
            placeholder="Enter your username"
            disabled={isLoading}
          />
          {validationErrors.username && (
            <p className="mt-1 text-sm text-red-600">
              {validationErrors.username}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-pink-400 outline-none transition-all ${
              validationErrors.password
                ? "border-red-300 focus:ring-red-400 focus:border-red-400"
                : "border-gray-200"
            }`}
            placeholder="Enter your password"
            disabled={isLoading}
          />
          {validationErrors.password && (
            <p className="mt-1 text-sm text-red-600">
              {validationErrors.password}
            </p>
          )}
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="rememberMe"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
            disabled={isLoading}
          />
          <label
            htmlFor="rememberMe"
            className="ml-2 block text-sm text-gray-700"
          >
            Remember me
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-pink-500 hover:bg-pink-600 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <span>Logging in...</span>
            </div>
          ) : (
            "Log In"
          )}
        </button>
      </form>
    </>
  );
};

export default LoginPage;
