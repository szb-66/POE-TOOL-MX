REVOKE ALL ON public.app_presence FROM anon;
REVOKE ALL ON public.app_presence FROM authenticated;

DROP POLICY IF EXISTS app_presence_update_own ON public.app_presence;
DROP POLICY IF EXISTS app_presence_insert_own ON public.app_presence;

DROP TRIGGER IF EXISTS app_presence_enforce_identity ON public.app_presence;
DROP FUNCTION IF EXISTS public.enforce_app_presence_identity();

DROP VIEW IF EXISTS public.app_presence_heartbeat;
CREATE VIEW public.app_presence_heartbeat
WITH (security_invoker = true)
AS
SELECT
  app_version,
  platform,
  arch,
  runtime_mode
FROM public.app_presence
WHERE false;

REVOKE ALL ON public.app_presence_heartbeat FROM PUBLIC;
REVOKE ALL ON public.app_presence_heartbeat FROM anon;
REVOKE ALL ON public.app_presence_heartbeat FROM authenticated;
GRANT INSERT ON public.app_presence_heartbeat TO anon;

CREATE OR REPLACE FUNCTION public.submit_app_presence_heartbeat()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  request_uid text := auth.uid();
BEGIN
  IF request_uid IS NULL OR request_uid = '' OR request_uid = 'anon' THEN
    RAISE EXCEPTION 'stable anonymous identity required' USING ERRCODE = '42501';
  END IF;

  IF NEW.app_version IS NULL OR char_length(NEW.app_version) NOT BETWEEN 1 AND 32
    OR NEW.platform IS NULL OR char_length(NEW.platform) NOT BETWEEN 1 AND 32
    OR NEW.arch IS NULL OR char_length(NEW.arch) NOT BETWEEN 1 AND 32
    OR NEW.runtime_mode IS NULL OR NEW.runtime_mode NOT IN ('development', 'packaged') THEN
    RAISE EXCEPTION 'invalid application presence payload' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.app_presence (
    installation_uid,
    first_seen_at,
    last_seen_at,
    app_version,
    platform,
    arch,
    runtime_mode,
    schema_version
  ) VALUES (
    request_uid,
    statement_timestamp(),
    statement_timestamp(),
    NEW.app_version,
    NEW.platform,
    NEW.arch,
    NEW.runtime_mode,
    1
  )
  ON CONFLICT (installation_uid) DO UPDATE SET
    last_seen_at = statement_timestamp(),
    app_version = EXCLUDED.app_version,
    platform = EXCLUDED.platform,
    arch = EXCLUDED.arch,
    runtime_mode = EXCLUDED.runtime_mode,
    schema_version = 1;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_app_presence_heartbeat() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_app_presence_heartbeat() FROM anon;
REVOKE ALL ON FUNCTION public.submit_app_presence_heartbeat() FROM authenticated;

CREATE TRIGGER app_presence_heartbeat_insert
  INSTEAD OF INSERT ON public.app_presence_heartbeat
  FOR EACH ROW
  EXECUTE FUNCTION public.submit_app_presence_heartbeat();

COMMENT ON VIEW public.app_presence_heartbeat IS
  'Write-only anonymous desktop heartbeat boundary; identity and timestamps come from the database.';
COMMENT ON FUNCTION public.submit_app_presence_heartbeat() IS
  'Validates a minimal heartbeat and upserts one server-timed row for auth.uid().';

-- Rollback:
-- REVOKE INSERT ON public.app_presence_heartbeat FROM anon;
-- DROP TRIGGER IF EXISTS app_presence_heartbeat_insert ON public.app_presence_heartbeat;
-- DROP FUNCTION IF EXISTS public.submit_app_presence_heartbeat();
-- DROP VIEW IF EXISTS public.app_presence_heartbeat;
-- Reapply migration 20260819072620 if the deprecated direct-table write path is required.
