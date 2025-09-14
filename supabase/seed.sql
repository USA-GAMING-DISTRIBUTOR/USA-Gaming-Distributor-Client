-- Seed data: insert a default superadmin if none exists
insert into public.users (username, password, role)
select 'superadmin','admin123','SuperAdmin'
where not exists (select 1 from public.users where username = 'superadmin');

-- Seed data for game_coins (platforms)
insert into public.game_coins (platform, account_type, inventory, cost_price) values
('PlayStation', 'Premium', 150, 99.99),
('Xbox', 'Standard', 75, 89.99),
('Nintendo Switch', 'Premium', 200, 79.99),
('Steam', 'Digital', 50, 69.99),
('Epic Games', 'Standard', 120, 59.99)
on conflict do nothing;

-- Seed data for customers
insert into public.customers (first_name, last_name, email, phone, address, city, state, zip_code) values
('John', 'Doe', 'john.doe@example.com', '555-0101', '123 Main St', 'New York', 'NY', '10001'),
('Jane', 'Smith', 'jane.smith@example.com', '555-0102', '456 Oak Ave', 'Los Angeles', 'CA', '90210'),
('Mike', 'Johnson', 'mike.johnson@example.com', '555-0103', '789 Pine Rd', 'Chicago', 'IL', '60601')
on conflict (email) do nothing;
