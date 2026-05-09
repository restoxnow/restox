-- Add default_frequency preference to users table
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS default_frequency TEXT NOT NULL DEFAULT 'monthly';
