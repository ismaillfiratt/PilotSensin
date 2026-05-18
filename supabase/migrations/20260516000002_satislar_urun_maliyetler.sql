-- ═══════════════════════════════════════════════════════════════
-- Satışlar ve Ürün Maliyet Kayıtları
-- user_store ve company_store'a yeni JSONB kolonlar ekle
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.user_store
  ADD COLUMN IF NOT EXISTS satislar        JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS urun_maliyetler JSONB NOT NULL DEFAULT '[]';

ALTER TABLE public.company_store
  ADD COLUMN IF NOT EXISTS satislar        JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS urun_maliyetler JSONB NOT NULL DEFAULT '[]';
