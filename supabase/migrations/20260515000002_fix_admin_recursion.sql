-- ─────────────────────────────────────────────────────────────────────────────
-- Infinite recursion düzeltmesi
-- profiles tablosundaki policy, profiles tablosunu subquery ile okuyunca
-- Postgres sonsuz döngüye giriyor.
-- Çözüm: SECURITY DEFINER fonksiyon → RLS'yi bypass ederek system_admin okur.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Sorunlu recursive policy'yi kaldır
DROP POLICY IF EXISTS "admin_profiles_read" ON public.profiles;

-- 2. SECURITY DEFINER fonksiyon — RLS bypass ederek kendi profilinden system_admin okur
CREATE OR REPLACE FUNCTION public.is_system_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(system_admin, FALSE)
  FROM public.profiles
  WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.is_system_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_system_admin() TO service_role;

-- 3. Profiles admin policy — artık fonksiyonu kullanıyor (recursion yok)
CREATE POLICY "admin_profiles_read" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.is_system_admin());

-- 4. Diğer tablolardaki admin policy'leri de fonksiyona geçir (aynı riski taşıyorlardı)
DROP POLICY IF EXISTS "sysnotif_insert"       ON public.system_notifications;
DROP POLICY IF EXISTS "adminlog_all"           ON public.admin_logs;
DROP POLICY IF EXISTS "admin_companies_read"   ON public.companies;
DROP POLICY IF EXISTS "admin_members_read"     ON public.company_members;

CREATE POLICY "sysnotif_insert" ON public.system_notifications
  FOR INSERT TO authenticated
  WITH CHECK (public.is_system_admin());

CREATE POLICY "adminlog_all" ON public.admin_logs
  FOR ALL TO authenticated
  USING  (public.is_system_admin())
  WITH CHECK (public.is_system_admin());

CREATE POLICY "admin_companies_read" ON public.companies
  FOR SELECT TO authenticated
  USING (public.is_system_admin());

CREATE POLICY "admin_members_read" ON public.company_members
  FOR SELECT TO authenticated
  USING (public.is_system_admin());
