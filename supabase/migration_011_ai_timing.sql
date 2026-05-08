CREATE TABLE IF NOT EXISTS public.ai_timing (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  predicted_runout_days integer,
  confidence text CHECK (confidence IN ('low', 'medium', 'high')) DEFAULT 'medium',
  seasonal_factor boolean NOT NULL DEFAULT false,
  seasonal_reasoning text,
  recommended_frequency text,
  adjustment_reason text,
  predicted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id, user_id)
);

ALTER TABLE public.ai_timing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own ai timing"
  ON public.ai_timing FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own ai timing"
  ON public.ai_timing FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own ai timing"
  ON public.ai_timing FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own ai timing"
  ON public.ai_timing FOR DELETE
  USING (auth.uid() = user_id);
