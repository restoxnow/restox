-- Run this in Supabase SQL Editor: Dashboard → SQL Editor → New query
-- Requires migration_004_users_table.sql to have been run first.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS theme TEXT NOT NULL DEFAULT 'system'
    CHECK (theme IN ('light', 'dark', 'system'));
