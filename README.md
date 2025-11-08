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

# Format code (Prettier)
npm run format

# Check formatting (no write)
npm run format:check
```

## Formatting & Linting

This project uses Prettier for code formatting and ESLint for static analysis. ESLint is configured with the flat config and integrates `eslint-config-prettier` to avoid rule conflicts with Prettier.

- Auto-format all files: `npm run format`
- Check formatting without writing: `npm run format:check`
- Lint: `npm run lint`

Prettier is configured via `.prettierrc.json` (single quotes, trailing commas, 100 char line width). You can use your editor's Prettier extension to format on save.

## Logging

Use the centralized logger in `src/lib/logger.ts` instead of raw `console.*` calls:

```ts
import { logger } from './lib/logger';
logger.info('Loading dashboard');
logger.warn('Inventory low for platform', { platformId, inventory });
logger.error('Purchase history fetch failed', error);
```

Log levels:

- `debug` – verbose developer diagnostics
- `info` – normal lifecycle progress/events
- `warn` – recoverable issues, degraded state
- `error` – failures needing attention

See `docs/LOGGING.md` for full guidelines.

## Security Notes
See `docs/SECURITY.md` for a detailed roadmap (authentication migration, RLS hardening, secrets, rate limiting) and per-release checklist.
## Changelog

See `CHANGELOG.md` for a human-readable list of notable changes, planned work, and versioning policy. Add entries under the Unreleased section when submitting feature PRs.

- Passwords are stored in plain text for demo purposes. In production, implement proper password hashing.
- Row Level Security (RLS) is enabled on the users table for additional security.
- Environment variables are used for Supabase credentials.

## License

MIT License

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x';
import reactDom from 'eslint-plugin-react-dom';

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
]);
```

## Supabase CLI Workflow

The project includes the Supabase CLI (as a dev dependency) and a lightweight database workflow so you can manage schema and generate TypeScript types locally.

### 1. Auth & Project Link

Install global CLI (optional if you rely on the local binary in node_modules):

```bash
npm i -g supabase # optional
```

Login & link (stores access token locally):

```bash
npm run supabase login
npm run supabase link --project-ref your-project-ref
```

Alternatively you can run `npx supabase login` if you prefer no global install. The `project-ref` is the subdomain part of your Supabase URL (`https://<project-ref>.supabase.co`).

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Vite exposes variables prefixed with `VITE_` to the client bundle.

### 3. Local Migration Development

Create a new migration (you will be prompted for a name):

```bash
npm run db:new add_products_table
```

Edit the generated SQL under `supabase/migrations/<timestamp>_add_products_table.sql`.

Push migrations to your linked remote project:

```bash
npm run db:push
```

Reset (DANGER: re-applies all migrations & runs `seed.sql`):

```bash
npm run db:reset
```

### 4. Seeding

`supabase/seed.sql` runs automatically on `db:reset`. Keep it idempotent (use `where not exists`).

### 5. Type Generation

Generate strongly-typed Database definitions (writes to `src/types/database.types.ts`):

```bash
npm run db:gen
```

Then you can import types:

```ts
import { Database } from './types/database.types';
type User = Database['public']['Tables']['users']['Row'];
```

### 6. Updating the Supabase Client Types

Optionally replace the inline `Database` interface in `src/lib/supabase.ts` with the generated one:

```ts
import { Database } from '../types/database.types';
```

### 7. Recommended Workflow Summary

1. Write migration SQL (or generate via `db:new`).
2. `npm run db:push` to apply to remote.
3. `npm run db:gen` to refresh TypeScript types.
4. Update application code with new types / tables.
5. Commit: migration + type file + related code.

### 8. Realtime & RLS Notes

Current policies are permissive (select/insert/update for all). Harden them before production by scoping to `auth.uid()`, roles, or custom claims. Realtime listens to changes automatically if you subscribe using the Supabase JS client.

### 9. Troubleshooting

| Issue                       | Fix                                                                                      |
| --------------------------- | ---------------------------------------------------------------------------------------- |
| Permission denied on push   | Ensure project is linked & token has rights (`supabase link`)                            |
| Types file empty            | Run `npm run db:push` first so introspection sees latest schema                          |
| Reset fails on foreign keys | Order statements or use `cascade` carefully; prefer additional down migrations if needed |

---

Happy shipping!

## Atomic Inventory RPC
## Storybook (Optional)

If you want interactive, isolated component development, see `docs/STORYBOOK.md` for evaluation criteria and a minimal setup. This is optional and not required for production builds.

For an atomic update of platform inventory together with a purchase history insert, see `docs/ATOMIC_INVENTORY.md`. A typed client wrapper is available at `src/services/inventoryRpc.ts`. This is optional until you create the Postgres function described in the docs and wire it into the purchase flow.
