-- ⚡ QUICK RESET - Copy and paste this entire block into your Supabase SQL Editor

DROP TABLE IF EXISTS users CASCADE;
DROP POLICY IF EXISTS "Allow all operations for demo" ON users;

CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('SuperAdmin', 'Admin', 'Employee')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations for demo" ON users FOR ALL USING (true) WITH CHECK (true);

INSERT INTO users (username, password, role, created_by) 
VALUES ('superadmin', 'admin123', 'SuperAdmin', NULL);

-- ✅ Setup complete! Refresh your React app and login with: superadmin / admin123
