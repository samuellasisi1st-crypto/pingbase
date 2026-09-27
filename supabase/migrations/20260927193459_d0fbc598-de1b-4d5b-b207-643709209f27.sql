CREATE TABLE public.google_calendar_connections (
  workspace_id uuid PRIMARY KEY,
  google_email text,
  refresh_token text NOT NULL,
  access_token text,
  access_token_expires_at timestamptz,
  status text NOT NULL DEFAULT 'CONNECTED',
  last_error text,
  connected_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.google_calendar_connections TO service_role;
ALTER TABLE public.google_calendar_connections ENABLE ROW LEVEL SECURITY;