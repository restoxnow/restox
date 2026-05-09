-- Migration 013: OAuth token storage for retailer connections
-- Adds encrypted token columns and ensures the upsert constraint exists.

ALTER TABLE public.retailers
  ADD COLUMN IF NOT EXISTS access_token     TEXT,
  ADD COLUMN IF NOT EXISTS refresh_token    TEXT,
  ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS oauth_scope      TEXT;

-- Unique constraint required for ON CONFLICT upserts.
-- DO block swallows the error if the constraint already exists.
DO $$ BEGIN
  ALTER TABLE public.retailers
    ADD CONSTRAINT retailers_user_id_name_key UNIQUE (user_id, name);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
