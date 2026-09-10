-- =============================================================================
-- Admin-controllable configuration tables
-- Run ALL of this in: Supabase Dashboard → SQL Editor
-- =============================================================================

-- ── 1. CATEGORIES ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT        NOT NULL UNIQUE,
  icon_name     TEXT        NOT NULL DEFAULT 'ShoppingBag',
  badge_color   TEXT        NOT NULL DEFAULT '#F3F4F6',
  icon_color    TEXT        NOT NULL DEFAULT '#6B7280',
  display_order INTEGER     NOT NULL DEFAULT 0,
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read categories"    ON categories FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage categories"  ON categories FOR ALL
  USING  (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

INSERT INTO categories (name, icon_name, badge_color, icon_color, display_order) VALUES
  ('Electronics', 'Smartphone',      '#DBEAFE', '#1D4ED8', 1),
  ('Fashion',     'Shirt',           '#FCE7F3', '#DB2777', 2),
  ('Home',        'Home',            '#D1FAE5', '#059669', 3),
  ('Beauty',      'Sparkles',        '#EDE9FE', '#7C3AED', 4),
  ('Sports',      'Dumbbell',        '#FED7AA', '#EA580C', 5),
  ('Books',       'BookOpen',        '#FEF3C7', '#D97706', 6),
  ('Food',        'UtensilsCrossed', '#CCFBF1', '#0D9488', 7),
  ('Travel',      'Plane',           '#E0F2FE', '#0284C7', 8),
  ('Other',       'Package',         '#F3F4F6', '#6B7280', 9)
ON CONFLICT (name) DO NOTHING;


-- ── 2. PLATFORMS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS platforms (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT        NOT NULL UNIQUE,
  brand_color   TEXT        NOT NULL DEFAULT '#374151',
  cashback_text TEXT        NOT NULL DEFAULT 'Cashback',
  shoppers_text TEXT        NOT NULL DEFAULT '1K+ shopped',
  display_order INTEGER     NOT NULL DEFAULT 0,
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE platforms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read platforms"   ON platforms FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage platforms" ON platforms FOR ALL
  USING  (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

INSERT INTO platforms (name, brand_color, cashback_text, shoppers_text, display_order) VALUES
  ('Amazon',   '#F59E0B', 'Up to 8%',  '3.2K+ shopped', 1),
  ('Flipkart', '#3B82F6', 'Up to 6%',  '4.1K+ shopped', 2),
  ('Meesho',   '#A78BFA', 'Up to 10%', '2.7K+ shopped', 3),
  ('Myntra',   '#FB7185', 'Up to 7%',  '1.9K+ shopped', 4)
ON CONFLICT (name) DO NOTHING;


-- ── 3. PREMIUM PLAN CONFIG ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS premium_plan_config (
  id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  price_display TEXT    NOT NULL DEFAULT '₹99',
  price_period  TEXT    NOT NULL DEFAULT '/month',
  benefits      JSONB   NOT NULL DEFAULT '[]',
  is_active     BOOLEAN NOT NULL DEFAULT true
);
ALTER TABLE premium_plan_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read premium config"   ON premium_plan_config FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage premium config" ON premium_plan_config FOR ALL
  USING  (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

INSERT INTO premium_plan_config (price_display, price_period, benefits) VALUES (
  '₹99',
  '/month',
  '[
    {"icon":"Zap",    "title":"Ad-free experience",        "desc":"Browse deals without any interruptions"},
    {"icon":"Star",   "title":"Early access to deals",     "desc":"See flash deals 24 hours before everyone else"},
    {"icon":"Shield", "title":"Priority cashback support", "desc":"Missing cashback resolved in 24 hrs, not 7 days"},
    {"icon":"Crown",  "title":"Premium badge & profile",   "desc":"Gold crown on your profile and reviews"},
    {"icon":"Clock",  "title":"Extended coupon window",    "desc":"Coupons stay valid 2× longer for Premium members"}
  ]'
);


-- ── 4. APP SETTINGS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS app_settings (
  key        TEXT        PRIMARY KEY,
  value      TEXT        NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read app settings"   ON app_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage app settings" ON app_settings FOR ALL
  USING  (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

INSERT INTO app_settings (key, value) VALUES
  ('maintenance_mode',    'false'),
  ('maintenance_message', 'We''re performing scheduled maintenance. We''ll be back shortly!')
ON CONFLICT (key) DO NOTHING;


-- ── 5. CONTENT PAGES ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_pages (
  slug       TEXT        PRIMARY KEY,
  title      TEXT        NOT NULL,
  body       TEXT        NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE content_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read content pages"   ON content_pages FOR SELECT USING (true);
CREATE POLICY "Admins manage content pages" ON content_pages FOR ALL
  USING  (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

INSERT INTO content_pages (slug, title, body) VALUES
  ('faq',     'Frequently Asked Questions', 'Q: How do I earn cashback?
A: Shop through product links in the app and your cashback is tracked automatically.

Q: When is cashback credited?
A: Cashback is credited after the return window closes, usually within 7–10 days of delivery.

Q: What is the minimum withdrawal amount?
A: The minimum withdrawal amount is ₹100.

Q: How do I report missing cashback?
A: Go to Wallet → Missing Cashback and submit your order details.'),

  ('help',    'Help & Support', 'Need help? Here''s how to reach us:

📧 Email: support@raikaro.com
⏰ Support hours: Monday–Friday, 10am–6pm IST

Common topics:
• Missing cashback — use the Wallet tab to submit a request
• Account issues — check your email for verification links
• Deal submissions — go to Account → Submit a Deal'),

  ('terms',   'Terms of Service', 'By using Raikaro, you agree to these terms.

1. ELIGIBILITY
You must be 18 or older to use this app and earn cashback.

2. CASHBACK
Cashback is earned on eligible purchases made through affiliate links in the app. Amounts are subject to change based on merchant rates.

3. WITHDRAWALS
Minimum withdrawal is ₹100. Processing may take 3–5 business days.

4. PROHIBITED ACTIVITY
Self-referrals, fraudulent orders, and misuse of the referral system will result in account suspension.

5. CHANGES
We may update these terms at any time. Continued use of the app constitutes acceptance.'),

  ('privacy', 'Privacy Policy', 'Your privacy matters to us.

WHAT WE COLLECT
• Email address and name (for your account)
• Device push notification token (for deal alerts)
• Product interaction data (to improve recommendations)

HOW WE USE IT
• To credit your cashback and process withdrawals
• To send you deal alerts you''ve opted into
• To improve the app

WE DO NOT
• Sell your personal data to third parties
• Share your UPI ID or PAN with anyone other than for withdrawal processing

DATA RETENTION
You can delete your account at any time by contacting support@raikaro.com.')
ON CONFLICT (slug) DO NOTHING;
