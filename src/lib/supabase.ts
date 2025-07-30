import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Database {
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
