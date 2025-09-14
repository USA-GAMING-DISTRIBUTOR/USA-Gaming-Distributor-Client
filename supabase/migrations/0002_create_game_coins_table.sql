-- Migration: 0002_create_game_coins_table
-- Description: Create game_coins table for platform management

create table if not exists public.game_coins (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  account_type text not null default 'Standard',
  inventory integer not null default 0,
  cost_price decimal(10,2) not null default 0.00,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes (create after table)
create index if not exists idx_game_coins_platform on public.game_coins (platform);
create index if not exists idx_game_coins_account_type on public.game_coins (account_type);
create index if not exists idx_game_coins_inventory on public.game_coins (inventory);

-- Update trigger function (reuse existing or create if not exists)
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger
drop trigger if exists update_game_coins_updated_at on public.game_coins;
create trigger update_game_coins_updated_at
  before update on public.game_coins
  for each row
  execute function update_updated_at_column();

-- Row Level Security
alter table public.game_coins enable row level security;

-- Policies (allow all operations for authenticated users)
drop policy if exists "game_coins_select_all" on public.game_coins;
drop policy if exists "game_coins_insert_all" on public.game_coins;
drop policy if exists "game_coins_update_all" on public.game_coins;
drop policy if exists "game_coins_delete_all" on public.game_coins;

create policy "game_coins_select_all" on public.game_coins for select using (true);
create policy "game_coins_insert_all" on public.game_coins for insert with check (true);
create policy "game_coins_update_all" on public.game_coins for update using (true);
create policy "game_coins_delete_all" on public.game_coins for delete using (true);
