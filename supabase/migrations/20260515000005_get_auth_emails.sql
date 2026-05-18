-- auth.users tablosundan email çeken SECURITY DEFINER fonksiyon
-- (profiles tablosunda kaydı olmayan kullanıcılar için)
CREATE OR REPLACE FUNCTION public.get_auth_user_emails(user_ids UUID[])
RETURNS TABLE(id UUID, email TEXT)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT id, email FROM auth.users WHERE id = ANY(user_ids);
$$;

GRANT EXECUTE ON FUNCTION public.get_auth_user_emails(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_auth_user_emails(UUID[]) TO service_role;
