CREATE TABLE public.app_presence (
  installation_uid text PRIMARY KEY,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  app_version text NOT NULL CHECK (char_length(app_version) BETWEEN 1 AND 32),
  platform text NOT NULL CHECK (char_length(platform) BETWEEN 1 AND 32),
  arch text NOT NULL CHECK (char_length(arch) BETWEEN 1 AND 32),
  runtime_mode text NOT NULL CHECK (runtime_mode IN ('development', 'packaged')),
  schema_version integer NOT NULL DEFAULT 1 CHECK (schema_version = 1)
);

CREATE INDEX app_presence_last_seen_idx
  ON public.app_presence (last_seen_at DESC);

ALTER TABLE public.app_presence ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.app_presence FROM PUBLIC;
REVOKE ALL ON public.app_presence FROM anon;
REVOKE ALL ON public.app_presence FROM authenticated;
GRANT ALL ON public.app_presence TO service_role;

CREATE OR REPLACE FUNCTION public.report_app_presence(
  p_app_version text,
  p_platform text,
  p_arch text,
  p_runtime_mode text
)
RETURNS void
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

  IF p_app_version IS NULL OR char_length(p_app_version) NOT BETWEEN 1 AND 32
    OR p_platform IS NULL OR char_length(p_platform) NOT BETWEEN 1 AND 32
    OR p_arch IS NULL OR char_length(p_arch) NOT BETWEEN 1 AND 32
    OR p_runtime_mode IS NULL OR p_runtime_mode NOT IN ('development', 'packaged') THEN
    RAISE EXCEPTION 'invalid application presence payload' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.app_presence (
    installation_uid,
    app_version,
    platform,
    arch,
    runtime_mode
  ) VALUES (
    request_uid,
    p_app_version,
    p_platform,
    p_arch,
    p_runtime_mode
  )
  ON CONFLICT (installation_uid) DO UPDATE SET
    last_seen_at = now(),
    app_version = EXCLUDED.app_version,
    platform = EXCLUDED.platform,
    arch = EXCLUDED.arch,
    runtime_mode = EXCLUDED.runtime_mode,
    schema_version = 1;
END;
$$;

REVOKE ALL ON FUNCTION public.report_app_presence(text, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.report_app_presence(text, text, text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.report_app_presence(text, text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.report_app_presence(text, text, text, text) TO service_role;

CREATE VIEW public.app_online_summary
WITH (security_invoker = true)
AS
SELECT
  runtime_mode,
  app_version,
  count(*)::bigint AS online_count,
  statement_timestamp() AS calculated_at
FROM public.app_presence
WHERE last_seen_at >= now() - interval '3 minutes'
GROUP BY runtime_mode, app_version;

REVOKE ALL ON public.app_online_summary FROM PUBLIC;
REVOKE ALL ON public.app_online_summary FROM anon;
REVOKE ALL ON public.app_online_summary FROM authenticated;
GRANT SELECT ON public.app_online_summary TO service_role;

COMMENT ON TABLE public.app_presence IS
  'One current presence row per stable anonymous application installation; no heartbeat event history.';
COMMENT ON FUNCTION public.report_app_presence(text, text, text, text) IS
  'Updates the authenticated anonymous installation presence using server time.';
COMMENT ON VIEW public.app_online_summary IS
  'Administrative online counts for heartbeats received in the last three minutes.';

-- Rollback:
-- DROP VIEW IF EXISTS public.app_online_summary;
-- DROP FUNCTION IF EXISTS public.report_app_presence(text, text, text, text);
-- DROP TABLE IF EXISTS public.app_presence;
