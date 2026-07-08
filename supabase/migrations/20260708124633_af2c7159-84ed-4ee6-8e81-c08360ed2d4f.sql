
-- 1. Prevent students from modifying protected submission columns.
CREATE OR REPLACE FUNCTION public.prevent_submission_sensitive_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admins can change anything.
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  -- Non-admins may not change these columns.
  IF NEW.user_id     IS DISTINCT FROM OLD.user_id     THEN RAISE EXCEPTION 'Cannot change user_id'; END IF;
  IF NEW.status      IS DISTINCT FROM OLD.status      THEN NEW.status      := OLD.status;      END IF;
  IF NEW.ai_feedback IS DISTINCT FROM OLD.ai_feedback THEN NEW.ai_feedback := OLD.ai_feedback; END IF;
  IF NEW.ai_next_steps IS DISTINCT FROM OLD.ai_next_steps THEN NEW.ai_next_steps := OLD.ai_next_steps; END IF;
  IF NEW.phase       IS DISTINCT FROM OLD.phase       THEN NEW.phase       := OLD.phase;       END IF;
  IF NEW.country     IS DISTINCT FROM OLD.country     THEN NEW.country     := OLD.country;     END IF;
  IF NEW.day_number  IS DISTINCT FROM OLD.day_number  THEN NEW.day_number  := OLD.day_number;  END IF;
  IF NEW.theme       IS DISTINCT FROM OLD.theme       THEN NEW.theme       := OLD.theme;       END IF;
  IF NEW.type        IS DISTINCT FROM OLD.type        THEN NEW.type        := OLD.type;        END IF;
  IF NEW.submitted_at IS DISTINCT FROM OLD.submitted_at THEN NEW.submitted_at := OLD.submitted_at; END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_prevent_submission_sensitive_update ON public.submissions;
CREATE TRIGGER trg_prevent_submission_sensitive_update
BEFORE UPDATE ON public.submissions
FOR EACH ROW EXECUTE FUNCTION public.prevent_submission_sensitive_update();

-- 2. Convert has_role to SECURITY INVOKER — it only reads user_roles,
--    and user_roles RLS already lets each user read their own row.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 3. Revoke EXECUTE on remaining SECURITY DEFINER functions from anon/authenticated.
--    Triggers still fire (they run as table owner) and server code uses service_role.
REVOKE EXECUTE ON FUNCTION public.country_leaderboard()                    FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.individual_leaderboard(integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.user_rank(uuid)                          FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.apply_submission_points()                FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user()                        FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column()               FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.country_leaderboard()                     TO service_role;
GRANT EXECUTE ON FUNCTION public.individual_leaderboard(integer, integer)  TO service_role;
GRANT EXECUTE ON FUNCTION public.user_rank(uuid)                           TO service_role;
