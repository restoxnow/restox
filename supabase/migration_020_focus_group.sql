-- Migration 020: Focus group access codes and 2-month Pro access

-- ── users: add focus group expiry tracking ────────────────────────────────────
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS focus_group_access_expires_at timestamptz;

-- ── access_codes ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.access_codes (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code                  text NOT NULL UNIQUE,
  notes                 text,
  duration_months       int NOT NULL DEFAULT 2,
  created_by            uuid NOT NULL REFERENCES auth.users(id),
  redeemed_by           uuid REFERENCES auth.users(id),
  redeemed_at           timestamptz,
  access_expires_at     timestamptz,
  revoked_at            timestamptz,
  revoked_by            uuid REFERENCES auth.users(id),
  created_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.access_codes ENABLE ROW LEVEL SECURITY;

-- Users can see their own redeemed codes
CREATE POLICY "Users select own redeemed codes"
  ON public.access_codes FOR SELECT
  USING (auth.uid() = redeemed_by);

-- Admin sees all (uses service role / admin API routes — no RLS policy needed for service key)
-- But for completeness, allow admin via user metadata
CREATE POLICY "Admins select all codes"
  ON public.access_codes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins insert codes"
  ON public.access_codes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins update codes"
  ON public.access_codes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE INDEX IF NOT EXISTS access_codes_code_idx ON public.access_codes(code);
CREATE INDEX IF NOT EXISTS access_codes_redeemed_by_idx ON public.access_codes(redeemed_by);
CREATE INDEX IF NOT EXISTS access_codes_access_expires_at_idx ON public.access_codes(access_expires_at)
  WHERE access_expires_at IS NOT NULL;
