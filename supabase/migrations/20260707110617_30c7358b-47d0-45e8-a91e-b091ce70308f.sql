DROP FUNCTION IF EXISTS public.individual_leaderboard(int, int) CASCADE;

CREATE OR REPLACE FUNCTION public.individual_leaderboard(
  _limit int DEFAULT 50,
  _offset int DEFAULT 0
)
RETURNS TABLE(
  rank bigint,
  id uuid,
  school text,
  country text,
  points int
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT row_number() OVER (
           ORDER BY p.points DESC,
                    COALESCE(p.first_submission_at, now() + interval '100 years') ASC,
                    p.created_at ASC
         ) AS rank,
         p.id,
         p.school,
         p.country,
         p.points
  FROM public.profiles p
  ORDER BY p.points DESC,
           COALESCE(p.first_submission_at, now() + interval '100 years') ASC,
           p.created_at ASC
  LIMIT LEAST(GREATEST(_limit, 1), 200)
  OFFSET GREATEST(_offset, 0)
$$;

REVOKE ALL ON FUNCTION public.individual_leaderboard(int, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.individual_leaderboard(int, int) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.country_leaderboard() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.country_leaderboard() TO anon, authenticated;

REVOKE ALL ON FUNCTION public.user_rank(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.user_rank(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.user_rank(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
             WHERE n.nspname='public' AND p.proname='has_role'
               AND pg_get_function_identity_arguments(p.oid)='_role app_role') THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.has_role(public.app_role) FROM anon, PUBLIC';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.has_role(public.app_role) TO authenticated';
  END IF;
END $$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user()          FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.apply_submission_points()  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
             WHERE n.nspname='public' AND p.proname='maybe_unlock_achievements') THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.maybe_unlock_achievements() FROM PUBLIC, anon, authenticated';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_regional_contexts_lookup
  ON public.regional_contexts (country, day_number, year);

CREATE INDEX IF NOT EXISTS idx_profiles_points_rank
  ON public.profiles (points DESC, first_submission_at ASC NULLS LAST, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_profiles_country
  ON public.profiles (country) WHERE country IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.generation_error_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id      uuid NOT NULL,
  scope       text NOT NULL,
  day_number  int,
  theme       text,
  country     text,
  error       text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_generation_error_log_run
  ON public.generation_error_log (run_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generation_error_log_recent
  ON public.generation_error_log (created_at DESC);

GRANT SELECT, INSERT, DELETE ON public.generation_error_log TO authenticated;
GRANT ALL ON public.generation_error_log TO service_role;

ALTER TABLE public.generation_error_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gel admin read"   ON public.generation_error_log;
DROP POLICY IF EXISTS "gel admin insert" ON public.generation_error_log;
DROP POLICY IF EXISTS "gel admin delete" ON public.generation_error_log;

CREATE POLICY "gel admin read"
  ON public.generation_error_log FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "gel admin insert"
  ON public.generation_error_log FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "gel admin delete"
  ON public.generation_error_log FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));