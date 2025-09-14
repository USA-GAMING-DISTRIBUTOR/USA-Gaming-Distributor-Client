-- Migration: 0001_init_users
-- Description: Create users table with roles and policies

create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password text not null,
  role text not null check (role in ('SuperAdmin','Admin','Employee')),
  created_at timestamptz default now(),
  created_by uuid references public.users(id)
);

-- Indexes
create index if not exists idx_users_username on public.users (username);
create index if not exists idx_users_role on public.users (role);

-- Row Level Security
alter table public.users enable row level security;

-- Policies (simplified; refine for production)
create policy "users_select_all" on public.users for select using (true);
create policy "users_insert_all" on public.users for insert with check (true);
create policy "users_update_all" on public.users for update using (true);
