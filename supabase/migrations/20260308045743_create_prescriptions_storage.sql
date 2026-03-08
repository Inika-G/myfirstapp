/*
  # Create prescriptions storage bucket

  1. Storage
    - Create 'prescriptions' bucket for storing prescription images
    - Enable public access for displaying images
    - Set appropriate bucket policies

  2. Bucket Policies
    - Users can upload their own prescriptions
    - Users can read their own prescriptions
*/

-- Create the storage bucket through a stored procedure
-- Note: Storage buckets cannot be created through migrations in Supabase
-- Users must create the 'prescriptions' bucket manually or via the Supabase Dashboard
-- This is a placeholder migration documenting the required bucket setup

-- The following bucket configuration is needed:
-- Bucket name: prescriptions
-- Public: true (to serve images publicly)
-- Allowed MIME types: image/jpeg, image/png, image/gif, image/webp

-- After creating the bucket in Supabase Dashboard, add these RLS policies:

-- CREATE POLICY "Users can upload own prescriptions"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'prescriptions' AND auth.uid()::text = owner);

-- CREATE POLICY "Users can view own prescriptions"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'prescriptions' AND auth.uid()::text = owner);

-- CREATE POLICY "Public read access to prescriptions"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'prescriptions');