-- Seasonal demand forecast for each schedule (12 months of relative demand 0.0–1.0)
ALTER TABLE purchase_schedules ADD COLUMN IF NOT EXISTS monthly_forecast JSONB;
