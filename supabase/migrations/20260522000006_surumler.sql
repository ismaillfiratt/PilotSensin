-- Sürüm notları tablosu
-- NOT: 20260522000003_superadmin.sql'nin önce uygulanmış olması gerekir (is_superadmin kolonu)
CREATE TABLE IF NOT EXISTS public.app_versions (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  version_string  text        NOT NULL UNIQUE,
  release_date    date        NOT NULL DEFAULT CURRENT_DATE,
  baslik          text        NOT NULL,
  ozet            text,
  maddeler        jsonb       NOT NULL DEFAULT '[]'::jsonb,
  yayinlandi      boolean     NOT NULL DEFAULT false,
  yayin_tarihi    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  created_by      uuid        REFERENCES auth.users
);

ALTER TABLE public.app_versions ENABLE ROW LEVEL SECURITY;

-- SELECT: yayınlanmış herkes görebilir; superadmin taslakları da görür
CREATE POLICY "app_versions_select" ON public.app_versions
  FOR SELECT TO authenticated
  USING (
    yayinlandi = true
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_superadmin = true)
  );

-- INSERT/UPDATE/DELETE: sadece superadmin
CREATE POLICY "app_versions_insert" ON public.app_versions
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_superadmin = true));

CREATE POLICY "app_versions_update" ON public.app_versions
  FOR UPDATE TO authenticated
  USING      (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_superadmin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_superadmin = true));

CREATE POLICY "app_versions_delete" ON public.app_versions
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_superadmin = true));

-- Kullanıcıların gördüğü sürümleri takip eden tablo
CREATE TABLE IF NOT EXISTS public.user_seen_versions (
  user_id    uuid REFERENCES auth.users  ON DELETE CASCADE,
  version_id uuid REFERENCES app_versions ON DELETE CASCADE,
  seen_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, version_id)
);

ALTER TABLE public.user_seen_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kendi_gorulen_versiyonlari" ON public.user_seen_versions
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Mevcut hardcoded sürümleri seed et
INSERT INTO public.app_versions (version_string, release_date, baslik, ozet, maddeler, yayinlandi, yayin_tarihi)
VALUES
  ('v0.9.2', '2026-05-20', 'Mayıs Güncellemesi',
   'Profil, 2FA ve aktivite log sistemi',
   '["Profil sayfası tab/sidebar yapısına geçti","İki faktörlü doğrulama (2FA) desteği eklendi","Aktivite log sistemi devreye alındı","Ayarlar sayfası yeniden tasarlandı","Veri dışa aktarma (JSON / CSV / Excel) eklendi"]'::jsonb,
   true, '2026-05-20 00:00:00+00'),
  ('v0.9.1', '2026-05-01', 'Bahar Güncellemesi',
   'Acil Fon, Görevler ve Stok iyileştirmeleri',
   '["Acil Durum Fonu paneli yeniden düzenlendi","Görevler sayfasına ekip performansı tablosu eklendi","Stok yönetiminde 3 noktalı aksiyon menüsü","Prosedürler bug düzeltmeleri"]'::jsonb,
   true, '2026-05-01 00:00:00+00'),
  ('v0.9.0', '2026-04-01', 'Mercury Tasarım Güncellemesi',
   'Yeni tasarım dili ve temel özellikler',
   '["Mercury editorial tasarım dili tüm sayfalara uygulandı","Pilot Skoru sistemi devreye alındı","Soft-delete ve çöp kutusu eklendi"]'::jsonb,
   true, '2026-04-01 00:00:00+00')
ON CONFLICT (version_string) DO NOTHING;
