-- =============================================================================
-- Affiliate Settings Table
-- Run in: Supabase Dashboard → SQL Editor
-- =============================================================================

CREATE TABLE IF NOT EXISTS affiliate_settings (
  platform      TEXT        PRIMARY KEY,  -- 'amazon' | 'flipkart' | 'meesho' | 'myntra'
  affiliate_tag TEXT        NOT NULL DEFAULT '',
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  updated_at    TIMESTAMPTZ          DEFAULT NOW()
);

ALTER TABLE affiliate_settings ENABLE ROW LEVEL SECURITY;

-- App can read settings without auth (needed for auto-generation at submission time)
CREATE POLICY "Public can read affiliate settings"
  ON affiliate_settings FOR SELECT
  TO public
  USING (true);

-- Only admins can write
CREATE POLICY "Admins can manage affiliate settings"
  ON affiliate_settings FOR ALL
  TO authenticated
  USING  (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Seed one row per platform so the admin UI always has something to edit
INSERT INTO affiliate_settings (platform, affiliate_tag) VALUES
  ('amazon',   ''),
  ('flipkart', ''),
  ('meesho',   ''),
  ('myntra',   '')
ON CONFLICT (platform) DO NOTHING;
