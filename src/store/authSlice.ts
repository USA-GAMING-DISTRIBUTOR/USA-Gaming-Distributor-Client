import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import { supabase } from '../lib/supabase'
import type { User, AuthState, LoginCredentials, CreateUserData, UpdateUserData } from '../types/auth'

const initialState: AuthState = {
  user: null,
  users: [],
  isAuthenticated: false,
  isLoading: false,
  error: null,
}

// Async thunks for API calls
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      console.log('🔐 Starting login attempt for:', credentials.username);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', credentials.username)
        .eq('password', credentials.password)
        .single()

      console.log('📊 Supabase response:', { data, error });

      if (error) {
        console.error('❌ Supabase login error:', error);
        
        // Check if it's a table not found error
        if (error.code === '42P01' || error.message.includes('relation "users" does not exist')) {
          const errorMsg = 'Database not set up. Please check the console for setup instructions.';
          console.log('🔧 Database setup error:', errorMsg);
          return rejectWithValue(errorMsg);
        }
        
        // Check for specific Supabase error codes
        if (error.code === 'PGRST116') {
          // No rows returned (user not found or wrong credentials)
          const errorMsg = 'Invalid username or password';
          console.log('🚫 No rows found:', errorMsg);
          return rejectWithValue(errorMsg);
        }
        
        // Handle 406 Not Acceptable and other HTTP errors
        if (error.message.includes('406') || error.message.includes('Not Acceptable')) {
          const errorMsg = 'Invalid username or password';
          console.log('⚠️ 406 error:', errorMsg);
          return rejectWithValue(errorMsg);
        }
        
        // Handle other potential errors
        if (error.code === 'PGRST301') {
          const errorMsg = 'Database error. Please try again.';
          console.log('🔄 Database error:', errorMsg);
          return rejectWithValue(errorMsg);
        }
        
        // Default to invalid credentials for any other database error
        const errorMsg = 'Invalid username or password';
        console.log('🚨 Default error case:', errorMsg, 'Original error:', error);
        return rejectWithValue(errorMsg);
      }

      // If no data returned, credentials are invalid
      if (!data) {
        const errorMsg = 'Invalid username or password';
        console.log('📭 No data returned:', errorMsg);
        return rejectWithValue(errorMsg);
      }

      console.log('✅ Login successful for:', data.username);
      return data as User;
    } catch (error) {
      console.error('💥 Login error in catch block:', error);
      const errorMsg = error instanceof Error ? error.message : 'Login failed';
      console.log('🔄 Rejecting with value:', errorMsg);
      return rejectWithValue(errorMsg);
    }
  }
)

export const fetchAllUsers = createAsyncThunk(
  'auth/fetchAllUsers',
  async (_, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      return data as User[]
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch users')
    }
  }
)

export const createUser = createAsyncThunk(
  'auth/createUser',
  async (userData: CreateUserData, { rejectWithValue }) => {
    try {
      // Check if username already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('username')
        .eq('username', userData.username)
        .single()

      if (existingUser) {
        throw new Error('Username already exists')
      }

      const { data, error } = await supabase
        .from('users')
        .insert([{
          username: userData.username,
          password: userData.password,
          role: userData.role,
          created_by: userData.created_by,
        }])
        .select()
        .single()

      if (error) {
        throw error
      }

      return data as User
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create user')
    }
  }
)

export const updateUser = createAsyncThunk(
  'auth/updateUser',
  async (userData: UpdateUserData, { rejectWithValue }) => {
    try {
      // Check if username already exists for another user
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, username')
        .eq('username', userData.username)
        .neq('id', userData.id)
        .single()

      if (existingUser) {
        throw new Error('Username already exists')
      }

      // Prepare update data
      const updateData: Partial<User> = {
        username: userData.username,
        role: userData.role,
      }

      // Only include password if it's provided
      if (userData.password && userData.password.trim() !== '') {
        updateData.password = userData.password
      }

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userData.id)
        .select()
        .single()

      if (error) {
        throw error
      }

      return data as User
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update user')
    }
  }
)

export const initializeAuth = createAsyncThunk(
  'auth/initializeAuth',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      // Check if there's a user in localStorage
      const savedUser = localStorage.getItem('currentUser')
      if (savedUser) {
        const user = JSON.parse(savedUser) as User
        // Verify user still exists in database
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()

        if (!error && data) {
          // Fetch all users as well
          dispatch(fetchAllUsers())
          return data as User
        } else {
          // Remove invalid user from localStorage
          localStorage.removeItem('currentUser')
          return null
        }
      }
      
      // Fetch all users for initial load
      dispatch(fetchAllUsers())
      return null
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Initialization failed')
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null
      state.isAuthenticated = false
      state.error = null
      localStorage.removeItem('currentUser')
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    // Login user
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.isLoading = false
        state.user = action.payload
        state.isAuthenticated = true
        state.error = null
        localStorage.setItem('currentUser', JSON.stringify(action.payload))
      })
      .addCase(loginUser.rejected, (state, action) => {
        console.log('🔴 Login rejected in reducer:', action.payload);
        state.isLoading = false
        state.error = action.payload as string
        state.isAuthenticated = false
        console.log('📝 State after error:', { error: state.error, isAuthenticated: state.isAuthenticated });
      })

    // Fetch all users
    builder
      .addCase(fetchAllUsers.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchAllUsers.fulfilled, (state, action: PayloadAction<User[]>) => {
        state.isLoading = false
        state.users = action.payload
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

    // Create user
    builder
      .addCase(createUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(createUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.isLoading = false
        state.users.unshift(action.payload)
        state.error = null
      })
      .addCase(createUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

    // Update user
    builder
      .addCase(updateUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(updateUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.isLoading = false
        const index = state.users.findIndex(u => u.id === action.payload.id)
        if (index !== -1) {
          state.users[index] = action.payload
        }
        // Also update the current user if it's the same user
        if (state.user?.id === action.payload.id) {
          state.user = action.payload
          localStorage.setItem('currentUser', JSON.stringify(action.payload))
        }
        state.error = null
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

    // Initialize auth
    builder
      .addCase(initializeAuth.pending, (state) => {
        state.isLoading = true
      })
      .addCase(initializeAuth.fulfilled, (state, action: PayloadAction<User | null>) => {
        state.isLoading = false
        if (action.payload) {
          state.user = action.payload
          state.isAuthenticated = true
        }
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
  },
})

export const { logout, clearError } = authSlice.actions
export default authSlice.reducer
