-- ═══════════════════════════════════════════════════════════════
-- Nakit Akışı: Planlanan Kalemler
-- company_store ve user_store'a nakit_planlanan JSONB kolonu ekle
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.company_store
  ADD COLUMN IF NOT EXISTS nakit_planlanan    JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS nakit_tekrarlayan  JSONB NOT NULL DEFAULT '[]';

ALTER TABLE public.user_store
  ADD COLUMN IF NOT EXISTS nakit_planlanan    JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS nakit_tekrarlayan  JSONB NOT NULL DEFAULT '[]';

-- GRANT (yeni kolonlar için ayrıca grant gerekmez — tablo grantu yeterli)
-- Var olan GRANT ifadeleri (20260513000001) tüm kolonları kapsar.
