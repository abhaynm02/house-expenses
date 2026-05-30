-- ============================================================
-- House Expenses — Full Supabase SQL Setup
-- Run this in: Supabase dashboard → SQL Editor → New query
-- ============================================================

-- 1. Members table
create table if not exists members (
  id         uuid    default gen_random_uuid() primary key,
  name       text    not null unique,
  email      text    not null unique,
  is_admin   boolean default false,
  created_at timestamptz default now()
);

-- 2. Expenses table
create table if not exists expenses (
  id         uuid    default gen_random_uuid() primary key,
  paid_by    text    not null,
  amount     numeric not null check (amount > 0),
  category   text    not null,
  date       date    not null,
  note       text    default '',
  split      text[]  not null,
  is_settled boolean default false,
  settled_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- 3. Row Level Security
alter table members  enable row level security;
alter table expenses enable row level security;

-- Members: all authenticated users can read
create policy "members_select" on members
  for select using (auth.role() = 'authenticated');

-- Members: only admin can insert/delete
create policy "members_insert_admin" on members
  for insert with check (
    exists (
      select 1 from members
      where email = (select email from auth.users where id = auth.uid())
      and is_admin = true
    )
  );

create policy "members_delete_admin" on members
  for delete using (
    exists (
      select 1 from members
      where email = (select email from auth.users where id = auth.uid())
      and is_admin = true
    )
  );

-- Expenses: all authenticated users can read and insert
create policy "expenses_select" on expenses
  for select using (auth.role() = 'authenticated');

create policy "expenses_insert" on expenses
  for insert with check (auth.role() = 'authenticated');

-- Expenses: only admin can delete
create policy "expenses_delete_admin" on expenses
  for delete using (
    exists (
      select 1 from members
      where email = (select email from auth.users where id = auth.uid())
      and is_admin = true
    )
  );

-- Expenses: only admin can update (mark as settled)
create policy "expenses_update_admin" on expenses
  for update using (
    exists (
      select 1 from members
      where email = (select email from auth.users where id = auth.uid())
      and is_admin = true
    )
  );

-- 4. Seed your housemates
-- IMPORTANT: Change these emails to your actual housemates' emails!
-- The first person (is_admin=true) is the only one who can delete expenses and add/remove members.
-- After inserting here, invite each person via: Supabase → Authentication → Users → Invite user

insert into members (name, email, is_admin) values
  ('Arun',  'arun@gmail.com',  true),   -- ADMIN: can delete, add/remove members
  ('Priya', 'priya@gmail.com', false),
  ('Rahul', 'rahul@gmail.com', false),
  ('Nisha', 'nisha@gmail.com', false)
on conflict (email) do nothing;

-- ============================================================
-- After running this:
-- 1. Go to Supabase → Authentication → Settings
--    • Disable "Enable email confirmations" (simpler for housemates)
--    • Set Site URL to your Vercel URL
-- 2. Go to Authentication → Users → Invite user
--    Invite each housemate's email one by one
-- 3. Enable Realtime on the expenses table:
--    Supabase → Database → Replication → enable for 'expenses' and 'members'
-- ============================================================
