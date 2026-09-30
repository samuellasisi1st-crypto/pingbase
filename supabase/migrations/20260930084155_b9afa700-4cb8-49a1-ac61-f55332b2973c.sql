REVOKE EXECUTE ON FUNCTION public.public_store(text) FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.public_store(text) TO service_role;