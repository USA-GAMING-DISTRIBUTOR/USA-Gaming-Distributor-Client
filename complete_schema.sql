-- Complete Database Schema for USA Gaming Distributor
-- Run this in your Supabase SQL Editor

-- First, ensure the pgcrypto extension is available
create extension if not exists "pgcrypto";

-- Create the update_updated_at_column function first
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 1. Users table (if not exists)
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password text not null,
  role text not null check (role in ('SuperAdmin','Admin','Employee')),
  created_at timestamptz default now(),
  created_by uuid references public.users(id)
);

-- Users indexes
create index if not exists idx_users_username on public.users (username);
create index if not exists idx_users_role on public.users (role);

-- 2. Game Coins (Platforms) table
drop table if exists public.game_coins cascade;
create table public.game_coins (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  account_type text not null default 'Standard',
  inventory integer not null default 0,
  cost_price decimal(10,2) not null default 0.00,
  low_stock_alert integer not null default 10, -- Custom low stock alert threshold
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz -- Soft delete timestamp (null = not deleted)
);

-- Game coins indexes
create index idx_game_coins_platform on public.game_coins (platform);
create index idx_game_coins_account_type on public.game_coins (account_type);
create index idx_game_coins_inventory on public.game_coins (inventory);
create index idx_game_coins_low_stock_alert on public.game_coins (low_stock_alert);
create index idx_game_coins_deleted_at on public.game_coins (deleted_at);

-- Game coins trigger
create trigger update_game_coins_updated_at
  before update on public.game_coins
  for each row
  execute function update_updated_at_column();

-- 3. Customers table
drop table if exists public.customers cascade;
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_numbers text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Customers indexes
create index idx_customers_name on public.customers (name);
create index idx_customers_contact_numbers on public.customers using gin (contact_numbers);

-- Customers trigger
create trigger update_customers_updated_at
  before update on public.customers
  for each row
  execute function update_updated_at_column();

-- 3b. Customer Pricing table (for per-quantity pricing)
drop table if exists public.customer_pricing cascade;
create table public.customer_pricing (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete cascade,
  platform_id uuid references public.game_coins(id) on delete cascade,
  min_quantity integer not null default 1,
  max_quantity integer,
  unit_price decimal(10,2) not null,
  is_default boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(customer_id, platform_id, min_quantity)
);

-- Customer pricing indexes
create index idx_customer_pricing_customer_id on public.customer_pricing (customer_id);
create index idx_customer_pricing_platform_id on public.customer_pricing (platform_id);
create index idx_customer_pricing_quantity_range on public.customer_pricing (min_quantity, max_quantity);

-- Customer pricing trigger
create trigger update_customer_pricing_updated_at
  before update on public.customer_pricing
  for each row
  execute function update_updated_at_column();

-- 4. Orders table
drop table if exists public.orders cascade;
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete cascade,
  order_number text unique not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'verified', 'completed', 'replacement', 'refunded')),
  total_amount decimal(10,2) not null default 0.00,
  payment_method text,
  payment_status text default 'pending' check (payment_status in ('pending', 'completed', 'failed', 'refunded')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid references public.users(id) not null,
  verified_at timestamptz,
  verified_by uuid references public.users(id)
);

-- Orders indexes
create index idx_orders_customer_id on public.orders (customer_id);
create index idx_orders_status on public.orders (status);
create index idx_orders_payment_status on public.orders (payment_status);
create index idx_orders_created_at on public.orders (created_at);
create index idx_orders_created_by on public.orders (created_by);
create index idx_orders_order_number on public.orders (order_number);

-- Orders trigger
create trigger update_orders_updated_at
  before update on public.orders
  for each row
  execute function update_updated_at_column();

-- 5. Order Items table
drop table if exists public.order_items cascade;
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  platform_id uuid references public.game_coins(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_price decimal(10,2) not null,
  total_price decimal(10,2) not null,
  created_at timestamptz default now()
);

-- Order items indexes
create index idx_order_items_order_id on public.order_items (order_id);
create index idx_order_items_platform_id on public.order_items (platform_id);

