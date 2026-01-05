import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from './index';
import type { User } from '../domains/auth/types';

// Base selector
export const selectAuth = (state: RootState) => state.auth;

// Primitives
export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectAuthLoading = (state: RootState) => state.auth.isLoading;
export const selectAuthInitializing = (state: RootState) => state.auth.isInitializing;
export const selectAuthError = (state: RootState) => state.auth.error;
export const selectUsers = (state: RootState) => state.auth.users;

// Derived
export const selectUserRole = createSelector(selectCurrentUser, (user) => user?.role ?? null);

export const selectIsSuperAdmin = createSelector(
  selectUserRole,
  (role) => role === 'SuperAdmin',
);

export const selectIsAdmin = createSelector(selectUserRole, (role) => role === 'Admin');

export const selectIsEmployee = createSelector(selectUserRole, (role) => role === 'Employee');

// Example: find a user by id
export const makeSelectUserById = (id: string) =>
  createSelector(selectUsers, (users: User[]) => users.find((u) => u.id === id) ?? null);
