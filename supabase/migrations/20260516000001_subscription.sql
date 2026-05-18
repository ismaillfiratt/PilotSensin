-- ─────────────────────────────────────────────────────────────────────────────
-- Abonelik / Deneme Süresi Alanları
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS trial_starts_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_ends_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_premium      BOOLEAN NOT NULL DEFAULT FALSE;

-- Mevcut şirketleri premium işaretle (sisteme önceden kayıt olmuş kullanıcılar kilitlenmesin)
UPDATE public.companies
SET
  trial_starts_at = created_at,
  trial_ends_at   = created_at + INTERVAL '7 days',
  is_premium      = TRUE
WHERE trial_starts_at IS NULL;
