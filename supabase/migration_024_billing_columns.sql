-- Migration 024: Billing state columns and suspension flags

-- User-level billing state
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS stripe_customer_id         text,
  ADD COLUMN IF NOT EXISTS payment_failed_at          timestamptz,
  ADD COLUMN IF NOT EXISTS previous_plan_tier         text,
  ADD COLUMN IF NOT EXISTS payment_failure_notified_at timestamptz;

-- Suspension flags — never delete data, just pause it
ALTER TABLE public.retailers
  ADD COLUMN IF NOT EXISTS is_suspended boolean NOT NULL DEFAULT false;

ALTER TABLE public.purchase_schedules
  ADD COLUMN IF NOT EXISTS is_suspended boolean NOT NULL DEFAULT false;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_suspended boolean NOT NULL DEFAULT false;
