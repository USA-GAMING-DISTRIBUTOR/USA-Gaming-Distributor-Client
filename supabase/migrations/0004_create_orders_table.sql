-- Migration: 0004_create_orders_table
-- Description: Create orders table and related tables for order management

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete cascade,
  order_number text unique not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'verified', 'completed', 'cancelled')),
  total_amount decimal(10,2) not null default 0.00,
  payment_method text,
  payment_status text default 'pending' check (payment_status in ('pending', 'completed', 'failed', 'refunded')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  verified_at timestamptz,
  verified_by uuid references public.users(id)
);

-- Order items table
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  platform_id uuid references public.game_coins(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_price decimal(10,2) not null,
  total_price decimal(10,2) not null,
  created_at timestamptz default now()
);

-- Payment details table
create table if not exists public.payment_details (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  payment_method text not null,
  transaction_id text,
  amount decimal(10,2) not null,
  currency text default 'USD',
  payment_data jsonb,
  created_at timestamptz default now()
);

-- Indexes for orders
create index if not exists idx_orders_customer_id on public.orders (customer_id);
create index if not exists idx_orders_status on public.orders (status);
create index if not exists idx_orders_payment_status on public.orders (payment_status);
create index if not exists idx_orders_created_at on public.orders (created_at);
create index if not exists idx_orders_order_number on public.orders (order_number);

-- Indexes for order_items
create index if not exists idx_order_items_order_id on public.order_items (order_id);
create index if not exists idx_order_items_platform_id on public.order_items (platform_id);

-- Indexes for payment_details
create index if not exists idx_payment_details_order_id on public.payment_details (order_id);

-- Update triggers
create trigger update_orders_updated_at
  before update on public.orders
  for each row
  execute function update_updated_at_column();

-- Row Level Security
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payment_details enable row level security;

-- Policies for orders
create policy "orders_select_all" on public.orders for select using (true);
create policy "orders_insert_all" on public.orders for insert with check (true);
create policy "orders_update_all" on public.orders for update using (true);
create policy "orders_delete_all" on public.orders for delete using (true);

-- Policies for order_items
create policy "order_items_select_all" on public.order_items for select using (true);
create policy "order_items_insert_all" on public.order_items for insert with check (true);
create policy "order_items_update_all" on public.order_items for update using (true);
create policy "order_items_delete_all" on public.order_items for delete using (true);

-- Policies for payment_details
create policy "payment_details_select_all" on public.payment_details for select using (true);
create policy "payment_details_insert_all" on public.payment_details for insert with check (true);
create policy "payment_details_update_all" on public.payment_details for update using (true);
create policy "payment_details_delete_all" on public.payment_details for delete using (true);
