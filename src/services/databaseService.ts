import { supabase } from '../lib/supabase'

export const createUsersTable = async () => {
  try {
    // Check if users table exists by trying to query it
    const { error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (error) {
      console.log('Users table does not exist, needs manual creation')
      return false
    }
    
    console.log('Users table already exists')
    return true
  } catch (error) {
    console.error('Error checking users table:', error)
    return false
  }
}

export const initializeDatabase = async () => {
  try {
    // First, check if we can access the users table
    const { error: tableError } = await supabase
      .from('users')
      .select('count')
      .limit(1)

    if (tableError) {
      // Table doesn't exist, show instructions
      console.error('Users table does not exist. Please create it manually.')
      console.log(`
🔧 SETUP REQUIRED: Please run this SQL in your Supabase SQL Editor:

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('SuperAdmin', 'Admin', 'Employee')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Enable Row Level Security (RLS) - IMPORTANT!
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for demo (you can make these more restrictive later)
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable update for users based on role" ON users;

CREATE POLICY "Allow all operations for demo" ON users
  FOR ALL USING (true) WITH CHECK (true);

-- Insert default SuperAdmin user
INSERT INTO users (username, password, role, created_by) 
VALUES ('superadmin', 'admin123', 'SuperAdmin', NULL)
ON CONFLICT (username) DO NOTHING;

💡 After running this SQL, refresh the page to continue.
      `)
      return false
    }

    // Check if SuperAdmin already exists
    const { data: existingSuperAdmin, error: selectError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'SuperAdmin')
      .single()

    if (selectError && selectError.code !== 'PGRST116') {
      // PGRST116 means no rows found, which is okay
      console.error('Error checking for SuperAdmin:', selectError)
      return false
    }

    if (!existingSuperAdmin) {
      // Create default SuperAdmin user
      const { data, error } = await supabase
        .from('users')
        .insert([{
          username: 'superadmin',
          password: 'admin123',
          role: 'SuperAdmin' as const,
          created_by: null,
        }])
        .select()
        .single()

      if (error) {
        console.error('Error creating default SuperAdmin:', error)
        return false
      }

      console.log('✅ Default SuperAdmin created:', data)
      return true
    }

    console.log('✅ SuperAdmin already exists')
    return true
  } catch (error) {
    console.error('Error initializing database:', error)
    return false
  }
}
