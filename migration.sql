-- =============================================================================
-- review-media Storage bucket + RLS policies + reviews INSERT policy
-- Run in: Supabase Dashboard → SQL Editor
-- =============================================================================

-- 1. Ensure the review-media bucket exists and is public
--    (so getPublicUrl() returns accessible URLs)
INSERT INTO storage.buckets (id, name, public)
VALUES ('review-media', 'review-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;


-- 2. Storage RLS policies on storage.objects for review-media

-- Authenticated users can upload into their own folder (<userId>/...)
CREATE POLICY "Users can upload review media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'review-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Anyone can read/view files (needed for public media URLs to work)
CREATE POLICY "Public can view review media"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'review-media');

-- Users can delete their own files
CREATE POLICY "Users can delete their own review media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'review-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );


-- =============================================================================
-- Push Notification Infrastructure
-- Run in: Supabase Dashboard → SQL Editor
-- =============================================================================

-- 4. Add push_token column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_token TEXT;

-- 5. Allow users to update their own push_token (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'profiles'
      AND policyname = 'Users can update own profile'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Users can update own profile"
        ON profiles FOR UPDATE
        TO authenticated
        USING (id = auth.uid())
        WITH CHECK (id = auth.uid())
    $policy$;
  END IF;
END
$$;

-- 6. Add triggered_at to price_alerts so we don't re-notify already-fired alerts
ALTER TABLE price_alerts ADD COLUMN IF NOT EXISTS triggered_at TIMESTAMPTZ;


-- =============================================================================
-- (existing) reviews INSERT policy
-- =============================================================================

-- 3. reviews table INSERT policy (idempotent — skips if already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'reviews'
      AND policyname = 'Users can insert own reviews'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Users can insert own reviews"
        ON reviews FOR INSERT
        TO authenticated
        WITH CHECK (reviewer_id = auth.uid())
    $policy$;
  END IF;
END
$$;
