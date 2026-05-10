-- Migration 021: Consolidate plan/plan_tier columns — reset all users to 'free'
--
-- The plan column contained stale incorrect data and was never the source of truth.
-- plan_tier is the authoritative column. All users are on the Free tier (no paid subscribers).
-- This migration resets any drifted plan_tier values back to 'free' and prepares for
-- the plan column drop in migration_022.

UPDATE public.users
SET plan_tier = 'free'
WHERE plan_tier != 'free';
