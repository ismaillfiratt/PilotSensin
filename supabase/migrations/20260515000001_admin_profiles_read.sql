-- Admin kullanıcıların tüm profilleri okuyabilmesine izin ver
-- (Companies JOIN profiles query için gerekli — RLS blokunu çözer)
CREATE POLICY "admin_profiles_read" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    (SELECT p.system_admin FROM public.profiles p WHERE p.id = auth.uid())
  );
