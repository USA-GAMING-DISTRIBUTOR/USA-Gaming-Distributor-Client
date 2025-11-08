# Security Roadmap and Guidelines

This document outlines the security posture, known gaps, and the roadmap to harden the USA Gaming Distributor Client. It focuses on authentication, authorization (RLS policies), secrets management, logging, and operational practices.

## Objectives
- Remove plaintext passwords and adopt a secure authentication mechanism.
- Enforce least-privilege access to data via Row Level Security (RLS).
- Protect secrets, tokens, and sensitive user data (PII).
- Add guardrails: rate limiting, input validation, secure logging.

## Current State (as of 0.1.0)
- Demo-only custom `users` table with plaintext `password` column.
- RLS noted as enabled in docs but policies are permissive.
- Role model: `SuperAdmin`, `Admin`, `Employee`.
- Client uses environment variables via Vite (`VITE_*`).
- Centralized logger implemented; avoid `console.*` in code.

## Threat Model (high-level)
- Unauthorized read/write of user accounts or inventory.
- Privilege escalation (Employee acting as Admin).
- Token theft via XSS / misconfigured storage.
- Data exfiltration via overscoped RLS policies.
- Credential compromise due to plaintext storage.

---

## Roadmap

### Phase 1 (v0.2.x) — Authentication and Secrets
1) Switch to Supabase Auth (recommended)
   - Use `auth.users` for identities; store app roles in `public.profiles` (or `users_app`) table linked by `auth.uid()`.
   - Remove custom plaintext `password` column.
   - Update client to sign in via Supabase Auth, rely on `supabase.auth.getSession()`.

   Alternative (temporary): Keep custom table
   - Add `password_hash` (bcrypt) column.
   - Migration path: force password reset flow; eliminate storing plaintext.
   - Verify with strong password policy & rate-limited login attempts.

2) Secrets and keys
   - Keep `.env` out of VCS; rotate `VITE_SUPABASE_ANON_KEY` if exposed.
   - Use separate keys for local/staging/prod; enable minimal scopes per environment.

3) Session handling
   - Prefer Supabase-managed sessions; if custom, store JWT in httpOnly, Secure, SameSite=strict cookie.
   - Never store tokens in `localStorage` when avoidable.

### Phase 2 (v0.3.x) — Authorization via RLS
1) Profiles table and role binding
   - `public.profiles`: `id uuid primary key default auth.uid()`, `role text check in ('SuperAdmin','Admin','Employee')`.
   - Ensure row is created/maintained on signup.

2) Apply RLS on tables (examples, adapt to your schema)
   - Users/profiles
     - SELECT: user can select own profile; Admin/SuperAdmin can list.
     - INSERT/UPDATE: restricted to Admin/SuperAdmin; user can update own non-privileged fields.
   - Orders / Purchase History
     - SELECT: Admin/SuperAdmin see all; Employee read subset based on assignment.
     - INSERT/UPDATE: Admin/SuperAdmin; Employee limited per workflow.
   - Platforms/Inventory
     - SELECT: all authenticated roles.
     - UPDATE: Admin/SuperAdmin; optionally allow Employee via explicit policy.

   Suggested policy pattern
   - Use helper SQL functions, e.g. `current_role()` reading from `profiles.role` for `auth.uid()`.
   - Policies reference `auth.uid()` and role checks for clarity and reuse.

3) Least-privilege
   - Default deny; add minimal allow rules.
   - Split admin writes from employee writes when business rules differ.

### Phase 3 (v0.4.x) — Operational Hardening
- Rate limiting via Edge Functions (e.g., login, sensitive mutations).
- Input validation (Zod) at boundaries: forms & RPC payloads.
- Dependency and container scanning (SCA): renovate/dependabot.
- Audit logs: track sensitive changes (role changes, inventory adjustments).
- Backups and recovery plan; disaster drill tests.

---

## Sample Snippets (reference only)

### Profiles table
```sql
create table if not exists public.profiles (
  id uuid primary key default auth.uid(),
  role text not null check (role in ('SuperAdmin','Admin','Employee')),
  created_at timestamp with time zone default now()
);

alter table public.profiles enable row level security;
```

### Helper function
```sql
create or replace function public.current_role()
returns text language sql stable as $$
  select role from public.profiles where id = auth.uid();
$$;
```

### Example policy pattern
```sql
-- Everyone authenticated can read platforms
create policy platforms_select on public.platforms
  for select using ( auth.role() = 'authenticated' );

-- Only Admin/SuperAdmin can update platforms
create policy platforms_update_admin on public.platforms
  for update using ( public.current_role() in ('Admin','SuperAdmin') );
```

Adapt these to your actual table names and schema.

---

## Passwords and Credentials
- Prefer Supabase Auth; do not store plaintext passwords.
- If migrating from plaintext:
  - Add `password_hash` column; implement password reset to populate hashes.
  - Remove plaintext column once migration is complete.
- Enforce password policy (length, complexity, reuse).

## Logging and PII
- Do not log passwords, secrets, or tokens.
- Mask or avoid logging PII (emails, usernames) unless necessary.
- Surface user-friendly messages without sensitive details.

## Token and Cookie Settings
- httpOnly, Secure, SameSite=strict for cookies.
- Short-lived access tokens; refresh tokens rotated automatically (Supabase handles this when used).

## Rate Limiting & Abuse Prevention
- Apply throttling on login and mutation endpoints (Edge Functions or API gateway).
- Consider CAPTCHA or challenge for suspicious activity.

## Secrets Management
- `.env` not committed; use environment-specific secrets.
- Rotate keys when compromised; use minimal scopes for anon/service roles.

## Dependency Hygiene
- Keep dependencies up to date; use automated PRs with CI tests.
- Pin versions to reduce supply-chain risk; review transitive changes periodically.

## Security Checklist (per release)
- [ ] No plaintext secrets in repo
- [ ] Supabase keys rotated if leaked
- [ ] RLS policies reviewed for new tables/columns
- [ ] Auth flow tested for all roles
- [ ] Logs free of PII/secrets
- [ ] Dependencies updated and scanned

## References
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Auth: https://supabase.com/docs/guides/auth
- OWASP ASVS: https://owasp.org/ASVS/
- Keep a Changelog: https://keepachangelog.com/
