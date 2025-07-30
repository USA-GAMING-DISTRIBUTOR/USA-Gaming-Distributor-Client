-- =====================================================
-- USA Gaming Distributor - Database Reset & Setup
-- =====================================================

-- 1. DROP EXISTING TABLE AND POLICIES (Reset everything)
-- =====================================================

-- Drop existing policies first
DROP POLICY IF EXISTS "Allow all operations for demo" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable update for users based on role" ON users;

-- Drop existing indexes
DROP INDEX IF EXISTS idx_users_username;
DROP INDEX IF EXISTS idx_users_role;

-- Drop the users table completely
DROP TABLE IF EXISTS users CASCADE;

-- 2. CREATE FRESH USERS TABLE
-- =====================================================

-- Create users table with proper structure
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('SuperAdmin', 'Admin', 'Employee')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- 3. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);

-- 4. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 5. CREATE PERMISSIVE POLICIES (FOR DEMO PURPOSES)
-- =====================================================
-- Note: In production, you should create more restrictive policies

-- Allow all operations for demonstration purposes
CREATE POLICY "Allow all operations for demo" ON users
  FOR ALL USING (true) WITH CHECK (true);

-- 6. INSERT DEFAULT SUPERADMIN USER
-- =====================================================

INSERT INTO users (username, password, role, created_by) 
VALUES ('superadmin', 'admin123', 'SuperAdmin', NULL);

-- 7. INSERT SOME SAMPLE DATA (OPTIONAL)
-- =====================================================
-- Uncomment the lines below if you want some sample users

-- INSERT INTO users (username, password, role, created_by) 
-- VALUES 
--   ('admin1', 'admin123', 'Admin', (SELECT id FROM users WHERE username = 'superadmin')),
--   ('employee1', 'emp123', 'Employee', (SELECT id FROM users WHERE username = 'superadmin')),
--   ('employee2', 'emp123', 'Employee', (SELECT id FROM users WHERE username = 'superadmin'));

-- 8. VERIFY THE SETUP
-- =====================================================

-- Check if everything was created correctly
SELECT 
  'Table created' as status,
  COUNT(*) as user_count,
  STRING_AGG(DISTINCT role, ', ') as roles_available
FROM users;

-- Show all users
SELECT 
  id,
  username,
  role,
  created_at,
  created_by
FROM users
ORDER BY created_at;

-- =====================================================
-- SETUP COMPLETE! 
-- =====================================================
-- 
-- ✅ Users table created with proper structure
-- ✅ Indexes added for performance
-- ✅ Row Level Security enabled
-- ✅ Permissive policies created for demo
-- ✅ Default SuperAdmin user created
--
-- 🔑 Default Login Credentials:
-- Username: superadmin
-- Password: admin123
--
-- 💡 You can now refresh your React app and login!
-- =====================================================
