-- storage.objects is platform-owned, so these policies are applied through
-- CloudBase's privileged PG operations channel instead of user migrations.
UPDATE storage.buckets
SET
  file_size_limit = 10 * 1024 * 1024,
  allowed_mime_types = ARRAY[
    'image/png', 'image/jpeg', 'image/webp', 'image/gif',
    'text/plain', 'text/markdown', 'application/json', 'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/zip', 'application/x-7z-compressed',
    'application/vnd.rar', 'application/x-rar-compressed'
  ]::text[]
WHERE id = 'feedback';

DROP POLICY IF EXISTS feedback_insert_own ON storage.objects;
CREATE POLICY feedback_insert_own ON storage.objects
  FOR INSERT TO anon
  WITH CHECK (
    bucket_id = 'feedback'
    AND auth.uid() IS NOT NULL
    AND auth.uid() <> 'anon'
    AND (storage.foldername(name))[1] = auth.uid()
    AND owner_id = auth.uid()
    AND public.feedback_storage_upload_allowed(auth.uid(), name)
  );

DROP POLICY IF EXISTS feedback_select_own ON storage.objects;
CREATE POLICY feedback_select_own ON storage.objects
  FOR SELECT TO anon
  USING (
    bucket_id = 'feedback'
    AND auth.uid() IS NOT NULL
    AND auth.uid() <> 'anon'
    AND (storage.foldername(name))[1] = auth.uid()
  );

DROP POLICY IF EXISTS feedback_delete_own ON storage.objects;
CREATE POLICY feedback_delete_own ON storage.objects
  FOR DELETE TO anon
  USING (
    bucket_id = 'feedback'
    AND auth.uid() IS NOT NULL
    AND auth.uid() <> 'anon'
    AND (storage.foldername(name))[1] = auth.uid()
  );
