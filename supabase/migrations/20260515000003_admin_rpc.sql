-- Admin kullanıcıların diğer profilleri güncelleyebilmesi için
-- SECURITY DEFINER fonksiyon (RLS bypass ile sistem admin yetkisi verir/kaldırır)

CREATE OR REPLACE FUNCTION public.set_system_admin(hedef_email TEXT, admin_deger BOOLEAN)
RETURNS JSONB
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  guncel_profil profiles%ROWTYPE;
BEGIN
  -- Çağıranın system_admin olduğunu doğrula
  IF NOT (SELECT COALESCE(system_admin, FALSE) FROM profiles WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'Yetkisiz erişim: system_admin değilsiniz';
  END IF;

  -- Hedef profili güncelle
  UPDATE profiles
  SET system_admin = admin_deger
  WHERE email = hedef_email
  RETURNING * INTO guncel_profil;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bu e-posta adresine ait kullanıcı bulunamadı: %', hedef_email;
  END IF;

  RETURN jsonb_build_object(
    'email',        guncel_profil.email,
    'system_admin', guncel_profil.system_admin
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_system_admin(TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_system_admin(TEXT, BOOLEAN) TO service_role;
