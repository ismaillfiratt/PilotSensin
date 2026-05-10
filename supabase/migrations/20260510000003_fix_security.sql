-- ═══════════════════════════════════════════════════════
-- Güvenlik düzeltmeleri — Supabase Advisor uyarıları
-- ═══════════════════════════════════════════════════════

-- "Business" ve "User" tabloları artık kullanılmıyor
-- (uygulama Supabase Auth + user_metadata kullanıyor)
-- Güvenli silme: önce FK kısıtlamasını kaldır, sonra tablolar

ALTER TABLE IF EXISTS "User" DROP CONSTRAINT IF EXISTS "User_businessId_fkey";
DROP TABLE IF EXISTS "User" CASCADE;
DROP TABLE IF EXISTS "Business" CASCADE;
DROP TYPE  IF EXISTS "Role" CASCADE;
