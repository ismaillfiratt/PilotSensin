-- =====================================================================
-- ADIM 1 Para Birimi Göçü: TL float → Kuruş (×100)
-- Tarih: 2026-05-17
-- Kapsam: user_store + company_store tablolarındaki JSONB para alanları
--
-- UYARI: Bu scripti Supabase Dashboard > SQL Editor'da çalıştırın.
--        Önce KONTROL bölümünü çalıştırın, değerlerin TL cinsinden
--        olduğunu doğrulayın, sonra MIGRATION bölümünü çalıştırın.
--        Migrate edilmiş bir veritabanında tekrar çalıştırmayın!
-- =====================================================================


-- =====================================================================
-- BÖLÜM 1: KONTROL — Önce bunu çalıştırın
-- Değerler "makul TL tutarı" gibi görünüyorsa (100, 500, 1500 gibi)
-- → TL cinsinden, göç gerekli
-- Değerler "100 katı" büyükse (10000, 50000, 150000 gibi)
-- → Zaten kuruş, MIGRATION bölümünü ÇALIŞTIRMAYIN
-- =====================================================================

SELECT
  'user_store' AS tablo,
  user_id,
  (nakit_islemler -> 0 ->> 'tutar')::numeric          AS nakit_ilk_tutar,
  (satislar       -> 0 ->> 'toplamCiro')::numeric      AS satis_ilk_ciro,
  (acil_fon_islemler -> 0 ->> 'tutar')::numeric        AS fon_ilk_tutar,
  (isletme_giderleri -> 0 ->> 'tutar')::numeric        AS gider_ilk_tutar,
  (nakit_planlanan   -> 0 ->> 'tutar')::numeric        AS planlanan_ilk_tutar
FROM user_store
WHERE nakit_islemler IS NOT NULL
   OR satislar IS NOT NULL
   OR acil_fon_islemler IS NOT NULL
LIMIT 10;

SELECT
  'company_store' AS tablo,
  company_id,
  (nakit_islemler -> 0 ->> 'tutar')::numeric          AS nakit_ilk_tutar,
  (satislar       -> 0 ->> 'toplamCiro')::numeric      AS satis_ilk_ciro,
  (acil_fon_islemler -> 0 ->> 'tutar')::numeric        AS fon_ilk_tutar,
  (isletme_giderleri -> 0 ->> 'tutar')::numeric        AS gider_ilk_tutar,
  (nakit_planlanan   -> 0 ->> 'tutar')::numeric        AS planlanan_ilk_tutar
FROM company_store
WHERE nakit_islemler IS NOT NULL
   OR satislar IS NOT NULL
   OR acil_fon_islemler IS NOT NULL
LIMIT 10;


-- =====================================================================
-- BÖLÜM 2: MIGRATION
-- Kontrol sonuçlarına göre TL cinsinden olduğu doğrulanırsa çalıştırın.
-- Her UPDATE bir transaction içinde çalışır; hata olursa otomatik rollback.
-- =====================================================================

BEGIN;

-- ─── 1. nakit_islemler.tutar ×100 ────────────────────────────────────

UPDATE user_store
SET nakit_islemler = (
  SELECT COALESCE(
    jsonb_agg(
      CASE WHEN elem ? 'tutar'
        THEN jsonb_set(elem, '{tutar}',
               to_jsonb(round((elem->>'tutar')::numeric * 100)))
        ELSE elem
      END
    ),
    '[]'::jsonb
  )
  FROM jsonb_array_elements(nakit_islemler) AS elem
)
WHERE nakit_islemler IS NOT NULL
  AND jsonb_array_length(nakit_islemler) > 0;

UPDATE company_store
SET nakit_islemler = (
  SELECT COALESCE(
    jsonb_agg(
      CASE WHEN elem ? 'tutar'
        THEN jsonb_set(elem, '{tutar}',
               to_jsonb(round((elem->>'tutar')::numeric * 100)))
        ELSE elem
      END
    ),
    '[]'::jsonb
  )
  FROM jsonb_array_elements(nakit_islemler) AS elem
)
WHERE nakit_islemler IS NOT NULL
  AND jsonb_array_length(nakit_islemler) > 0;


-- ─── 2. stok_urunler.birimMaliyet ×100 ───────────────────────────────

UPDATE user_store
SET stok_urunler = (
  SELECT COALESCE(
    jsonb_agg(
      CASE WHEN elem ? 'birimMaliyet' AND (elem->>'birimMaliyet') IS NOT NULL
        THEN jsonb_set(elem, '{birimMaliyet}',
               to_jsonb(round((elem->>'birimMaliyet')::numeric * 100)))
        ELSE elem
      END
    ),
    '[]'::jsonb
  )
  FROM jsonb_array_elements(stok_urunler) AS elem
)
WHERE stok_urunler IS NOT NULL
  AND jsonb_array_length(stok_urunler) > 0;

