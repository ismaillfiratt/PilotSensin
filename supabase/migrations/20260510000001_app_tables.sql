-- ═══════════════════════════════════════════════════════════
-- Pilot Sensin — Uygulama Tabloları
-- Her tablo user_id ile auth.users'a bağlıdır (RLS aktif)
-- ═══════════════════════════════════════════════════════════

-- ── Nakit İşlemler ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nakit_islemler (
  id              TEXT        PRIMARY KEY,
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tip             TEXT        NOT NULL CHECK (tip IN ('gelir', 'gider')),
  tutar           NUMERIC     NOT NULL,
  kategori        TEXT        NOT NULL DEFAULT '',
  aciklama        TEXT        NOT NULL DEFAULT '',
  tarih           TIMESTAMPTZ NOT NULL,
  odeme_yontemi   TEXT        NOT NULL DEFAULT 'nakit',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE nakit_islemler ENABLE ROW LEVEL SECURITY;
CREATE POLICY "nakit_islemler_policy" ON nakit_islemler
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_nakit_islemler_user ON nakit_islemler(user_id);

-- ── Görevler ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gorevler (
  id              TEXT        PRIMARY KEY,
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  baslik          TEXT        NOT NULL,
  aciklama        TEXT        NOT NULL DEFAULT '',
  sorumlu         TEXT        NOT NULL DEFAULT '',
  son_tarih       TIMESTAMPTZ NOT NULL,
  oncelik         TEXT        NOT NULL DEFAULT 'normal',
  durum           TEXT        NOT NULL DEFAULT 'yapilacak',
  olusturma_tarih TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE gorevler ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gorevler_policy" ON gorevler
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_gorevler_user ON gorevler(user_id);

-- ── Stok Ürünler ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stok_urunler (
  id              TEXT        PRIMARY KEY,
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ad              TEXT        NOT NULL,
  sku             TEXT        NOT NULL DEFAULT '',
  kategori        TEXT        NOT NULL DEFAULT '',
  mevcut_adet     NUMERIC     NOT NULL DEFAULT 0,
  emniyet_stogu   NUMERIC     NOT NULL DEFAULT 0,
  kritik_stok     NUMERIC     NOT NULL DEFAULT 0,
  gunluk_satis    NUMERIC     NOT NULL DEFAULT 0,
  birim           TEXT        NOT NULL DEFAULT 'adet',
  son_hareket     TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE stok_urunler ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stok_urunler_policy" ON stok_urunler
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_stok_urunler_user ON stok_urunler(user_id);

-- ── Bildirimler ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bildirimler (
  id        TEXT        PRIMARY KEY,
  user_id   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  baslik    TEXT        NOT NULL,
  mesaj     TEXT        NOT NULL,
  tip       TEXT        NOT NULL,
  modul     TEXT        NOT NULL,
  tarih     TIMESTAMPTZ NOT NULL,
  okundu    BOOLEAN     NOT NULL DEFAULT FALSE
);
ALTER TABLE bildirimler ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bildirimler_policy" ON bildirimler
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_bildirimler_user ON bildirimler(user_id);

-- ── Prosedürler ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prosedurler (
  id              TEXT        PRIMARY KEY,
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  baslik          TEXT        NOT NULL,
  kategori        TEXT        NOT NULL DEFAULT '',
  aciklama        TEXT        NOT NULL DEFAULT '',
  adimlar         JSONB       NOT NULL DEFAULT '[]',
  sorumlu         TEXT        NOT NULL DEFAULT '',
  son_guncelleme  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE prosedurler ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prosedurler_policy" ON prosedurler
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_prosedurler_user ON prosedurler(user_id);

-- ── Checklist ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS checklist_items (
  id          TEXT    PRIMARY KEY,
  user_id     UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  baslik      TEXT    NOT NULL,
  kategori    TEXT    NOT NULL DEFAULT '',
  sikligi     TEXT    NOT NULL DEFAULT 'gunluk',
  tamamlandi  BOOLEAN NOT NULL DEFAULT FALSE
);
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "checklist_items_policy" ON checklist_items
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_checklist_user ON checklist_items(user_id);

-- ── Acil Fon Hedefleri ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS acil_fon_hedefler (
  id              TEXT        PRIMARY KEY,
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ad              TEXT        NOT NULL,
  toplam_hedef    NUMERIC     NOT NULL DEFAULT 0,
  aylik_odeme     NUMERIC     NOT NULL DEFAULT 0,
  olusturma_tarih TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE acil_fon_hedefler ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acil_fon_hedefler_policy" ON acil_fon_hedefler
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_acil_fon_hedefler_user ON acil_fon_hedefler(user_id);

-- ── Acil Fon İşlemleri ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS acil_fon_islemler (
  id        TEXT        PRIMARY KEY,
  user_id   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hedef_id  TEXT        REFERENCES acil_fon_hedefler(id) ON DELETE SET NULL,
  tip       TEXT        NOT NULL CHECK (tip IN ('yatirma', 'cekme')),
  tutar     NUMERIC     NOT NULL,
  aciklama  TEXT        NOT NULL DEFAULT '',
  tarih     TIMESTAMPTZ NOT NULL
);
ALTER TABLE acil_fon_islemler ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acil_fon_islemler_policy" ON acil_fon_islemler
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_acil_fon_islemler_user ON acil_fon_islemler(user_id);

-- ── İşletme Giderleri ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS isletme_giderleri (
  id        UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kategori  TEXT    NOT NULL,
  tutar     NUMERIC NOT NULL DEFAULT 0
);
ALTER TABLE isletme_giderleri ENABLE ROW LEVEL SECURITY;
CREATE POLICY "isletme_giderleri_policy" ON isletme_giderleri
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_isletme_giderleri_user ON isletme_giderleri(user_id);

-- ── Realtime ────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE nakit_islemler;
ALTER PUBLICATION supabase_realtime ADD TABLE gorevler;
ALTER PUBLICATION supabase_realtime ADD TABLE stok_urunler;
ALTER PUBLICATION supabase_realtime ADD TABLE bildirimler;
ALTER PUBLICATION supabase_realtime ADD TABLE prosedurler;
ALTER PUBLICATION supabase_realtime ADD TABLE checklist_items;
ALTER PUBLICATION supabase_realtime ADD TABLE acil_fon_hedefler;
ALTER PUBLICATION supabase_realtime ADD TABLE acil_fon_islemler;
ALTER PUBLICATION supabase_realtime ADD TABLE isletme_giderleri;
