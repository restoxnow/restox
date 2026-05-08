-- Migration 008: products, retailers, and purchase_schedules tables

-- Retailers (connected stores per user)
create table if not exists public.retailers (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  name             text not null,
  connection_type  text not null default 'credentials',
  connection_status text not null default 'connected',
  created_at       timestamptz not null default now()
);
alter table public.retailers enable row level security;
create policy "Users manage own retailers"
  on public.retailers for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Products
create table if not exists public.products (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  name             text not null,
  retailer_id      uuid references public.retailers(id) on delete set null,
  category         text,
  reorder_quantity int not null default 1,
  product_url      text,
  created_at       timestamptz not null default now()
);
alter table public.products enable row level security;
create policy "Users manage own products"
  on public.products for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Purchase schedules
create table if not exists public.purchase_schedules (
  id                    uuid primary key default gen_random_uuid(),
  product_id            uuid not null references public.products(id) on delete cascade,
  user_id               uuid not null references auth.users(id) on delete cascade,
  frequency             text not null,
  status                text not null default 'active',
  ai_managed            boolean not null default false,
  notification_timing   text not null default '24hr',
  confirmation_required boolean not null default false,
  notification_channel  text not null default 'email',
  created_at            timestamptz not null default now()
);
alter table public.purchase_schedules enable row level security;
create policy "Users manage own schedules"
  on public.purchase_schedules for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
