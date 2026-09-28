CREATE TABLE public.ai_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'New agent',
  purpose text NOT NULL DEFAULT '',
  tone text NOT NULL DEFAULT 'Warm, concise, professional',
  instructions text NOT NULL DEFAULT '',
  autonomy_level text NOT NULL DEFAULT 'guided',
  escalation_rules text NOT NULL DEFAULT '',
  forbidden_topics text NOT NULL DEFAULT '',
  channels text[] NOT NULL DEFAULT '{}',
  is_default boolean NOT NULL DEFAULT false,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_agents TO authenticated;
GRANT ALL ON public.ai_agents TO service_role;
ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members manage agents" ON public.ai_agents FOR ALL TO authenticated
  USING (public.is_workspace_member(workspace_id)) WITH CHECK (public.is_workspace_member(workspace_id));
CREATE TRIGGER ai_agents_updated BEFORE UPDATE ON public.ai_agents FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.ai_agents (workspace_id, name, purpose, tone, instructions, autonomy_level, escalation_rules, forbidden_topics, enabled, is_default)
SELECT workspace_id, agent_name, 'Booking concierge', tone, instructions, autonomy_level, escalation_rules, forbidden_topics, enabled, true
FROM public.ai_agent_settings;

CREATE TABLE public.automation_flows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Untitled flow',
  kind text NOT NULL DEFAULT 'custom',
  enabled boolean NOT NULL DEFAULT true,
  nodes jsonb NOT NULL DEFAULT '[]',
  edges jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.automation_flows TO authenticated;
GRANT ALL ON public.automation_flows TO service_role;
ALTER TABLE public.automation_flows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members manage flows" ON public.automation_flows FOR ALL TO authenticated
  USING (public.is_workspace_member(workspace_id)) WITH CHECK (public.is_workspace_member(workspace_id));
CREATE TRIGGER automation_flows_updated BEFORE UPDATE ON public.automation_flows FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.conversations ADD COLUMN agent_id uuid REFERENCES public.ai_agents(id) ON DELETE SET NULL;

INSERT INTO storage.objects (bucket_id, name) SELECT 'x','x' WHERE false;