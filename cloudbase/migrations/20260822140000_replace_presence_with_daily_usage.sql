-- Replace minute-level presence heartbeats with one daily usage upsert per install.
-- Existing installation rows and their timestamps are preserved by renaming in place.

REVOKE ALL ON public.app_presence_heartbeat FROM PUBLIC;
REVOKE ALL ON public.app_presence_heartbeat FROM anon;
REVOKE ALL ON public.app_presence_heartbeat FROM authenticated;
DROP TRIGGER IF EXISTS app_presence_heartbeat_insert ON public.app_presence_heartbeat;
DROP FUNCTION IF EXISTS public.submit_app_presence_heartbeat();
DROP VIEW IF EXISTS public.app_presence_heartbeat;

DROP VIEW IF EXISTS public.app_online_summary;

ALTER TABLE public.app_presence RENAME TO app_daily_usage;
ALTER TABLE public.app_daily_usage RENAME COLUMN first_seen_at TO first_used_at;
ALTER TABLE public.app_daily_usage RENAME COLUMN last_seen_at TO last_used_at;
ALTER INDEX public.app_presence_last_seen_idx RENAME TO app_daily_usage_last_used_idx;

REVOKE ALL ON public.app_daily_usage FROM PUBLIC;
REVOKE ALL ON public.app_daily_usage FROM anon;
REVOKE ALL ON public.app_daily_usage FROM authenticated;
GRANT ALL ON public.app_daily_usage TO service_role;

DROP POLICY IF EXISTS app_presence_insert_own ON public.app_daily_usage;
DROP POLICY IF EXISTS app_presence_update_own ON public.app_daily_usage;
DROP TRIGGER IF EXISTS app_presence_enforce_identity ON public.app_daily_usage;
DROP FUNCTION IF EXISTS public.enforce_app_presence_identity();

CREATE VIEW public.app_daily_usage_report
WITH (security_invoker = true)
AS
SELECT
  app_version,
  platform,
  arch,
  runtime_mode
FROM public.app_daily_usage
WHERE false;

REVOKE ALL ON public.app_daily_usage_report FROM PUBLIC;
REVOKE ALL ON public.app_daily_usage_report FROM anon;
REVOKE ALL ON public.app_daily_usage_report FROM authenticated;
GRANT INSERT ON public.app_daily_usage_report TO anon;

CREATE OR REPLACE FUNCTION public.submit_app_daily_usage_report()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  request_uid text := auth.uid();
  report_time timestamptz := statement_timestamp();
BEGIN
  IF request_uid IS NULL OR request_uid = '' OR request_uid = 'anon' THEN
    RAISE EXCEPTION 'stable anonymous identity required' USING ERRCODE = '42501';
  END IF;

  IF NEW.app_version IS NULL OR char_length(NEW.app_version) NOT BETWEEN 1 AND 32
    OR NEW.platform IS NULL OR char_length(NEW.platform) NOT BETWEEN 1 AND 32
    OR NEW.arch IS NULL OR char_length(NEW.arch) NOT BETWEEN 1 AND 32
    OR NEW.runtime_mode IS NULL OR NEW.runtime_mode <> 'packaged' THEN
    RAISE EXCEPTION 'invalid application daily usage payload' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.app_daily_usage (
    installation_uid,
    first_used_at,
    last_used_at,
    app_version,
    platform,
    arch,
    runtime_mode,
    schema_version
  ) VALUES (
    request_uid,
    report_time,
    report_time,
    NEW.app_version,
    NEW.platform,
    NEW.arch,
    NEW.runtime_mode,
    1
  )
  ON CONFLICT (installation_uid) DO UPDATE SET
    last_used_at = report_time,
    app_version = EXCLUDED.app_version,
    platform = EXCLUDED.platform,
    arch = EXCLUDED.arch,
    runtime_mode = EXCLUDED.runtime_mode,
    schema_version = 1;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_app_daily_usage_report() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_app_daily_usage_report() FROM anon;
REVOKE ALL ON FUNCTION public.submit_app_daily_usage_report() FROM authenticated;

CREATE TRIGGER app_daily_usage_report_insert
  INSTEAD OF INSERT ON public.app_daily_usage_report
  FOR EACH ROW
  EXECUTE FUNCTION public.submit_app_daily_usage_report();

CREATE VIEW public.app_daily_usage_summary
WITH (security_invoker = true)
AS
SELECT
  (statement_timestamp() AT TIME ZONE 'Asia/Shanghai')::date AS usage_date,
  runtime_mode,
  app_version,
  count(*)::bigint AS usage_count,
  statement_timestamp() AS calculated_at
FROM public.app_daily_usage
WHERE runtime_mode = 'packaged'
  AND last_used_at >= date_trunc('day', statement_timestamp(), 'Asia/Shanghai')
  AND last_used_at < date_trunc('day', statement_timestamp(), 'Asia/Shanghai') + interval '1 day'
GROUP BY runtime_mode, app_version;

REVOKE ALL ON public.app_daily_usage_summary FROM PUBLIC;
REVOKE ALL ON public.app_daily_usage_summary FROM anon;
REVOKE ALL ON public.app_daily_usage_summary FROM authenticated;
GRANT SELECT ON public.app_daily_usage_summary TO service_role;

COMMENT ON TABLE public.app_daily_usage IS
  'One server-timed usage row per stable anonymous packaged application installation; no event history.';
COMMENT ON VIEW public.app_daily_usage_report IS
  'Write-only anonymous packaged desktop daily usage boundary; identity and timestamps come from the database.';
COMMENT ON FUNCTION public.submit_app_daily_usage_report() IS
  'Validates packaged runtime metadata and upserts one server-timed row for auth.uid().';
COMMENT ON VIEW public.app_daily_usage_summary IS
  'Administrative packaged-install usage counts for the current Asia/Shanghai calendar date.';

-- Rollback (emergency only; restoring heartbeats also restores their high PG cost):
-- 1. Drop app_daily_usage_summary, app_daily_usage_report trigger/view and
--    submit_app_daily_usage_report().
-- 2. Rename app_daily_usage back to app_presence, first_used_at to first_seen_at,
--    last_used_at to last_seen_at, and the index back to app_presence_last_seen_idx.
-- 3. Reapply migrations 20260819071716, 20260819072620 and 20260819074422
--    object definitions, then roll back the desktop and admin applications.
