ALTER TABLE public.workspaces ADD COLUMN IF NOT EXISTS onboarded_at timestamptz;
UPDATE public.workspaces SET onboarded_at = now() WHERE id = '11111111-1111-1111-1111-111111111111';