-- Migration 022: Drop legacy plan column — plan_tier is now the single source of truth

ALTER TABLE public.users DROP COLUMN IF EXISTS plan;
