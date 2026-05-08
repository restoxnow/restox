-- Run this in Supabase SQL Editor: Dashboard → SQL Editor → New query

-- 1. Add is_admin to users table
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Create retailer_requests table
CREATE TABLE IF NOT EXISTS public.retailer_requests (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  retailer_name TEXT NOT NULL,
  website_url  TEXT,
  reason       TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.retailer_requests ENABLE ROW LEVEL SECURITY;

-- Users can insert their own requests
CREATE POLICY "Users can insert own retailer requests"
  ON public.retailer_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own requests
CREATE POLICY "Users can read own retailer requests"
  ON public.retailer_requests
  FOR SELECT
  USING (auth.uid() = user_id);
