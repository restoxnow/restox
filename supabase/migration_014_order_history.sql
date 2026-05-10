-- Order history table for storing fetched purchase records from OAuth-connected retailers
CREATE TABLE IF NOT EXISTS order_history (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  retailer_name TEXT        NOT NULL,
  order_date    TIMESTAMPTZ NOT NULL,
  items         JSONB       NOT NULL DEFAULT '[]',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS order_history_user_id_idx      ON order_history(user_id);
CREATE INDEX IF NOT EXISTS order_history_user_retailer_idx ON order_history(user_id, retailer_name);
CREATE INDEX IF NOT EXISTS order_history_order_date_idx    ON order_history(user_id, order_date DESC);

-- Track when we last synced history for each retailer connection
ALTER TABLE retailers ADD COLUMN IF NOT EXISTS last_history_sync TIMESTAMPTZ;

-- RLS
ALTER TABLE order_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own order history"
  ON order_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can write order history"
  ON order_history FOR ALL
  USING (true)
  WITH CHECK (true);
