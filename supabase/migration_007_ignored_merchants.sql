-- Migration 007: ignored_merchants column on public.users

alter table public.users
  add column if not exists ignored_merchants jsonb not null default '[]'::jsonb;
