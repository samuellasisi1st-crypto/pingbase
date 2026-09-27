REVOKE EXECUTE ON FUNCTION public.is_workspace_member(UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;