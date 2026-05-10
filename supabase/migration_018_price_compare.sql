-- Migration 018: Enhance price_comparisons for immediate fetch and schedule-based tracking

-- Make product_id nullable so new rows can reference schedule_id directly
-- (existing rows keep their product_id; new rows from the fetch route use schedule_id)
ALTER TABLE public.price_comparisons
  ALTER COLUMN product_id DROP NOT NULL;

-- Link price comparisons to purchase schedules (new primary reference)
ALTER TABLE public.price_comparisons
  ADD COLUMN IF NOT EXISTS schedule_id uuid REFERENCES public.purchase_schedules(id) ON DELETE CASCADE;

-- Flag scraped/estimated prices vs confirmed live API prices
ALTER TABLE public.price_comparisons
  ADD COLUMN IF NOT EXISTS is_estimated boolean NOT NULL DEFAULT false;

-- When the price was last fetched (separate from checked_at for UI display)
ALTER TABLE public.price_comparisons
  ADD COLUMN IF NOT EXISTS fetched_at timestamptz;

-- Backfill fetched_at from checked_at for existing rows
UPDATE public.price_comparisons
  SET fetched_at = checked_at
  WHERE fetched_at IS NULL;

-- Index for schedule-based lookups
CREATE INDEX IF NOT EXISTS price_comparisons_schedule_id_idx
  ON public.price_comparisons(schedule_id);

-- Add UPDATE policy (admin client uses service role which bypasses RLS,
-- but add for completeness and future use)
DO $$ BEGIN
  CREATE POLICY "Users update own price comparisons"
    ON public.price_comparisons FOR UPDATE
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
