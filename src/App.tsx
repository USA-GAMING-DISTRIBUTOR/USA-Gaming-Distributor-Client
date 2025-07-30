import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store";
import { useAppDispatch, useAppSelector } from "./hooks/redux";
import { initializeAuth } from "./store/authSlice";
import { checkDatabaseSetup } from "./utils/setupHelper";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import AdminDashboard from "./components/AdminDashboard";
import EmployeeDashboard from "./components/EmployeeDashboard";
import ProtectedRoute from "./components/ProtectedRoute";

const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user, isLoading } = useAppSelector(
    (state) => state.auth
  );

  useEffect(() => {
    // Display setup instructions in console

    // Initialize the database and auth state
    const init = async () => {
      // Check database setup and initialize
      await checkDatabaseSetup();
      // Initialize auth state from localStorage
      dispatch(initializeAuth());
    };

    init();
  }, [dispatch]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  // Route users to their appropriate dashboard based on role
  const getDashboardComponent = () => {
    switch (user?.role) {
      case "SuperAdmin":
        return <Dashboard />;
      case "Admin":
        return <AdminDashboard />;
      case "Employee":
        return <EmployeeDashboard />;
      default:
        return <Login />;
    }
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/dashboard"
          element={<ProtectedRoute>{getDashboardComponent()}</ProtectedRoute>}
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["SuperAdmin"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;
