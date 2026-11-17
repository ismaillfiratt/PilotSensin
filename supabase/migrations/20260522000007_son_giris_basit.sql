-- Eski fonksiyonu temizle
DROP FUNCTION IF EXISTS public.get_ekip_uyeleri_zenginlestirilmis(uuid);

-- Sadece last_sign_in_at ve full_name dönen basit RPC
CREATE OR REPLACE FUNCTION public.get_uye_zenginlestirme(user_ids uuid[])
RETURNS TABLE(
  user_id         uuid,
  last_sign_in_at timestamptz,
  full_name       text
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Yetkisiz' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    u.id                                       AS user_id,
    u.last_sign_in_at,
    (u.raw_user_meta_data->>'full_name')::text AS full_name
  FROM auth.users u
  WHERE u.id = ANY(user_ids)
    AND EXISTS (
      SELECT 1 FROM company_members cm1
      JOIN company_members cm2 ON cm1.company_id = cm2.company_id
      WHERE cm1.user_id = u.id
        AND cm2.user_id = auth.uid()
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_uye_zenginlestirme(uuid[]) TO authenticated;
