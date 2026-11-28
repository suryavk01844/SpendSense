-- SpendSense schema. Run in Supabase SQL editor or via `supabase db push`.
create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text check (char_length(full_name) <= 100),
  email text,
  currency text not null default 'INR',
  starting_balance numeric(12,2) not null default 0 check (starting_balance >= 0),
  created_at timestamptz not null default now()
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  amount numeric(12,2) not null check (amount > 0),
  type text not null default 'expense' check (type in ('expense','income')),
  category text not null default 'Other' check (category in
    ('Food','Travel','Shopping','Education','Entertainment','Health','Subscriptions','Personal care','Other')),
  transaction_date date not null default current_date,
  payment_method text not null default 'Other' check (payment_method in
    ('UPI','Cash','Debit card','Credit card','Other')),
  notes text check (char_length(notes) <= 500),
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);
create index transactions_user_date_idx on public.transactions (user_id, transaction_date desc);
create index transactions_user_cat_idx on public.transactions (user_id, category);

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  category text,  -- null = overall budget
  amount numeric(12,2) not null check (amount > 0),
  period text not null check (period in ('weekly','monthly','custom')),
  start_date date not null,
  end_date date not null,
  check (end_date >= start_date)
);
create index budgets_user_idx on public.budgets (user_id, start_date);

create table public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  target_amount numeric(12,2) not null check (target_amount > 0),
  current_amount numeric(12,2) not null default 0 check (current_amount >= 0),
  target_date date,
  created_at timestamptz not null default now()
);
create index goals_user_idx on public.savings_goals (user_id);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  type text not null default 'info',
  title text not null check (char_length(title) <= 120),
  message text not null check (char_length(message) <= 500),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, is_read, created_at desc);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(name) <= 80),
  amount numeric(12,2) not null check (amount > 0),
  billing_cycle text not null check (billing_cycle in ('weekly','monthly','yearly')),
  next_payment_date date not null
);
create index subscriptions_user_idx on public.subscriptions (user_id, next_payment_date);

-- Row Level Security: users can only touch their own rows.
alter table public.profiles enable row level security;
create policy "profile select" on public.profiles for select using (id = auth.uid());
create policy "profile update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

do $$
declare t text;
begin
  foreach t in array array['transactions','budgets','savings_goals','notifications','subscriptions'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "own select" on public.%I for select using (user_id = auth.uid())', t);
    execute format('create policy "own insert" on public.%I for insert with check (user_id = auth.uid())', t);
    execute format('create policy "own update" on public.%I for update using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
    execute format('create policy "own delete" on public.%I for delete using (user_id = auth.uid())', t);
  end loop;
end $$;

-- Auto-create profile on signup.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
