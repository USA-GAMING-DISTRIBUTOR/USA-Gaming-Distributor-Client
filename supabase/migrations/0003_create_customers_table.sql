-- Migration: 0003_create_customers_table
-- Description: Create customers table for customer management

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text unique not null,
  phone text,
  address text,
  city text,
  state text,
  zip_code text,
  country text default 'USA',
  status text not null default 'active' check (status in ('active', 'inactive', 'suspended')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index if not exists idx_customers_email on public.customers (email);
create index if not exists idx_customers_name on public.customers (first_name, last_name);
create index if not exists idx_customers_status on public.customers (status);

-- Update trigger for updated_at
create trigger update_customers_updated_at
  before update on public.customers
  for each row
  execute function update_updated_at_column();

-- Row Level Security
alter table public.customers enable row level security;

-- Policies
create policy "customers_select_all" on public.customers for select using (true);
create policy "customers_insert_all" on public.customers for insert with check (true);
create policy "customers_update_all" on public.customers for update using (true);
create policy "customers_delete_all" on public.customers for delete using (true);
