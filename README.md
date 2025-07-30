# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

# USA Gaming Distributor Client

A React + TypeScript authentication system with role-based access control using Supabase and Redux.

## Features

- **Role-based Authentication**: SuperAdmin, Admin, and Employee roles
- **Supabase Backend**: Secure database with user management
- **Redux State Management**: Centralized state with RTK Query
- **Modern UI**: Tailwind CSS with responsive design
- **TypeScript**: Full type safety throughout the application

## User Roles

### SuperAdmin
- Full system access
- Can create Admin and Employee users
- Complete user management dashboard
- Default credentials: `superadmin` / `admin123`

### Admin
- Read-only access to user information
- Limited dashboard with statistics
- Cannot create or modify users

### Employee
- Basic dashboard access
- Personal task management
- Time tracking features

## Setup Instructions

### 1. Clone and Install
```bash
git clone <repository-url>
cd USA-Gaming-Distributor-Client
npm install
```

### 2. Supabase Setup

1. Create a new project at [Supabase](https://supabase.com/)
2. Go to Settings > API in your Supabase dashboard
3. Copy your project URL and anon key
4. Copy `.env.example` to `.env` and add your credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Database Setup

Run the following SQL in your Supabase SQL editor:

```sql
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

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON users
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for users based on role" ON users
  FOR UPDATE USING (true);
```

### 4. Run the Application

```bash
npm run dev
```

The application will automatically create a default SuperAdmin user when you first run it.

## Technology Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS
- **State Management**: Redux Toolkit
- **Backend**: Supabase
- **Icons**: Lucide React
- **Routing**: React Router DOM

## Project Structure

```
src/
├── components/          # React components
│   ├── Login.tsx       # Login form
│   ├── Dashboard.tsx   # SuperAdmin dashboard
│   ├── AdminDashboard.tsx
│   ├── EmployeeDashboard.tsx
│   └── ProtectedRoute.tsx
├── hooks/              # Custom hooks
│   └── redux.ts        # Typed Redux hooks
├── lib/                # External library configs
│   └── supabase.ts     # Supabase client
├── services/           # API services
│   └── databaseService.ts
├── store/              # Redux store
│   ├── index.ts        # Store configuration
│   └── authSlice.ts    # Auth state management
└── types/              # TypeScript types
    └── auth.ts         # Authentication types
```

## Default Credentials

- **Username**: `superadmin`
- **Password**: `admin123`

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Security Notes

- Passwords are stored in plain text for demo purposes. In production, implement proper password hashing.
- Row Level Security (RLS) is enabled on the users table for additional security.
- Environment variables are used for Supabase credentials.

## License

MIT License

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
