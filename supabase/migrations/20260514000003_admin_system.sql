-- profiles'a system_admin ekle
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS system_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- system_notifications tablosu
CREATE TABLE IF NOT EXISTS public.system_notifications (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  baslik      TEXT        NOT NULL,
  mesaj       TEXT        NOT NULL,
  tip         TEXT        NOT NULL CHECK (tip IN ('kritik', 'duyuru', 'guncelleme')),
  hedef       TEXT        NOT NULL CHECK (hedef IN ('tumu', 'pilot', 'copilot')),
  admin_email TEXT,
  olusturma   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.system_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sysnotif_read" ON public.system_notifications
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "sysnotif_insert" ON public.system_notifications
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT system_admin FROM public.profiles WHERE id = auth.uid()));

ALTER PUBLICATION supabase_realtime ADD TABLE public.system_notifications;

-- admin_logs tablosu
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id    UUID        REFERENCES auth.users(id),
  admin_email TEXT,
  islem       TEXT        NOT NULL,
  detay       JSONB,
  olusturma   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "adminlog_all" ON public.admin_logs
  FOR ALL TO authenticated
  USING ((SELECT system_admin FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK ((SELECT system_admin FROM public.profiles WHERE id = auth.uid()));

-- Admin tüm şirketleri ve üyeleri görebilir
CREATE POLICY "admin_companies_read" ON public.companies
  FOR SELECT TO authenticated
  USING ((SELECT system_admin FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "admin_members_read" ON public.company_members
  FOR SELECT TO authenticated
  USING ((SELECT system_admin FROM public.profiles WHERE id = auth.uid()));

-- GRANTs
GRANT SELECT, INSERT ON public.system_notifications TO authenticated;
GRANT SELECT, INSERT ON public.admin_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_notifications TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_logs TO service_role;
