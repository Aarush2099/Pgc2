
-- Add is_milestone column to program_themes
ALTER TABLE public.program_themes
  ADD COLUMN IF NOT EXISTS is_milestone boolean NOT NULL DEFAULT false;

-- Regional contexts
CREATE TABLE public.regional_contexts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country text NOT NULL,
  day_number integer NOT NULL CHECK (day_number BETWEEN 1 AND 30),
  year integer NOT NULL DEFAULT 2026,
  theme text NOT NULL,
  context_headline text NOT NULL,
  context_body text NOT NULL,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (country, day_number, year)
);
CREATE INDEX regional_contexts_country_year_idx ON public.regional_contexts(country, year);
CREATE INDEX regional_contexts_day_idx ON public.regional_contexts(day_number, year);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.regional_contexts TO authenticated;
GRANT ALL ON public.regional_contexts TO service_role;
ALTER TABLE public.regional_contexts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "regional_contexts_student_read" ON public.regional_contexts
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "regional_contexts_admin_insert" ON public.regional_contexts
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "regional_contexts_admin_update" ON public.regional_contexts
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "regional_contexts_admin_delete" ON public.regional_contexts
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_regional_contexts_updated_at
  BEFORE UPDATE ON public.regional_contexts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Admin settings
CREATE TABLE public.admin_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_settings TO authenticated;
GRANT ALL ON public.admin_settings TO service_role;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_settings_public_read" ON public.admin_settings FOR SELECT USING (true);
CREATE POLICY "admin_settings_admin_all" ON public.admin_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER admin_settings_set_updated BEFORE UPDATE ON public.admin_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Admin actions audit log
CREATE TABLE public.admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_email text,
  action text NOT NULL,
  target_type text,
  target_country text,
  target_day_number integer,
  target_theme text,
  target_year integer,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.admin_actions TO authenticated;
GRANT ALL ON public.admin_actions TO service_role;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read admin actions" ON public.admin_actions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins insert admin actions" ON public.admin_actions
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX admin_actions_created_idx ON public.admin_actions (created_at DESC);
CREATE INDEX admin_actions_target_idx ON public.admin_actions (target_country, target_day_number);
