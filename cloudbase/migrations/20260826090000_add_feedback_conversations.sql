CREATE OR REPLACE FUNCTION public.feedback_message_attachments_valid(value jsonb)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = pg_catalog
AS $$
  SELECT
    jsonb_typeof(value) = 'array'
    AND jsonb_array_length(value) <= 5
    AND COALESCE((
      SELECT bool_and(
        jsonb_typeof(item) = 'object'
        AND jsonb_typeof(item -> 'name') = 'string'
        AND jsonb_typeof(item -> 'mimeType') = 'string'
        AND jsonb_typeof(item -> 'objectKey') = 'string'
        AND jsonb_typeof(item -> 'size') = 'number'
        AND (item ->> 'size')::bigint BETWEEN 0 AND 10485760
      )
      FROM jsonb_array_elements(value) AS item
    ), true)
    AND COALESCE((
      SELECT sum((item ->> 'size')::bigint) <= 31457280
      FROM jsonb_array_elements(value) AS item
    ), true);
$$;

REVOKE ALL ON FUNCTION public.feedback_message_attachments_valid(jsonb) FROM PUBLIC;

CREATE TABLE public.app_feedback_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id uuid NOT NULL REFERENCES public.app_feedback(id) ON DELETE CASCADE,
  author_role text NOT NULL CHECK (author_role IN ('user', 'admin')),
  body text NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 2000),
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb
    CHECK (public.feedback_message_attachments_valid(attachments)),
  submitter_uid text NOT NULL,
  client_message_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  schema_version integer NOT NULL DEFAULT 1 CHECK (schema_version = 1),
  CONSTRAINT app_feedback_messages_feedback_client_key UNIQUE (feedback_id, client_message_id)
);

CREATE INDEX app_feedback_messages_feedback_created_idx
  ON public.app_feedback_messages (feedback_id, created_at, id);
CREATE INDEX app_feedback_messages_submitter_created_idx
  ON public.app_feedback_messages (submitter_uid, created_at DESC);

CREATE OR REPLACE FUNCTION public.set_feedback_message_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  owner_uid text;
BEGIN
  SELECT feedback.submitter_uid
  INTO owner_uid
  FROM public.app_feedback AS feedback
  WHERE feedback.id = NEW.feedback_id;

  IF owner_uid IS NULL THEN
    RAISE EXCEPTION 'feedback not found' USING ERRCODE = '23503';
  END IF;

  NEW.submitter_uid := owner_uid;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.set_feedback_message_owner() FROM PUBLIC;

CREATE TRIGGER app_feedback_messages_set_owner
BEFORE INSERT OR UPDATE OF feedback_id, submitter_uid
ON public.app_feedback_messages
FOR EACH ROW EXECUTE FUNCTION public.set_feedback_message_owner();

CREATE OR REPLACE FUNCTION public.feedback_message_submission_allowed(
  request_uid text,
  request_feedback_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT
    request_uid IS NOT NULL
    AND request_uid <> 'anon'
    AND EXISTS (
      SELECT 1
      FROM public.app_feedback AS feedback
      WHERE feedback.id = request_feedback_id
        AND feedback.submitter_uid = request_uid
    )
    AND (
      SELECT count(*)
      FROM public.app_feedback_messages AS message
      WHERE message.submitter_uid = request_uid
        AND message.author_role = 'user'
        AND message.created_at >= now() - interval '1 hour'
    ) < 20
    AND (
      SELECT count(*)
      FROM public.app_feedback_messages AS message
      WHERE message.feedback_id = request_feedback_id
    ) < 200;
$$;

REVOKE ALL ON FUNCTION public.feedback_message_submission_allowed(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.feedback_message_submission_allowed(text, uuid) TO anon;

REVOKE ALL ON public.app_feedback_messages FROM anon;
REVOKE ALL ON public.app_feedback_messages FROM authenticated;
GRANT SELECT (id, feedback_id, author_role, body, attachments, client_message_id, created_at, schema_version)
  ON public.app_feedback_messages TO anon;
GRANT INSERT (feedback_id, author_role, body, attachments, client_message_id, schema_version)
  ON public.app_feedback_messages TO anon;
GRANT ALL ON public.app_feedback_messages TO service_role;

ALTER TABLE public.app_feedback_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_feedback_messages FORCE ROW LEVEL SECURITY;

CREATE POLICY app_feedback_messages_select_own
  ON public.app_feedback_messages
  FOR SELECT
  TO anon
  USING (
    submitter_uid = auth.uid()
    AND auth.uid() IS NOT NULL
    AND auth.uid() <> 'anon'
  );

CREATE POLICY app_feedback_messages_insert_own
  ON public.app_feedback_messages
  FOR INSERT
  TO anon
  WITH CHECK (
    author_role = 'user'
    AND submitter_uid = auth.uid()
    AND public.feedback_message_submission_allowed(auth.uid(), feedback_id)
  );

GRANT SELECT (id, feedback_id, category, title, description, attachments, created_at)
  ON public.app_feedback TO anon;

CREATE POLICY app_feedback_select_own
  ON public.app_feedback
  FOR SELECT
  TO anon
  USING (
    submitter_uid = auth.uid()
    AND auth.uid() IS NOT NULL
    AND auth.uid() <> 'anon'
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
    AND (
      (
        split_part(object_name, '/', 3) <> ''
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
        split_part(object_name, '/', 3) = 'messages'
        AND split_part(object_name, '/', 4) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        AND split_part(object_name, '/', 5) <> ''
        AND split_part(object_name, '/', 6) = ''
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

COMMENT ON TABLE public.app_feedback_messages IS
  'Append-only feedback conversation messages with installation-bound anonymous access.';
COMMENT ON FUNCTION public.feedback_message_submission_allowed(text, uuid) IS
  'Limits anonymous user replies to owned feedback, 20 per identity per hour, and 200 messages per conversation.';
COMMENT ON FUNCTION public.feedback_storage_upload_allowed(text, text) IS
  'Allows up to 19 original feedback objects for manual and bounded diagnostic evidence attachments, plus isolated conversation attachment paths, while retaining per-identity and global storage limits.';
