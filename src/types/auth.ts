export type UserRole = 'SuperAdmin' | 'Admin' | 'Employee';

export interface User {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  created_at: string;
  created_by?: string | null;
}

export interface AuthState {
  user: User | null;
  users: User[];
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  error: string | null;
}

export interface LoginFormData {
  username: string;
  password: string;
}

export interface CreateUserFormData {
  username: string;
  password: string;
  role: UserRole;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface CreateUserData {
  username: string;
  password: string;
  role: UserRole;
  created_by?: string | null;
}

export interface UpdateUserData {
  id: string;
  username: string;
  password?: string;
  role: UserRole;
}
