import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Legacy inline types for backward compatibility (you can remove these if not needed)
export interface LegacyDatabase {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string
          password: string
          role: 'SuperAdmin' | 'Admin' | 'Employee'
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          username: string
          password: string
          role: 'SuperAdmin' | 'Admin' | 'Employee'
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          username?: string
          password?: string
          role?: 'SuperAdmin' | 'Admin' | 'Employee'
          created_at?: string
          created_by?: string | null
        }
      }
    }
  }
}
