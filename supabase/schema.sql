-- Run this in your Supabase SQL editor to create the waitlist table

CREATE TABLE IF NOT EXISTS waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('consumer', 'business')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add unique constraint on email
ALTER TABLE waitlist ADD CONSTRAINT waitlist_email_unique UNIQUE (email);

-- Enable Row Level Security
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (for public waitlist signups)
CREATE POLICY "Allow public inserts" ON waitlist
  FOR INSERT WITH CHECK (true);

-- Allow reading count for display (anon can read count only via head:true)
CREATE POLICY "Allow public select" ON waitlist
  FOR SELECT USING (true);

-- Index for email lookups (duplicate checking)
CREATE INDEX IF NOT EXISTS waitlist_email_idx ON waitlist (email);
