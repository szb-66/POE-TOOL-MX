CREATE TABLE public.app_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id text NOT NULL UNIQUE,
  category text NOT NULL CHECK (category IN ('bug', 'operation', 'data', 'suggestion', 'other')),
  title text NOT NULL CHECK (char_length(title) BETWEEN 5 AND 80),
  description text NOT NULL CHECK (char_length(description) BETWEEN 20 AND 2000),
  contact text CHECK (contact IS NULL OR char_length(contact) <= 200),
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(attachments) = 'array'),
  diagnostics_included boolean NOT NULL DEFAULT false,
  submitter_uid text NOT NULL DEFAULT auth.uid(),
  status text NOT NULL DEFAULT 'new' CHECK (status = 'new'),
  app_version text NOT NULL,
  platform text NOT NULL,
  arch text NOT NULL,
  locale text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  schema_version integer NOT NULL DEFAULT 1 CHECK (schema_version = 1)
);

CREATE INDEX app_feedback_submitter_created_idx
  ON public.app_feedback (submitter_uid, created_at DESC);

REVOKE ALL ON public.app_feedback FROM anon;
REVOKE ALL ON public.app_feedback FROM authenticated;
GRANT INSERT ON public.app_feedback TO authenticated;
GRANT ALL ON public.app_feedback TO service_role;

ALTER TABLE public.app_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY app_feedback_insert_own
  ON public.app_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (submitter_uid = auth.uid());

COMMENT ON TABLE public.app_feedback IS
  'Write-only application feedback submitted by authenticated anonymous users.';
