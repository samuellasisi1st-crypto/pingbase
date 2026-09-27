CREATE TABLE public.channel_secrets (
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  secrets JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, channel)
);
GRANT ALL ON public.channel_secrets TO service_role;
ALTER TABLE public.channel_secrets ENABLE ROW LEVEL SECURITY;
-- No policies: only trusted server code can read or write channel credentials.