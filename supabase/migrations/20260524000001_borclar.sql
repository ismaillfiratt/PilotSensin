-- ═══════════════════════════════════════════════════════════════
-- BORÇLAR — Vadeli ve taksitli ödeme takibi
--
-- user_store ve company_store'a borclar JSONB kolonu ekler.
-- Her borç içinde taksitler nested olarak tutulur:
--
-- borclar: [
--   {
--     id: "uuid",
--     kaynak: "alim" | "manuel" | "vergi" | "kira",
--     kaynakId: "alimYap_islemId",   -- alim ise alimYap'in islemId'si
--     aciklama: "Bardak alımı — 100 adet",
--     toplamTutarKurus: 50000,
--     paraBirimi: "TRY",
--     olusturmaTarihi: "2026-05-24T...",
--     silindiAt: null,                 -- soft delete (null = aktif)
--     taksitler: [
--       {
--         id: "uuid",
--         siraNo: 1,
--         tutarKurus: 10000,
--         vadeTarihi: "2026-06-24",
--         odendiAt: null,              -- null = bekliyor
--         nakitIslemId: null,          -- ödendiğinde nakit kaydının id'si
--       },
--       ...
--     ]
--   }
-- ]
--
-- Soft-delete pattern: silindiAt = null aktif, dolu silinmiş.
-- Bu migration GERİ DÖNÜK UYUMLU — mevcut veriye zarar vermez.
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.user_store
  ADD COLUMN IF NOT EXISTS borclar JSONB NOT NULL DEFAULT '[]';

ALTER TABLE public.company_store
  ADD COLUMN IF NOT EXISTS borclar JSONB NOT NULL DEFAULT '[]';

-- GRANT (yeni kolonlar için ayrıca grant gerekmez — tablo grantu yeterli)
-- Var olan GRANT ifadeleri (20260513000001) tüm kolonları kapsar.
-- Realtime publication da tablo bazında olduğu için yeni kolon otomatik dahil.