UPDATE company_store
SET stok_urunler = (
  SELECT COALESCE(
    jsonb_agg(
      CASE WHEN elem ? 'birimMaliyet' AND (elem->>'birimMaliyet') IS NOT NULL
        THEN jsonb_set(elem, '{birimMaliyet}',
               to_jsonb(round((elem->>'birimMaliyet')::numeric * 100)))
        ELSE elem
      END
    ),
    '[]'::jsonb
  )
  FROM jsonb_array_elements(stok_urunler) AS elem
)
WHERE stok_urunler IS NOT NULL
  AND jsonb_array_length(stok_urunler) > 0;


-- ─── 3. acil_fon_hedefler.toplamHedef + aylikOdeme ×100 ──────────────

UPDATE user_store
SET acil_fon_hedefler = (
  SELECT COALESCE(
    jsonb_agg(
      jsonb_set(
        jsonb_set(elem,
          '{toplamHedef}', to_jsonb(round((elem->>'toplamHedef')::numeric * 100))),
        '{aylikOdeme}',   to_jsonb(round((elem->>'aylikOdeme')::numeric  * 100))
      )
    ),
    '[]'::jsonb
  )
  FROM jsonb_array_elements(acil_fon_hedefler) AS elem
)
WHERE acil_fon_hedefler IS NOT NULL
  AND jsonb_array_length(acil_fon_hedefler) > 0;

UPDATE company_store
SET acil_fon_hedefler = (
  SELECT COALESCE(
    jsonb_agg(
      jsonb_set(
        jsonb_set(elem,
          '{toplamHedef}', to_jsonb(round((elem->>'toplamHedef')::numeric * 100))),
        '{aylikOdeme}',   to_jsonb(round((elem->>'aylikOdeme')::numeric  * 100))
      )
    ),
    '[]'::jsonb
  )
  FROM jsonb_array_elements(acil_fon_hedefler) AS elem
)
WHERE acil_fon_hedefler IS NOT NULL
  AND jsonb_array_length(acil_fon_hedefler) > 0;


-- ─── 4. acil_fon_islemler.tutar ×100 ─────────────────────────────────

UPDATE user_store
SET acil_fon_islemler = (
  SELECT COALESCE(
    jsonb_agg(
      jsonb_set(elem, '{tutar}',
        to_jsonb(round((elem->>'tutar')::numeric * 100)))
    ),
    '[]'::jsonb
  )
  FROM jsonb_array_elements(acil_fon_islemler) AS elem
)
WHERE acil_fon_islemler IS NOT NULL
  AND jsonb_array_length(acil_fon_islemler) > 0;

UPDATE company_store
SET acil_fon_islemler = (
  SELECT COALESCE(
    jsonb_agg(
      jsonb_set(elem, '{tutar}',
        to_jsonb(round((elem->>'tutar')::numeric * 100)))
    ),
    '[]'::jsonb
  )
  FROM jsonb_array_elements(acil_fon_islemler) AS elem
)
WHERE acil_fon_islemler IS NOT NULL
  AND jsonb_array_length(acil_fon_islemler) > 0;


-- ─── 5. isletme_giderleri.tutar ×100 ─────────────────────────────────

UPDATE user_store
SET isletme_giderleri = (
  SELECT COALESCE(
    jsonb_agg(
      jsonb_set(elem, '{tutar}',
        to_jsonb(round((elem->>'tutar')::numeric * 100)))
    ),
    '[]'::jsonb
  )
  FROM jsonb_array_elements(isletme_giderleri) AS elem
)
WHERE isletme_giderleri IS NOT NULL
  AND jsonb_array_length(isletme_giderleri) > 0;

UPDATE company_store
SET isletme_giderleri = (
  SELECT COALESCE(
    jsonb_agg(
      jsonb_set(elem, '{tutar}',
        to_jsonb(round((elem->>'tutar')::numeric * 100)))
    ),
    '[]'::jsonb
  )
  FROM jsonb_array_elements(isletme_giderleri) AS elem
)
WHERE isletme_giderleri IS NOT NULL
  AND jsonb_array_length(isletme_giderleri) > 0;


-- ─── 6. nakit_planlanan.tutar ×100 ───────────────────────────────────

UPDATE user_store
SET nakit_planlanan = (
  SELECT COALESCE(
    jsonb_agg(
      jsonb_set(elem, '{tutar}',
        to_jsonb(round((elem->>'tutar')::numeric * 100)))
    ),
    '[]'::jsonb
  )
  FROM jsonb_array_elements(nakit_planlanan) AS elem
)
WHERE nakit_planlanan IS NOT NULL
  AND jsonb_array_length(nakit_planlanan) > 0;

UPDATE company_store
SET nakit_planlanan = (
  SELECT COALESCE(
    jsonb_agg(
      jsonb_set(elem, '{tutar}',
        to_jsonb(round((elem->>'tutar')::numeric * 100)))
    ),
    '[]'::jsonb
  )
  FROM jsonb_array_elements(nakit_planlanan) AS elem
)
WHERE nakit_planlanan IS NOT NULL
  AND jsonb_array_length(nakit_planlanan) > 0;


-- ─── 7. nakit_tekrarlayan.tutar ×100 ─────────────────────────────────

