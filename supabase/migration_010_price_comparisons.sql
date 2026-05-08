CREATE TABLE IF NOT EXISTS public.price_comparisons (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  retailer_id uuid REFERENCES public.retailers(id) ON DELETE SET NULL,
  retailer_name text NOT NULL,
  price numeric(10,2) NOT NULL,
  checked_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.price_comparisons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own price comparisons"
  ON public.price_comparisons FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own price comparisons"
  ON public.price_comparisons FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own price comparisons"
  ON public.price_comparisons FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS price_comparisons_product_id_idx
  ON public.price_comparisons(product_id);
