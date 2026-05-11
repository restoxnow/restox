-- Migration 027: Add onboarding and extension nudge dismissal timestamps
alter table public.users
  add column if not exists onboarding_dismissed_at      timestamptz,
  add column if not exists extension_nudge_dismissed_at timestamptz;
