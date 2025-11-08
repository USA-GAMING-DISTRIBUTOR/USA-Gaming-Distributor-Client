import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector } from '../hooks/redux';
import { publicRoutes, privateRoutes, getRoleBasedDashboard } from './routes';
import AuthLayout from '../layouts/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import Loader from '../components/common/Loader';

/**
 * Protected Route Component with role-based access control
 */
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requireAuth?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles = [],
  requireAuth = true,
}) => {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    return (
      <DashboardLayout currentPage="Access Denied">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </DashboardLayout>
    );
  }

  return <>{children}</>;
};

/**
 * Layout Wrapper Component
 */
interface LayoutWrapperProps {
  layout: 'auth' | 'dashboard' | 'public';
  children: React.ReactNode;
  routeName?: string;
}

const LayoutWrapper: React.FC<LayoutWrapperProps> = ({ layout, children, routeName }) => {
  switch (layout) {
    case 'auth':
      return <AuthLayout>{children}</AuthLayout>;
    case 'dashboard':
      return <DashboardLayout currentPage={routeName}>{children}</DashboardLayout>;
    case 'public':
    default:
      return <>{children}</>;
  }
};

/**
 * Main App Router Component
 */
const AppRouter: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAppSelector((state) => state.auth);

  // Show loading screen during auth initialization
  if (isLoading) {
    return <Loader fullScreen text="Initializing..." />;
  }

  return (
    <Suspense fallback={<Loader fullScreen text="Loading page..." />}>
      <Routes>
        {/* Public Routes */}
        {publicRoutes.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={
              isAuthenticated ? (
                <Navigate to={user ? getRoleBasedDashboard(user.role) : '/login'} replace />
              ) : (
                <LayoutWrapper layout={route.layout || 'public'} routeName={route.name}>
                  <route.component />
                </LayoutWrapper>
              )
            }
          />
        ))}

        {/* Private Routes */}
        {privateRoutes.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={
              <ProtectedRoute allowedRoles={route.allowedRoles} requireAuth={true}>
                <LayoutWrapper layout={route.layout || 'dashboard'} routeName={route.name}>
                  <route.component />
                </LayoutWrapper>
              </ProtectedRoute>
            }
          />
        ))}

        {/* Default redirects */}
        <Route
          path="/"
          element={
            <Navigate
              to={isAuthenticated && user ? getRoleBasedDashboard(user.role) : '/login'}
              replace
            />
          }
        />

        <Route
          path="/dashboard"
          element={
            <Navigate
              to={isAuthenticated && user ? getRoleBasedDashboard(user.role) : '/login'}
              replace
            />
          }
        />

        {/* 404 fallback */}
        <Route
          path="*"
          element={
            <DashboardLayout currentPage="Page Not Found">
              <div className="text-center py-12">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
                <p className="text-gray-600">The page you're looking for doesn't exist.</p>
              </div>
            </DashboardLayout>
          }
        />
      </Routes>
    </Suspense>
  );
};

export default AppRouter;
