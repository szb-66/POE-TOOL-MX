-- Accumulate anonymous packaged daily usage totals without installation-level history.
-- The migration day is the first trustworthy history date; earlier dates are not backfilled.

DROP VIEW public.app_daily_usage_summary;

CREATE TABLE public.app_daily_usage_totals (
  usage_date date PRIMARY KEY,
  usage_count bigint NOT NULL CHECK (usage_count >= 0),
  updated_at timestamptz NOT NULL DEFAULT statement_timestamp()
);

REVOKE ALL ON public.app_daily_usage_totals FROM PUBLIC;
REVOKE ALL ON public.app_daily_usage_totals FROM anon;
REVOKE ALL ON public.app_daily_usage_totals FROM authenticated;
GRANT SELECT ON public.app_daily_usage_totals TO service_role;

INSERT INTO public.app_daily_usage_totals (usage_date, usage_count, updated_at)
SELECT
  (statement_timestamp() AT TIME ZONE 'Asia/Shanghai')::date,
  count(*)::bigint,
  statement_timestamp()
FROM public.app_daily_usage
WHERE runtime_mode = 'packaged'
  AND last_used_at >= date_trunc('day', statement_timestamp(), 'Asia/Shanghai')
  AND last_used_at < date_trunc('day', statement_timestamp(), 'Asia/Shanghai') + interval '1 day';

CREATE OR REPLACE FUNCTION public.submit_app_daily_usage_report()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  request_uid text := auth.uid();
  report_time timestamptz := statement_timestamp();
  report_day date := (report_time AT TIME ZONE 'Asia/Shanghai')::date;
  day_start timestamptz := date_trunc('day', report_time, 'Asia/Shanghai');
  day_end timestamptz := day_start + interval '1 day';
  first_report_for_day boolean;
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
  ON CONFLICT (installation_uid) DO NOTHING
  RETURNING true INTO first_report_for_day;

  IF NOT COALESCE(first_report_for_day, false) THEN
    UPDATE public.app_daily_usage
    SET
      last_used_at = report_time,
      app_version = NEW.app_version,
      platform = NEW.platform,
      arch = NEW.arch,
      runtime_mode = NEW.runtime_mode,
      schema_version = 1
    WHERE installation_uid = request_uid
      AND (last_used_at < day_start OR last_used_at >= day_end)
    RETURNING true INTO first_report_for_day;
  END IF;

  IF NOT COALESCE(first_report_for_day, false) THEN
    UPDATE public.app_daily_usage
    SET
      last_used_at = report_time,
      app_version = NEW.app_version,
      platform = NEW.platform,
      arch = NEW.arch,
      runtime_mode = NEW.runtime_mode,
      schema_version = 1
    WHERE installation_uid = request_uid;
  ELSE
    INSERT INTO public.app_daily_usage_totals (usage_date, usage_count, updated_at)
    VALUES (report_day, 1, report_time)
    ON CONFLICT (usage_date) DO UPDATE SET
      usage_count = public.app_daily_usage_totals.usage_count + 1,
      updated_at = EXCLUDED.updated_at;
  END IF;

  RETURN NEW;
END;
$$;

CREATE VIEW public.app_daily_usage_summary
WITH (security_invoker = true)
AS
SELECT
  usage_date,
  'packaged'::text AS runtime_mode,
  usage_count,
  updated_at AS calculated_at
FROM public.app_daily_usage_totals;

REVOKE ALL ON public.app_daily_usage_summary FROM PUBLIC;
REVOKE ALL ON public.app_daily_usage_summary FROM anon;
REVOKE ALL ON public.app_daily_usage_summary FROM authenticated;
GRANT SELECT ON public.app_daily_usage_summary TO service_role;

COMMENT ON TABLE public.app_daily_usage_totals IS
  'Anonymous packaged-install daily totals from the first trustworthy Asia/Shanghai collection date; no installation history.';
COMMENT ON FUNCTION public.submit_app_daily_usage_report() IS
  'Maintains one latest row per authenticated install and increments its packaged daily total at most once per Asia/Shanghai date.';
COMMENT ON VIEW public.app_daily_usage_summary IS
  'Service-role-only packaged daily usage history without installation identifiers or pre-collection backfill.';

-- Rollback (application compatibility first, aggregate data preserved by default):
-- 1. Roll back consumers of historical rows to the /usage/today-only implementation.
-- 2. Recreate submit_app_daily_usage_report() and app_daily_usage_summary from
--    20260822140000_replace_presence_with_daily_usage.sql.
-- 3. Keep app_daily_usage_totals inaccessible for recovery; drop it only after
--    separately confirming that historical aggregate data is no longer needed.
