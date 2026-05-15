-- Migration 028: Kroger cart filling support
--
-- 1. upc column on purchase_schedules — needed to call Kroger Cart API.
--    Populated by the browser extension when a product is added from a Kroger
--    product page (extracted from the URL slug).
--
-- 2. notes column on order_confirmations — stores cart fill outcome:
--    'Cart filled — user notified to checkout' or 'Cart fill failed: <reason>'.

ALTER TABLE public.purchase_schedules
  ADD COLUMN IF NOT EXISTS upc text;

ALTER TABLE public.order_confirmations
  ADD COLUMN IF NOT EXISTS notes text;
