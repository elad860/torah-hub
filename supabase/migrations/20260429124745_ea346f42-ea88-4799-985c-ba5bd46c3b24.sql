
-- Revoke direct execution of internal SECURITY DEFINER functions from public/auth roles
-- They will still be callable from inside RLS policies and triggers
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_orders_rate_limit() FROM PUBLIC, anon, authenticated;
