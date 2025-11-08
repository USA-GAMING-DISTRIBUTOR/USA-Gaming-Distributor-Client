-- Create customer_usernames table to store multiple usernames per customer per platform
drop table if exists public.customer_usernames cascade;
create table public.customer_usernames (
    id uuid primary key default gen_random_uuid(),
    customer_id uuid references public.customers(id) on delete cascade not null,
    platform_id uuid references public.game_coins(id) on delete cascade not null,
    username text not null,
    notes text,
    is_active boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
-- Indexes for better query performance
create index idx_customer_usernames_customer_id on public.customer_usernames (customer_id);
create index idx_customer_usernames_platform_id on public.customer_usernames (platform_id);
create index idx_customer_usernames_is_active on public.customer_usernames (is_active);
-- Trigger to update updated_at timestamp
create trigger update_customer_usernames_updated_at before
update on public.customer_usernames for each row execute function update_updated_at_column();
-- Enable Row Level Security
alter table public.customer_usernames enable row level security;
-- Create policies (allowing all operations)
create policy "customer_usernames_select_all" on public.customer_usernames for
select using (true);
create policy "customer_usernames_insert_all" on public.customer_usernames for
insert with check (true);
create policy "customer_usernames_update_all" on public.customer_usernames for
update using (true);
create policy "customer_usernames_delete_all" on public.customer_usernames for delete using (true);