import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';

import type { AuthState, CreateUserData, LoginCredentials, UpdateUserData, User } from '../domains/auth/types';

// Discriminated error codes for auth operations; helps UI map to friendly messages.
export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'DB_NOT_READY'
  | 'USERNAME_EXISTS'
  | 'DB_ERROR'
  | 'INIT_FAILED'
  | 'UNKNOWN';

export interface AuthError {
  code: AuthErrorCode;
  message: string;
}

// Helper to standardize rejection payloads
function authReject(code: AuthErrorCode, message: string): AuthError {
  return { code, message };
}

/** Initial authentication slice state. */
const initialState: AuthState = {
  user: null,
  users: [],
  isAuthenticated: false,
  isLoading: false,
  isInitializing: true,
  error: null,
};

// Async thunks for API calls
/**
 * Attempt to authenticate a user against the `users` table.
 * Returns the User on success; rejects with a user-friendly message on failure.
 */
export const loginUser = createAsyncThunk<User, LoginCredentials, { rejectValue: AuthError }>(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      logger.debug('🔐 loginUser start', credentials.username);

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', credentials.username)
        .eq('password', credentials.password)
        .single();

      if (error) {
        if (error.code === '42P01' || error.message.includes('relation "users" does not exist')) {
          return rejectWithValue(authReject('DB_NOT_READY', 'Database not set up.'));
        }
        if (error.code === 'PGRST116' || error.message.includes('406')) {
          return rejectWithValue(authReject('INVALID_CREDENTIALS', 'Invalid username or password'));
        }
        if (error.code === 'PGRST301') {
          return rejectWithValue(authReject('DB_ERROR', 'Database error. Please try again.'));
        }
        return rejectWithValue(authReject('INVALID_CREDENTIALS', 'Invalid username or password'));
      }
      if (!data) {
        return rejectWithValue(authReject('INVALID_CREDENTIALS', 'Invalid username or password'));
      }
      logger.info('✅ login success', data.username);
      return data as User;
    } catch (e) {
      logger.error('💥 loginUser catch', e);
      return rejectWithValue(authReject('UNKNOWN', 'Login failed'));
    }
  },
);

/** Fetch all users ordered by most recent. */
export const fetchAllUsers = createAsyncThunk<User[], void, { rejectValue: AuthError }>(
  'auth/fetchAllUsers',
  async (_, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as User[];
    } catch (e) {
      logger.warn('fetchAllUsers error', e);
      return rejectWithValue(authReject('DB_ERROR', 'Failed to fetch users'));
    }
  },
);

/** Create a new user after ensuring the username is unique. */
export const createUser = createAsyncThunk<User, CreateUserData, { rejectValue: AuthError }>(
  'auth/createUser',
  async (userData, { rejectWithValue }) => {
    try {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('username', userData.username)
        .single();
      if (existingUser) {
        return rejectWithValue(authReject('USERNAME_EXISTS', 'Username already exists'));
      }
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            username: userData.username,
            password: userData.password,
            role: userData.role,
            created_by: userData.created_by,
          },
        ])
        .select()
        .single();
      if (error) throw error;
      return data as User;
    } catch (e) {
      logger.warn('createUser error', e);
      return rejectWithValue(authReject('DB_ERROR', 'Failed to create user'));
    }
  },
);

/** Update an existing user's username/role; optionally password if provided. */
export const updateUser = createAsyncThunk<User, UpdateUserData, { rejectValue: AuthError }>(
  'auth/updateUser',
  async (userData, { rejectWithValue }) => {
    try {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('username', userData.username)
        .neq('id', userData.id)
        .single();
      if (existingUser) {
        return rejectWithValue(authReject('USERNAME_EXISTS', 'Username already exists'));
      }
      const updateData: Partial<User> = { username: userData.username, role: userData.role };
      if (userData.password && userData.password.trim() !== '') {
        updateData.password = userData.password;
      }
      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userData.id)
        .select()
        .single();
      if (error) throw error;
      return data as User;
    } catch (e) {
      logger.warn('updateUser error', e);
      return rejectWithValue(authReject('DB_ERROR', 'Failed to update user'));
    }
  },
);

/**
 * Initialize auth state from localStorage and verify against DB.
 * Also preloads the users list for administrative views.
 */
export const initializeAuth = createAsyncThunk<User | null, void, { rejectValue: AuthError }>(
  'auth/initializeAuth',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        const user = JSON.parse(savedUser) as User;
        const { data, error } = await supabase.from('users').select('*').eq('id', user.id).single();
        if (!error && data) {
          // dispatch(fetchAllUsers()); removed
          return data as User;
        }
        localStorage.removeItem('currentUser');
      }
      // dispatch(fetchAllUsers()); removed
      return null;
    } catch (e) {
      logger.warn('initializeAuth error', e);
      return rejectWithValue(authReject('INIT_FAILED', 'Initialization failed'));
    }
  },
);

/** Redux Toolkit slice encapsulating authentication and user management state. */
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /** Clear user session and local cache. */
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem('currentUser');
    },
    /** Reset the latest error message. */
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Login user
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
        localStorage.setItem('currentUser', JSON.stringify(action.payload));
      })
      .addCase(loginUser.rejected, (state, action) => {
        const payload = action.payload as AuthError | undefined;
        logger.warn('🔴 loginUser rejected', payload);
        state.isLoading = false;
        state.error = payload?.message || 'Login failed';
        state.isAuthenticated = false;
      });

    // Fetch all users
    builder
      .addCase(fetchAllUsers.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchAllUsers.fulfilled, (state, action: PayloadAction<User[]>) => {
        state.isLoading = false;
        state.users = action.payload;
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as AuthError | undefined)?.message || 'Failed to fetch users';
      });

    // Create user
    builder
      .addCase(createUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.isLoading = false;
        state.users.unshift(action.payload);
        state.error = null;
      })
      .addCase(createUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as AuthError | undefined)?.message || 'Failed to create user';
      });

    // Update user
    builder
      .addCase(updateUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.isLoading = false;
        const index = state.users.findIndex((u) => u.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
        // Also update the current user if it's the same user
        if (state.user?.id === action.payload.id) {
          state.user = action.payload;
          localStorage.setItem('currentUser', JSON.stringify(action.payload));
        }
        state.error = null;
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as AuthError | undefined)?.message || 'Failed to update user';
      });

    // Initialize auth
    builder
      .addCase(initializeAuth.pending, (state) => {
        state.isLoading = true;
        state.isInitializing = true;
      })
      .addCase(initializeAuth.fulfilled, (state, action: PayloadAction<User | null>) => {
        state.isLoading = false;
        state.isInitializing = false;
        if (action.payload) {
          state.user = action.payload;
          state.isAuthenticated = true;
        }
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.isInitializing = false;
        state.error = (action.payload as AuthError | undefined)?.message || 'Initialization failed';
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
