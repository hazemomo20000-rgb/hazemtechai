CREATE TABLE public.studio_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 80),
  category text NOT NULL DEFAULT 'مخصصة' CHECK (char_length(category) <= 40),
  instructions text NOT NULL CHECK (char_length(instructions) BETWEEN 1 AND 2000),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX studio_skills_user_idx ON public.studio_skills(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.studio_skills TO authenticated;
GRANT ALL ON public.studio_skills TO service_role;
ALTER TABLE public.studio_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read skills" ON public.studio_skills FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Owners add skills" ON public.studio_skills FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Owners edit skills" ON public.studio_skills FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Owners delete skills" ON public.studio_skills FOR DELETE TO authenticated USING (user_id = auth.uid());