UPDATE user_store
SET nakit_tekrarlayan = (
  SELECT COALESCE(
    jsonb_agg(
      jsonb_set(elem, '{tutar}',
        to_jsonb(round((elem->>'tutar')::numeric * 100)))
    ),
    '[]'::jsonb
  )
  FROM jsonb_array_elements(nakit_tekrarlayan) AS elem
)
WHERE nakit_tekrarlayan IS NOT NULL
  AND jsonb_array_length(nakit_tekrarlayan) > 0;

UPDATE company_store
SET nakit_tekrarlayan = (
  SELECT COALESCE(
    jsonb_agg(
      jsonb_set(elem, '{tutar}',
        to_jsonb(round((elem->>'tutar')::numeric * 100)))
    ),
    '[]'::jsonb
  )
  FROM jsonb_array_elements(nakit_tekrarlayan) AS elem
)
WHERE nakit_tekrarlayan IS NOT NULL
  AND jsonb_array_length(nakit_tekrarlayan) > 0;


-- ─── 8. satislar — 7 para alanı ×100 ─────────────────────────────────
-- birimSatisFiyati, birimAlisFiyati, birimKar, toplamCiro, brutKar,
-- kdvTutari, kasaGiris

UPDATE user_store
SET satislar = (
  SELECT COALESCE(
    jsonb_agg(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(
              jsonb_set(
                jsonb_set(
                  jsonb_set(elem,
                    '{birimSatisFiyati}', to_jsonb(round((elem->>'birimSatisFiyati')::numeric * 100))),
                  '{birimAlisFiyati}',   to_jsonb(round((elem->>'birimAlisFiyati')::numeric   * 100))),
                '{birimKar}',            to_jsonb(round((elem->>'birimKar')::numeric           * 100))),
              '{toplamCiro}',            to_jsonb(round((elem->>'toplamCiro')::numeric         * 100))),
            '{brutKar}',                 to_jsonb(round((elem->>'brutKar')::numeric            * 100))),
          '{kdvTutari}',                 to_jsonb(round((elem->>'kdvTutari')::numeric          * 100))),
        '{kasaGiris}',                   to_jsonb(round((elem->>'kasaGiris')::numeric          * 100))
      )
    ),
    '[]'::jsonb
  )
  FROM jsonb_array_elements(satislar) AS elem
)
WHERE satislar IS NOT NULL
  AND jsonb_array_length(satislar) > 0;

UPDATE company_store
SET satislar = (
  SELECT COALESCE(
    jsonb_agg(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(
              jsonb_set(
                jsonb_set(
                  jsonb_set(elem,
                    '{birimSatisFiyati}', to_jsonb(round((elem->>'birimSatisFiyati')::numeric * 100))),
                  '{birimAlisFiyati}',   to_jsonb(round((elem->>'birimAlisFiyati')::numeric   * 100))),
                '{birimKar}',            to_jsonb(round((elem->>'birimKar')::numeric           * 100))),
              '{toplamCiro}',            to_jsonb(round((elem->>'toplamCiro')::numeric         * 100))),
            '{brutKar}',                 to_jsonb(round((elem->>'brutKar')::numeric            * 100))),
          '{kdvTutari}',                 to_jsonb(round((elem->>'kdvTutari')::numeric          * 100))),
        '{kasaGiris}',                   to_jsonb(round((elem->>'kasaGiris')::numeric          * 100))
      )
    ),
    '[]'::jsonb
  )
  FROM jsonb_array_elements(satislar) AS elem
)
WHERE satislar IS NOT NULL
  AND jsonb_array_length(satislar) > 0;


COMMIT;


-- =====================================================================
-- BÖLÜM 3: DOĞRULAMA — Migration sonrası çalıştırın
-- =====================================================================

SELECT
  'user_store (migrated)' AS tablo,
  (nakit_islemler -> 0 ->> 'tutar')::numeric          AS nakit_ilk_tutar,
  (satislar       -> 0 ->> 'toplamCiro')::numeric      AS satis_ilk_ciro,
  (acil_fon_islemler -> 0 ->> 'tutar')::numeric        AS fon_ilk_tutar,
  (isletme_giderleri -> 0 ->> 'tutar')::numeric        AS gider_ilk_tutar
FROM user_store
WHERE nakit_islemler IS NOT NULL
   OR satislar IS NOT NULL
LIMIT 10;

SELECT
  'company_store (migrated)' AS tablo,
  (nakit_islemler -> 0 ->> 'tutar')::numeric          AS nakit_ilk_tutar,
  (satislar       -> 0 ->> 'toplamCiro')::numeric      AS satis_ilk_ciro,
  (acil_fon_islemler -> 0 ->> 'tutar')::numeric        AS fon_ilk_tutar,
  (isletme_giderleri -> 0 ->> 'tutar')::numeric        AS gider_ilk_tutar
FROM company_store
WHERE nakit_islemler IS NOT NULL
   OR satislar IS NOT NULL
LIMIT 10;

-- Doğrulama sonuçları: KONTROL bölümündeki değerlerin tam 100 katı olmalı.
-- Örnek: nakit_ilk_tutar KONTROL'de 500 idi → şimdi 50000 olmalı.
