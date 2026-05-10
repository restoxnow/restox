-- Migration 021: Consolidate plan/plan_tier columns — single source of truth

-- ── Step 1: Copy plan → plan_tier for out-of-sync users ──────────────────────
-- Where plan_tier is still 'free' but plan has a real tier value, promote plan_tier.
-- Normalize case: 'Pro' → 'pro', 'Consumer' → 'consumer', etc.
UPDATE public.users
SET plan_tier = LOWER(plan)
WHERE
  plan_tier = 'free'
  AND plan IS NOT NULL
  AND LOWER(plan) IN ('consumer', 'professional', 'business', 'pro');

-- Map legacy 'pro' to 'professional' if it appears
UPDATE public.users
SET plan_tier = 'professional'
WHERE plan_tier = 'pro';

-- ── Step 2: Verify — no mismatches should remain ──────────────────────────────
-- This will return rows only if there are still inconsistencies.
-- (Run SELECT manually after migration to validate.)
-- SELECT id, plan, plan_tier
-- FROM public.users
-- WHERE plan IS NOT NULL
--   AND LOWER(plan) != plan_tier
--   AND LOWER(plan) IN ('consumer', 'professional', 'business', 'pro', 'free');

-- ── Step 3: plan column will be dropped in migration_022 ─────────────────────
-- Intentionally leaving plan column in place until all code references are removed.
