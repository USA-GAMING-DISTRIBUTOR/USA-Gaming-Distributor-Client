import { supabase } from '../lib/supabase'
import type { DbUser } from '../types/app.types'

// Simple test functions to verify Supabase connection
export async function testSupabaseConnection() {
  try {
    // Test basic connection by fetching users
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(5)
    
    if (error) {
      console.error('Supabase connection error:', error)
      return false
    }
    
    console.log('✅ Supabase connected successfully!')
    console.log('Sample data:', data)
    return true
  } catch (error) {
    console.error('❌ Failed to connect to Supabase:', error)
    return false
  }
}

export async function fetchUsers(): Promise<DbUser[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
  
  if (error) {
    console.error('Error fetching users:', error)
    return []
  }
  
  return data || []
}

export async function createUser(userData: {
  username: string
  password: string
  role: string
  created_by?: string
}): Promise<DbUser | null> {
  const { data, error } = await supabase
    .from('users')
    .insert([userData])
    .select()
    .single()
  
  if (error) {
    console.error('Error creating user:', error)
    return null
  }
  
  return data
}

export async function fetchTables() {
  try {
    // Check what tables are available
    const tables = ['users', 'customers', 'game_coins', 'orders', 'logs', 'customer_issues'] as const
    
    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      
      if (error) {
        console.log(`❌ Table '${table}': ${error.message}`)
      } else {
        console.log(`✅ Table '${table}': ${count} rows`)
      }
    }
  } catch (error) {
    console.error('Error checking tables:', error)
  }
}

// You can call this in the browser console to test:
// import { testSupabaseConnection, fetchTables } from './utils/supabaseTest'
// testSupabaseConnection()
// fetchTables()
