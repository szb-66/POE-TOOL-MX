REVOKE INSERT ON public.app_feedback FROM authenticated;
GRANT INSERT ON public.app_feedback TO anon;

DROP POLICY app_feedback_insert_own ON public.app_feedback;
CREATE POLICY app_feedback_insert_own
  ON public.app_feedback
  FOR INSERT
  TO anon
  WITH CHECK (
    submitter_uid = auth.uid()
    AND auth.uid() IS NOT NULL
    AND auth.uid() <> 'anon'
  );
