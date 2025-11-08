import { useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { loginUser, logout, clearError, initializeAuth, fetchAllUsers, createUser, updateUser } from '../../../store/authSlice';

import type { LoginCredentials, CreateUserData, UpdateUserData } from '../../../types/auth';

/**
 * Domain hook wrapping auth slice interactions.
 * Provides stable callbacks for common auth operations.
 */
export function useAuth() {
  const dispatch = useAppDispatch();
  const { user, users, isAuthenticated, isLoading, error } = useAppSelector((s) => s.auth);

  const login = useCallback((creds: LoginCredentials) => dispatch(loginUser(creds)), [dispatch]);
  const initialize = useCallback(() => dispatch(initializeAuth()), [dispatch]);
  const signOut = useCallback(() => dispatch(logout()), [dispatch]);
  const clearAuthError = useCallback(() => dispatch(clearError()), [dispatch]);
  const listUsers = useCallback(() => dispatch(fetchAllUsers()), [dispatch]);
  const addUser = useCallback((data: CreateUserData) => dispatch(createUser(data)), [dispatch]);
  const editUser = useCallback((data: UpdateUserData) => dispatch(updateUser(data)), [dispatch]);

  return {
    // state
    user,
    users,
    isAuthenticated,
    isLoading,
    error,
    // actions
    login,
    initialize,
    signOut,
    clearAuthError,
    listUsers,
    addUser,
    editUser,
  };
}
