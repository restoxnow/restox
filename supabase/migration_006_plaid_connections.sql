-- Migration 006: plaid_connections table

create table if not exists public.plaid_connections (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  access_token     text not null,        -- AES-256-CBC encrypted
  item_id          text not null unique,  -- Plaid item ID (used for upsert)
  institution_name text,
  created_at       timestamptz not null default now()
);

alter table public.plaid_connections enable row level security;

create policy "Users can manage their own plaid connections"
  on public.plaid_connections
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
