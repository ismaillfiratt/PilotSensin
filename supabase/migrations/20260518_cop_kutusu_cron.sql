-- ============================================================
-- Çöp kutusu 30 günlük otomatik temizlik — pg_cron ile
-- Supabase SQL Editor'da çalıştır
-- ============================================================

-- 1) pg_cron ve pg_net eklentilerinin etkin olduğundan emin ol
--    (Supabase Pro/Team planında varsayılan olarak aktiftir)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2) Mevcut cron'u kaldır (varsa)
SELECT cron.unschedule('cop-temizle') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'cop-temizle'
);

-- 3) Her gece 03:00 UTC'de cop-temizle edge function'ını çağır
SELECT cron.schedule(
  'cop-temizle',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://<PROJE_REF>.functions.supabase.co/cop-temizle',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer <SUPABASE_SERVICE_ROLE_KEY>'
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- 4) Kurulumu doğrula
SELECT jobid, jobname, schedule, command
FROM cron.job
WHERE jobname = 'cop-temizle';

-- ============================================================
-- NOTLAR:
-- • <PROJE_REF>      → Supabase Dashboard > Settings > General > Reference ID
-- • <SERVICE_ROLE_KEY> → Dashboard > Settings > API > service_role (secret)
-- • Edge function dağıtımı: `supabase functions deploy cop-temizle`
-- • Test için: `supabase functions invoke cop-temizle --no-verify-jwt`
-- ============================================================
