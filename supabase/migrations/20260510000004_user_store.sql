-- ═══════════════════════════════════════════════════════════
-- user_store — tüm kullanıcı verisi tek tabloda JSONB olarak
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_store (
  user_id               UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nakit_islemler        JSONB       NOT NULL DEFAULT '[]',
  gorevler              JSONB       NOT NULL DEFAULT '[]',
  stok_urunler          JSONB       NOT NULL DEFAULT '[]',
  bildirimler           JSONB       NOT NULL DEFAULT '[]',
  prosedurler           JSONB       NOT NULL DEFAULT '[]',
  checklist_items       JSONB       NOT NULL DEFAULT '[]',
  acil_fon_hedefler     JSONB       NOT NULL DEFAULT '[]',
  acil_fon_islemler     JSONB       NOT NULL DEFAULT '[]',
  isletme_giderleri     JSONB       NOT NULL DEFAULT '[]',
  guncelleme_tarihi     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_store ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_store_policy" ON user_store
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_store_user ON user_store(user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE user_store;

-- ── Eski tabloları kaldır ────────────────────────────────────
DROP TABLE IF EXISTS nakit_islemler   CASCADE;
DROP TABLE IF EXISTS gorevler         CASCADE;
DROP TABLE IF EXISTS stok_urunler     CASCADE;
DROP TABLE IF EXISTS bildirimler      CASCADE;
DROP TABLE IF EXISTS prosedurler      CASCADE;
DROP TABLE IF EXISTS checklist_items  CASCADE;
DROP TABLE IF EXISTS acil_fon_islemler CASCADE;
DROP TABLE IF EXISTS acil_fon_hedefler CASCADE;
DROP TABLE IF EXISTS isletme_giderleri CASCADE;
