ALTER TABLE public.workspaces ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text, ADD COLUMN IF NOT EXISTS avatar_url text;

CREATE TABLE public.workspace_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  path text,
  mime text,
  size_bytes bigint NOT NULL DEFAULT 0,
  folder text,
  kind text NOT NULL DEFAULT 'file',
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_files TO authenticated;
GRANT ALL ON public.workspace_files TO service_role;
ALTER TABLE public.workspace_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members manage files" ON public.workspace_files FOR ALL TO authenticated
  USING (public.is_workspace_member(workspace_id)) WITH CHECK (public.is_workspace_member(workspace_id));

CREATE POLICY "Members update workspace" ON public.workspaces FOR UPDATE TO authenticated
  USING (public.is_workspace_member(id)) WITH CHECK (public.is_workspace_member(id));
GRANT UPDATE ON public.workspaces TO authenticated;

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
GRANT UPDATE ON public.profiles TO authenticated;

CREATE OR REPLACE FUNCTION public.workspace_team(_workspace_id uuid)
RETURNS TABLE(user_id uuid, role text, email text, full_name text, avatar_url text, joined_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT m.user_id, m.role, p.email, p.full_name, p.avatar_url, m.created_at
  FROM public.workspace_members m LEFT JOIN public.profiles p ON p.id = m.user_id
  WHERE m.workspace_id = _workspace_id AND public.is_workspace_member(_workspace_id)
  ORDER BY m.created_at
$$;
GRANT EXECUTE ON FUNCTION public.workspace_team(uuid) TO authenticated;