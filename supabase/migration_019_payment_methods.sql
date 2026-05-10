-- Migration 019: Payment method selection and pre-order confirmation

-- ── purchase_schedules: add confirmation hours (synced from notification_timing) ──
ALTER TABLE public.purchase_schedules
  ADD COLUMN IF NOT EXISTS pre_order_confirmation_hours int NOT NULL DEFAULT 24;

-- Backfill from existing notification_timing values
UPDATE public.purchase_schedules SET pre_order_confirmation_hours =
  CASE notification_timing
    WHEN '6hr'  THEN 6
    WHEN '12hr' THEN 12
    WHEN '24hr' THEN 24
    WHEN '48hr' THEN 48
    ELSE 24
  END;

-- ── retailer_payment_methods ──────────────────────────────────────────────────
-- Stores non-sensitive identifiers only — last4, brand, expiry, retailer token ID.
-- NEVER stores full card numbers, CVVs, or bank account details.
CREATE TABLE IF NOT EXISTS public.retailer_payment_methods (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  retailer_name          text NOT NULL,
  payment_method_id      text NOT NULL, -- retailer's own identifier, never a raw card number
  last4                  text,
  brand                  text,
  expiry_month           int,
  expiry_year            int,
  is_default             boolean NOT NULL DEFAULT false,
  selected_for_auto_order boolean NOT NULL DEFAULT false,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.retailer_payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own payment methods"
  ON public.retailer_payment_methods FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own payment methods"
  ON public.retailer_payment_methods FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own payment methods"
  ON public.retailer_payment_methods FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own payment methods"
  ON public.retailer_payment_methods FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS retailer_payment_methods_user_retailer_idx
  ON public.retailer_payment_methods(user_id, retailer_name);

-- ── order_confirmations ───────────────────────────────────────────────────────
-- Tracks pre-order confirmation state for each scheduled order.
-- n8n creates 'pending' records X hours before order date; user confirms or skips.
CREATE TABLE IF NOT EXISTS public.order_confirmations (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id          uuid NOT NULL REFERENCES public.purchase_schedules(id) ON DELETE CASCADE,
  user_id              uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status               text NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending', 'confirmed', 'skipped', 'expired')),
  payment_method_id    text,
  scheduled_order_date date NOT NULL,
  confirmed_at         timestamptz,
  skipped_at           timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.order_confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own order confirmations"
  ON public.order_confirmations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own order confirmations"
  ON public.order_confirmations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own order confirmations"
  ON public.order_confirmations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS order_confirmations_schedule_id_idx
  ON public.order_confirmations(schedule_id);

CREATE INDEX IF NOT EXISTS order_confirmations_user_status_idx
  ON public.order_confirmations(user_id, status);
