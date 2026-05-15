-- Migration 029: ASIN column for purchase_schedules
--
-- Stores the Amazon Standard Identification Number (ASIN) extracted from the
-- product page URL when a user adds an Amazon product via the Restox extension.
-- Used to build Add-to-Cart deep links in order confirmation emails.

ALTER TABLE public.purchase_schedules
  ADD COLUMN IF NOT EXISTS asin text;
