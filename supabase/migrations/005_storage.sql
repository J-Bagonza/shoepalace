-- =============================================
-- STORAGE BUCKETS
-- =============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'product-images',
    'product-images',
    TRUE,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
  ),
  (
    'product-models',
    'product-models',
    TRUE,
    52428800,
    ARRAY['model/gltf-binary', 'application/octet-stream']
  )
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- STORAGE RLS POLICIES
-- (RLS is already enabled on storage.objects by Supabase)
-- =============================================

DROP POLICY IF EXISTS storage_images_public_read    ON storage.objects;
DROP POLICY IF EXISTS storage_images_admin_insert   ON storage.objects;
DROP POLICY IF EXISTS storage_images_admin_update   ON storage.objects;
DROP POLICY IF EXISTS storage_images_admin_delete   ON storage.objects;
DROP POLICY IF EXISTS storage_models_public_read    ON storage.objects;
DROP POLICY IF EXISTS storage_models_admin_insert   ON storage.objects;
DROP POLICY IF EXISTS storage_models_admin_update   ON storage.objects;
DROP POLICY IF EXISTS storage_models_admin_delete   ON storage.objects;

-- Product images
CREATE POLICY storage_images_public_read
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY storage_images_admin_insert
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND public.get_user_role() = 'admin'
  );

CREATE POLICY storage_images_admin_update
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'product-images'
    AND public.get_user_role() = 'admin'
  );

CREATE POLICY storage_images_admin_delete
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-images'
    AND public.get_user_role() = 'admin'
  );

-- Product models
CREATE POLICY storage_models_public_read
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-models');

CREATE POLICY storage_models_admin_insert
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-models'
    AND public.get_user_role() = 'admin'
  );

CREATE POLICY storage_models_admin_update
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'product-models'
    AND public.get_user_role() = 'admin'
  );

CREATE POLICY storage_models_admin_delete
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-models'
    AND public.get_user_role() = 'admin'
  );