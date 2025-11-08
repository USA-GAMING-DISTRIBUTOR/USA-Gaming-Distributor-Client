import { describe, it, expect } from 'vitest';
import reducer, { logout, clearError, loginUser } from '../store/authSlice';
import type { AuthState } from '../types/auth';
import type { AnyAction } from '@reduxjs/toolkit';

// Helper to reduce boilerplate with proper typing
const reduce = (state: AuthState | undefined, action: AnyAction) => reducer(state, action);

describe('authSlice reducer', () => {
  it('returns initial state on unknown action', () => {
    const state = reduce(undefined, { type: 'unknown' });
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.isLoading).toBe(false);
  });

  it('handles loginUser.pending', () => {
    const state = reduce(undefined, { type: loginUser.pending.type });
    expect(state.isLoading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('handles loginUser.fulfilled', () => {
    const user = { id: '1', username: 'admin', role: 'admin', created_at: '', created_by: null };
    const state = reduce(undefined, { type: loginUser.fulfilled.type, payload: user });
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(user);
    expect(state.error).toBeNull();
  });

  it('handles loginUser.rejected', () => {
    const state = reduce(undefined, {
      type: loginUser.rejected.type,
      payload: 'Invalid username or password',
    });
    expect(state.isAuthenticated).toBe(false);
    expect(state.error).toBe('Invalid username or password');
    expect(state.isLoading).toBe(false);
  });

  it('handles logout', () => {
    const loggedIn = reduce(undefined, {
      type: loginUser.fulfilled.type,
      payload: { id: '1', username: 'admin', role: 'admin', created_at: '', created_by: null },
    });
    const state = reduce(loggedIn, logout());
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
  });

  it('handles clearError', () => {
    const errored = reduce(undefined, {
      type: loginUser.rejected.type,
      payload: 'boom',
    });
    const state = reduce(errored, clearError());
    expect(state.error).toBeNull();
  });
});
