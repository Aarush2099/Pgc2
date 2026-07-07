
-- 1) admin_settings: gate public reads behind is_public flag
ALTER TABLE public.admin_settings
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;

DROP POLICY IF EXISTS admin_settings_public_read ON public.admin_settings;
CREATE POLICY admin_settings_public_read
  ON public.admin_settings
  FOR SELECT
  TO anon, authenticated
  USING (is_public = true);

-- 2) profiles: prevent self-update of privileged columns (points, role, participant_number, email, id)
DROP POLICY IF EXISTS "profiles self update" ON public.profiles;
CREATE POLICY "profiles self update"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

REVOKE UPDATE ON public.profiles FROM anon, authenticated, PUBLIC;
GRANT UPDATE (full_name, country, school, updated_at) ON public.profiles TO authenticated;

-- 3) Lock down trigger-only SECURITY DEFINER functions from being invoked by clients
REVOKE EXECUTE ON FUNCTION public.apply_submission_points() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
