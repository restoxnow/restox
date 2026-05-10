-- migration_017: subscription detection columns

ALTER TABLE purchase_schedules
  ADD COLUMN IF NOT EXISTS subscription_detected    boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS subscription_confidence  text,
  ADD COLUMN IF NOT EXISTS subscription_interval_days int,
  ADD COLUMN IF NOT EXISTS monitor_only             boolean DEFAULT false;

-- New columns inherit the existing RLS policies on purchase_schedules.
-- No additional policies needed.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS subscription_prompt_dismissed jsonb DEFAULT '{}';
