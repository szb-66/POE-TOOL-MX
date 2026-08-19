DROP FUNCTION IF EXISTS public.report_app_presence(text, text, text, text);

CREATE OR REPLACE FUNCTION public.enforce_app_presence_identity()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
DECLARE
  request_uid text := auth.uid();
BEGIN
  IF request_uid IS NULL OR request_uid = '' OR request_uid = 'anon' THEN
    RAISE EXCEPTION 'stable anonymous identity required' USING ERRCODE = '42501';
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.installation_uid := request_uid;
    NEW.first_seen_at := now();
  ELSE
    IF OLD.installation_uid <> request_uid THEN
      RAISE EXCEPTION 'presence identity mismatch' USING ERRCODE = '42501';
    END IF;
    NEW.installation_uid := OLD.installation_uid;
    NEW.first_seen_at := OLD.first_seen_at;
  END IF;

  NEW.last_seen_at := now();
  NEW.schema_version := 1;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_app_presence_identity() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.enforce_app_presence_identity() FROM anon;
REVOKE ALL ON FUNCTION public.enforce_app_presence_identity() FROM authenticated;

DROP TRIGGER IF EXISTS app_presence_enforce_identity ON public.app_presence;
CREATE TRIGGER app_presence_enforce_identity
  BEFORE INSERT OR UPDATE ON public.app_presence
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_app_presence_identity();

REVOKE ALL ON public.app_presence FROM anon;
REVOKE ALL ON public.app_presence FROM authenticated;
GRANT INSERT, UPDATE ON public.app_presence TO anon;

DROP POLICY IF EXISTS app_presence_insert_own ON public.app_presence;
CREATE POLICY app_presence_insert_own
  ON public.app_presence
  FOR INSERT
  TO anon
  WITH CHECK (
    installation_uid = auth.uid()
    AND auth.uid() IS NOT NULL
    AND auth.uid() <> 'anon'
  );

DROP POLICY IF EXISTS app_presence_update_own ON public.app_presence;
CREATE POLICY app_presence_update_own
  ON public.app_presence
  FOR UPDATE
  TO anon
  USING (
    installation_uid = auth.uid()
    AND auth.uid() IS NOT NULL
    AND auth.uid() <> 'anon'
  )
  WITH CHECK (
    installation_uid = auth.uid()
    AND auth.uid() IS NOT NULL
    AND auth.uid() <> 'anon'
  );

COMMENT ON FUNCTION public.enforce_app_presence_identity() IS
  'Forces authenticated anonymous UID and server timestamps for documented REST upserts.';

-- Rollback to the pre-correction state requires recreating report_app_presence
-- from migration 20260819071716 after removing the objects below:
-- DROP POLICY IF EXISTS app_presence_update_own ON public.app_presence;
-- DROP POLICY IF EXISTS app_presence_insert_own ON public.app_presence;
-- REVOKE INSERT, UPDATE ON public.app_presence FROM anon;
-- DROP TRIGGER IF EXISTS app_presence_enforce_identity ON public.app_presence;
-- DROP FUNCTION IF EXISTS public.enforce_app_presence_identity();