-- 6. Payment Details table
drop table if exists public.payment_details cascade;
create table public.payment_details (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  payment_method text not null check (payment_method in ('Crypto', 'Bank Transfer', 'Cash')),
  transaction_id text,
  amount decimal(10,2) not null,
  currency text default 'USD',
  
  -- Common fields for all payment methods
  notes text,
  
  -- Crypto payment specific fields
  crypto_currency text, -- USDT, BTC, etc.
  crypto_network text, -- TRC20, BEP20, Bitcoin
  crypto_username text,
  crypto_pay_id text,
  crypto_wallet_address text,
  crypto_transaction_hash text,
  
  -- Bank transfer specific fields
  bank_transaction_reference text,
  bank_sender_name text,
  bank_sender_bank text,
  bank_transaction_time timestamptz,
  bank_exchange_rate decimal(10,4),
  bank_amount_in_currency decimal(10,2),
  bank_purpose text,
  bank_transaction_type text,
  
  -- Cash payment specific fields
  cash_received_by text,
  cash_receipt_number text,
  
  -- Additional JSON data for any other payment details
  payment_data jsonb,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Payment details indexes
create index idx_payment_details_order_id on public.payment_details (order_id);
create index idx_payment_details_payment_method on public.payment_details (payment_method);
create index idx_payment_details_transaction_id on public.payment_details (transaction_id);
create index idx_payment_details_crypto_currency on public.payment_details (crypto_currency);
create index idx_payment_details_crypto_transaction_hash on public.payment_details (crypto_transaction_hash);
create index idx_payment_details_bank_transaction_reference on public.payment_details (bank_transaction_reference);
create index idx_payment_details_bank_purpose on public.payment_details (bank_purpose);
create index idx_payment_details_bank_transaction_type on public.payment_details (bank_transaction_type);

-- Payment details trigger
create trigger update_payment_details_updated_at
  before update on public.payment_details
  for each row
  execute function update_updated_at_column();

-- 7. Purchase History table
drop table if exists public.purchase_history cascade;
create table public.purchase_history (
  id uuid primary key default gen_random_uuid(),
  platform_id uuid references public.game_coins(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  cost_per_unit decimal(10,2) not null,
  total_cost decimal(10,2) not null,
  supplier text,
  notes text,
  previous_inventory integer not null default 0,
  new_inventory integer not null default 0,
  purchased_by uuid references public.users(id),
  created_at timestamptz default now()
);

-- Purchase history indexes
create index idx_purchase_history_platform_id on public.purchase_history (platform_id);
create index idx_purchase_history_created_at on public.purchase_history (created_at);
create index idx_purchase_history_purchased_by on public.purchase_history (purchased_by);

-- 8. Refunds and Replacements table
drop table if exists public.refunds_replacements cascade;
create table public.refunds_replacements (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  type text not null check (type in ('refund', 'replacement')),
  reason text not null,
  amount decimal(10,2), -- refund amount (null for replacements)
  replacement_order_id uuid references public.orders(id), -- new order id for replacements
  status text not null default 'pending' check (status in ('pending', 'approved', 'completed', 'rejected')),
  notes text,
  created_by uuid references public.users(id),
  processed_by uuid references public.users(id),
  created_at timestamptz default now(),
  processed_at timestamptz
);

-- Refunds and replacements indexes
create index idx_refunds_replacements_order_id on public.refunds_replacements (order_id);
create index idx_refunds_replacements_type on public.refunds_replacements (type);
create index idx_refunds_replacements_status on public.refunds_replacements (status);
create index idx_refunds_replacements_created_at on public.refunds_replacements (created_at);

-- Enable Row Level Security on all tables
alter table public.users enable row level security;
alter table public.game_coins enable row level security;
alter table public.customers enable row level security;
alter table public.customer_pricing enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payment_details enable row level security;
alter table public.purchase_history enable row level security;
alter table public.refunds_replacements enable row level security;

-- Create policies (allowing all operations for now - you can tighten these later)
-- Users policies
drop policy if exists "users_select_all" on public.users;
drop policy if exists "users_insert_all" on public.users;
drop policy if exists "users_update_all" on public.users;
drop policy if exists "users_delete_all" on public.users;

create policy "users_select_all" on public.users for select using (true);
create policy "users_insert_all" on public.users for insert with check (true);
create policy "users_update_all" on public.users for update using (true);

-- Game coins policies
drop policy if exists "game_coins_select_all" on public.game_coins;
drop policy if exists "game_coins_insert_all" on public.game_coins;
drop policy if exists "game_coins_update_all" on public.game_coins;
drop policy if exists "game_coins_delete_all" on public.game_coins;

create policy "game_coins_select_all" on public.game_coins for select using (deleted_at is null);
create policy "game_coins_select_deleted" on public.game_coins for select using (deleted_at is not null);
create policy "game_coins_insert_all" on public.game_coins for insert with check (true);
create policy "game_coins_update_all" on public.game_coins for update using (true);
create policy "game_coins_update_soft_delete" on public.game_coins for update using (true) with check (true);
create policy "game_coins_delete_all" on public.game_coins for delete using (true);

-- Customers policies
drop policy if exists "customers_select_all" on public.customers;
drop policy if exists "customers_insert_all" on public.customers;
drop policy if exists "customers_update_all" on public.customers;
drop policy if exists "customers_delete_all" on public.customers;

create policy "customers_select_all" on public.customers for select using (true);
create policy "customers_insert_all" on public.customers for insert with check (true);
create policy "customers_update_all" on public.customers for update using (true);
create policy "customers_delete_all" on public.customers for delete using (true);

-- Customer pricing policies
drop policy if exists "customer_pricing_select_all" on public.customer_pricing;
drop policy if exists "customer_pricing_insert_all" on public.customer_pricing;
drop policy if exists "customer_pricing_update_all" on public.customer_pricing;
drop policy if exists "customer_pricing_delete_all" on public.customer_pricing;

create policy "customer_pricing_select_all" on public.customer_pricing for select using (true);
create policy "customer_pricing_insert_all" on public.customer_pricing for insert with check (true);
create policy "customer_pricing_update_all" on public.customer_pricing for update using (true);
create policy "customer_pricing_delete_all" on public.customer_pricing for delete using (true);

-- Orders policies
drop policy if exists "orders_select_all" on public.orders;
drop policy if exists "orders_insert_all" on public.orders;
drop policy if exists "orders_update_all" on public.orders;
drop policy if exists "orders_delete_all" on public.orders;

create policy "orders_select_all" on public.orders for select using (true);
create policy "orders_insert_all" on public.orders for insert with check (true);
create policy "orders_update_all" on public.orders for update using (true);
create policy "orders_delete_all" on public.orders for delete using (true);

-- Order items policies
drop policy if exists "order_items_select_all" on public.order_items;
drop policy if exists "order_items_insert_all" on public.order_items;
drop policy if exists "order_items_update_all" on public.order_items;
drop policy if exists "order_items_delete_all" on public.order_items;

create policy "order_items_select_all" on public.order_items for select using (true);
create policy "order_items_insert_all" on public.order_items for insert with check (true);
create policy "order_items_update_all" on public.order_items for update using (true);
create policy "order_items_delete_all" on public.order_items for delete using (true);

-- Payment details policies
drop policy if exists "payment_details_select_all" on public.payment_details;
drop policy if exists "payment_details_insert_all" on public.payment_details;
drop policy if exists "payment_details_update_all" on public.payment_details;
drop policy if exists "payment_details_delete_all" on public.payment_details;

create policy "payment_details_select_all" on public.payment_details for select using (true);
create policy "payment_details_insert_all" on public.payment_details for insert with check (true);
create policy "payment_details_update_all" on public.payment_details for update using (true);
create policy "payment_details_delete_all" on public.payment_details for delete using (true);

-- Purchase history policies
drop policy if exists "purchase_history_select_all" on public.purchase_history;
drop policy if exists "purchase_history_insert_all" on public.purchase_history;
drop policy if exists "purchase_history_update_all" on public.purchase_history;
drop policy if exists "purchase_history_delete_all" on public.purchase_history;

create policy "purchase_history_select_all" on public.purchase_history for select using (true);
create policy "purchase_history_insert_all" on public.purchase_history for insert with check (true);
create policy "purchase_history_update_all" on public.purchase_history for update using (true);
create policy "purchase_history_delete_all" on public.purchase_history for delete using (true);

-- Refunds and replacements policies
drop policy if exists "refunds_replacements_select_all" on public.refunds_replacements;
drop policy if exists "refunds_replacements_insert_all" on public.refunds_replacements;
drop policy if exists "refunds_replacements_update_all" on public.refunds_replacements;
drop policy if exists "refunds_replacements_delete_all" on public.refunds_replacements;

create policy "refunds_replacements_select_all" on public.refunds_replacements for select using (true);
create policy "refunds_replacements_insert_all" on public.refunds_replacements for insert with check (true);
create policy "refunds_replacements_update_all" on public.refunds_replacements for update using (true);
create policy "refunds_replacements_delete_all" on public.refunds_replacements for delete using (true);

-- Insert default data
-- Default superadmin user
insert into public.users (username, password, role)
select 'superadmin','admin123','SuperAdmin'
where not exists (select 1 from public.users where username = 'superadmin');

-- Sample platforms
insert into public.game_coins (platform, account_type, inventory, cost_price, low_stock_alert) values
('PlayStation', 'Premium', 150, 99.99, 20),
('Xbox', 'Standard', 75, 89.99, 15),
('Nintendo Switch', 'Premium', 200, 79.99, 25),
('Steam', 'Digital', 50, 69.99, 10),
('Epic Games', 'Standard', 120, 59.99, 12)
on conflict do nothing;

-- Sample customers (insert only if table is empty)
insert into public.customers (name, contact_numbers) 
select 'John Doe', ARRAY['555-0101', '555-0201']
where not exists (select 1 from public.customers where name = 'John Doe');

insert into public.customers (name, contact_numbers) 
select 'Jane Smith', ARRAY['555-0102', '555-0302']
where not exists (select 1 from public.customers where name = 'Jane Smith');

insert into public.customers (name, contact_numbers)
select 'Mike Johnson', ARRAY['555-0103']
where not exists (select 1 from public.customers where name = 'Mike Johnson');

-- Add created_by column to orders table if it doesn't exist (for existing databases)
alter table public.orders add column if not exists created_by uuid references public.users(id);
-- Set default value for existing records (use superadmin if exists, otherwise first admin)
update public.orders set created_by = (
  select id from public.users where role = 'SuperAdmin' limit 1
) where created_by is null;
-- Make created_by NOT NULL for new records
alter table public.orders alter column created_by set not null;
create index if not exists idx_orders_created_by on public.orders (created_by);
