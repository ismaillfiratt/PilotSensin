-- ═══════════════════════════════════════════════════════════════════════
-- Supabase Data API Erişim İzinleri
-- 30 Mayıs 2026'dan itibaren yeni projelerde zorunlu hale gelen
-- explicit GRANT ifadeleri ekleniyor.
-- Kaynak: Supabase e-posta bildirimi & PostgREST 42501 hatası önlemi
-- ═══════════════════════════════════════════════════════════════════════

-- ── user_store ──────────────────────────────────────────────────────────
-- Kullanıcı başına tüm uygulama verisi (JSONB). RLS: auth.uid() = user_id
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_store TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_store TO service_role;

-- ── profiles ────────────────────────────────────────────────────────────
-- Google OAuth ve e-posta kayıtları. RLS: auth.uid() = id
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO service_role;

-- ── companies ───────────────────────────────────────────────────────────
-- Şirket kaydı. RLS: owner_id = auth.uid() veya aktif üye
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO service_role;

-- ── company_members ─────────────────────────────────────────────────────
-- Şirkete bağlı kullanıcılar ve rolleri. RLS: aynı şirketteki üyeler okuyabilir
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_members TO service_role;

-- ── company_store ───────────────────────────────────────────────────────
-- Şirket geneli paylaşılan veri deposu (JSONB). RLS: aktif üye
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_store TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_store TO service_role;

-- ── invitations ─────────────────────────────────────────────────────────
-- Davet linkleri. anon okuma: token ile davet kabul akışı için gerekli.
-- RLS: owner yönetebilir, token READ herkese açık
GRANT SELECT                         ON public.invitations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invitations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invitations TO service_role;

-- ── company_roles ───────────────────────────────────────────────────────
-- Özel rol tanımları. RLS: üye okuyabilir, owner yazabilir
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_roles TO service_role;

-- ── RPC fonksiyonları (supabase-js rpc() ile çağrılanlar) ───────────────
-- get_my_company_id: RLS politikalarında ve istemcide kullanılıyor
GRANT EXECUTE ON FUNCTION public.get_my_company_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_company_id() TO service_role;

-- ── Sequence izinleri (UUID tabloları için gerekli değil; text PK varsa da)
-- UUID primary key olan tablolar için gerekli değil,
-- ancak ileride serial/sequence kullanılırsa:
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
