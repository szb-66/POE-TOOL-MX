CREATE OR REPLACE FUNCTION public.feedback_storage_upload_allowed(request_uid text, object_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, storage
AS $$
  SELECT
    request_uid IS NOT NULL
    AND request_uid <> 'anon'
    AND split_part(object_name, '/', 1) = request_uid
    AND (
      (
        split_part(object_name, '/', 2) ~ '^FB-[0-9]{8}-[A-Z0-9]{8}$'
        AND split_part(object_name, '/', 3) <> ''
        AND split_part(object_name, '/', 4) = ''
        AND (
          SELECT count(*)
          FROM storage.objects AS object
          WHERE object.bucket_id = 'feedback'
            AND object.owner_id = request_uid
            AND split_part(object.name, '/', 2) = split_part(object_name, '/', 2)
            AND split_part(object.name, '/', 3) <> 'messages'
        ) < 19
      )
      OR
      (
        split_part(object_name, '/', 2) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        AND split_part(object_name, '/', 3) = 'messages'
        AND split_part(object_name, '/', 4) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        AND split_part(object_name, '/', 5) <> ''
        AND split_part(object_name, '/', 6) = ''
        AND EXISTS (
          SELECT 1
          FROM public.app_feedback AS feedback
          WHERE feedback.id = split_part(object_name, '/', 2)::uuid
            AND feedback.submitter_uid = request_uid
        )
        AND (
          SELECT count(*)
          FROM storage.objects AS object
          WHERE object.bucket_id = 'feedback'
            AND object.owner_id = request_uid
            AND split_part(object.name, '/', 2) = split_part(object_name, '/', 2)
            AND split_part(object.name, '/', 3) = 'messages'
            AND split_part(object.name, '/', 4) = split_part(object_name, '/', 4)
        ) < 5
      )
    )
    AND (
      SELECT count(*)
      FROM storage.objects AS object
      WHERE object.bucket_id = 'feedback'
        AND object.owner_id = request_uid
    ) < 50
    AND (
      SELECT count(*)
      FROM storage.objects AS object
      WHERE object.bucket_id = 'feedback'
    ) < 1000;
$$;

REVOKE ALL ON FUNCTION public.feedback_storage_upload_allowed(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.feedback_storage_upload_allowed(text, text) TO anon;

COMMENT ON FUNCTION public.feedback_storage_upload_allowed(text, text) IS
  'Allows up to 19 legacy root feedback objects for manual and bounded diagnostic evidence attachments, and UUID-scoped reply paths only when the feedback belongs to the current anonymous installation.';
