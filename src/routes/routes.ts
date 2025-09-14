import { lazy } from 'react'
import type { UserRole } from '../types/auth'

// Route types
export interface RouteConfig {
  path: string
  name: string
  component: React.LazyExoticComponent<React.ComponentType<any>>
  allowedRoles?: UserRole[]
  layout?: 'auth' | 'dashboard' | 'public'
  exact?: boolean
}

// Lazy load components for code splitting
const LoginPage = lazy(() => import('../pages/auth/LoginPage'))
const SuperAdminDashboard = lazy(() => import('../components/Dashboard'))
const AdminDashboard = lazy(() => import('../components/AdminDashboard'))
const EmployeeDashboard = lazy(() => import('../components/EmployeeDashboard'))

// Route definitions
export const ROUTE_PATHS = {
  // Public routes
  LOGIN: '/login',
  
  // Dashboard routes
  DASHBOARD: '/dashboard',
  SUPER_ADMIN: '/super-admin',
  ADMIN: '/admin',
  EMPLOYEE: '/employee',
  
  // Feature routes
  USERS: '/users',
  PLATFORMS: '/platforms',
  ORDERS: '/orders',
  CUSTOMERS: '/customers',
  REPORTS: '/reports',
  LOGS: '/logs',
  ISSUES: '/issues',
} as const

// Public routes (no authentication required)
export const publicRoutes: RouteConfig[] = [
  {
    path: ROUTE_PATHS.LOGIN,
    name: 'Login',
    component: LoginPage,
    layout: 'auth',
  },
]

// Private routes (authentication required)
export const privateRoutes: RouteConfig[] = [
  {
    path: ROUTE_PATHS.SUPER_ADMIN,
    name: 'Super Admin Dashboard',
    component: SuperAdminDashboard,
    allowedRoles: ['SuperAdmin'],
    layout: 'dashboard',
  },
  {
    path: ROUTE_PATHS.ADMIN,
    name: 'Admin Dashboard',
    component: AdminDashboard,
    allowedRoles: ['Admin'],
    layout: 'public', // AdminDashboard has its own layout
  },
  {
    path: ROUTE_PATHS.EMPLOYEE,
    name: 'Employee Dashboard',
    component: EmployeeDashboard,
    allowedRoles: ['Employee'],
    layout: 'dashboard',
  },
]

// Role-based dashboard mapping
export const getRoleBasedDashboard = (role: UserRole): string => {
  switch (role) {
    case 'SuperAdmin':
      return ROUTE_PATHS.SUPER_ADMIN
    case 'Admin':
      return ROUTE_PATHS.ADMIN
    case 'Employee':
      return ROUTE_PATHS.EMPLOYEE
    default:
      return ROUTE_PATHS.LOGIN
  }
}

// Helper to check if user has access to route
export const hasRouteAccess = (route: RouteConfig, userRole?: UserRole): boolean => {
  if (!route.allowedRoles) return true
  if (!userRole) return false
  return route.allowedRoles.includes(userRole)
}
