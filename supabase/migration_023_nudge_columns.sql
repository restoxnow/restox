-- Migration 023: Add weekly upgrade nudge tracking columns to public.users

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS dismissed_nudge_at       timestamptz,
  ADD COLUMN IF NOT EXISTS nudge_email_unsubscribed boolean NOT NULL DEFAULT false;
