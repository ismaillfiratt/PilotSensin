-- Çöp kutusu 30 günlük otomatik temizlik — pg_cron ile
-- pg_cron aktif değilse sessizce atlar

DO $outer$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    RETURN;
  END IF;

  -- Mevcut cron'u kaldır (varsa)
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cop-temizle') THEN
    PERFORM cron.unschedule('cop-temizle');
  END IF;

  -- Her gece 03:00 UTC'de cop-temizle edge function'ını çağır
  PERFORM cron.schedule(
    'cop-temizle',
    '0 3 * * *',
    'SELECT net.http_post(url := ''https://<PROJE_REF>.functions.supabase.co/cop-temizle'', headers := jsonb_build_object(''Content-Type'', ''application/json'', ''Authorization'', ''Bearer <SUPABASE_SERVICE_ROLE_KEY>''), body := ''{}''::jsonb);'
  );
END;
$outer$;
