ALTER TABLE public.app_feedback
  DROP CONSTRAINT app_feedback_status_check;

ALTER TABLE public.app_feedback
  ADD CONSTRAINT app_feedback_status_check
  CHECK (status IN ('new', 'in_progress', 'resolved', 'closed'));

CREATE OR REPLACE FUNCTION public.feedback_submission_allowed(request_uid text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT
    request_uid IS NOT NULL
    AND request_uid <> 'anon'
    AND (
      SELECT count(*)
      FROM public.app_feedback AS feedback
      WHERE feedback.submitter_uid = request_uid
        AND feedback.created_at >= now() - interval '1 hour'
    ) < 5
    AND (
      SELECT count(*)
      FROM public.app_feedback
    ) < 10000;
$$;

REVOKE ALL ON FUNCTION public.feedback_submission_allowed(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.feedback_submission_allowed(text) TO anon;

DROP POLICY app_feedback_insert_own ON public.app_feedback;
CREATE POLICY app_feedback_insert_own
  ON public.app_feedback
  FOR INSERT
  TO anon
  WITH CHECK (
    submitter_uid = auth.uid()
    AND public.feedback_submission_allowed(auth.uid())
  );

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
    AND split_part(object_name, '/', 2) ~ '^FB-[0-9]{8}-[A-Z0-9]{8}$'
    AND split_part(object_name, '/', 3) <> ''
    AND split_part(object_name, '/', 4) = ''
    AND (
      SELECT count(*)
      FROM storage.objects AS object
      WHERE object.bucket_id = 'feedback'
        AND object.owner_id = request_uid
        AND split_part(object.name, '/', 2) = split_part(object_name, '/', 2)
    ) < 6
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

COMMENT ON FUNCTION public.feedback_submission_allowed(text) IS
  'Limits anonymous feedback to 5 submissions per identity per hour and 10000 retained rows globally.';
COMMENT ON FUNCTION public.feedback_storage_upload_allowed(text, text) IS
  'Limits feedback storage to 6 objects per feedback, 50 per identity, and 1000 globally.';
