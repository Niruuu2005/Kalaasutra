-- supabase/migrations/00003_storage_buckets.sql

-- Insert the product-media bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-media',
  'product-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']::text[]
) ON CONFLICT (id) DO UPDATE 
SET public = true, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']::text[];

-- Insert the custom-requests bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'custom-requests',
  'custom-requests',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
) ON CONFLICT (id) DO UPDATE
SET public = true, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[];

-- ==========================================
-- RLS POLICIES FOR 'product-media'
-- ==========================================
DROP POLICY IF EXISTS "Public Access to product-media" ON storage.objects;
DROP POLICY IF EXISTS "Admin Insert product-media" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update product-media" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete product-media" ON storage.objects;

-- Allow public read access to product-media
CREATE POLICY "Public Access to product-media"
ON storage.objects FOR SELECT
USING ( bucket_id = 'product-media' );

-- Allow authenticated admins to insert/update/delete in product-media
CREATE POLICY "Admin Insert product-media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-media' AND (auth.jwt() ->> 'role' IN ('owner', 'manager', 'editor'))
);

CREATE POLICY "Admin Update product-media"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'product-media' AND (auth.jwt() ->> 'role' IN ('owner', 'manager', 'editor')) );

CREATE POLICY "Admin Delete product-media"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'product-media' AND (auth.jwt() ->> 'role' IN ('owner', 'manager', 'editor')) );

-- ==========================================
-- RLS POLICIES FOR 'custom-requests'
-- ==========================================
DROP POLICY IF EXISTS "Public Upload to custom-requests" ON storage.objects;
DROP POLICY IF EXISTS "Public Read to custom-requests" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete custom-requests" ON storage.objects;

-- Allow anyone to upload to custom-requests (for the contact form)
CREATE POLICY "Public Upload to custom-requests"
ON storage.objects FOR INSERT
TO public
WITH CHECK ( bucket_id = 'custom-requests' );

-- Allow public read access to custom-requests
CREATE POLICY "Public Read to custom-requests"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'custom-requests' );

-- Allow admins to delete from custom-requests
CREATE POLICY "Admin Delete custom-requests"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'custom-requests' AND (auth.jwt() ->> 'role' IN ('owner', 'manager', 'editor')) );
