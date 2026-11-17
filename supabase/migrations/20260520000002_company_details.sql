-- ─────────────────────────────────────────────────────────────────────────────
-- companies tablosuna işletme detay kolonları
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS sector         TEXT,
  ADD COLUMN IF NOT EXISTS tax_no         TEXT,
  ADD COLUMN IF NOT EXISTS tax_office     TEXT,
  ADD COLUMN IF NOT EXISTS address_line   TEXT,
  ADD COLUMN IF NOT EXISTS neighborhood   TEXT,
  ADD COLUMN IF NOT EXISTS district       TEXT,
  ADD COLUMN IF NOT EXISTS city           TEXT,
  ADD COLUMN IF NOT EXISTS postal_code    TEXT,
  ADD COLUMN IF NOT EXISTS iban           TEXT,
  ADD COLUMN IF NOT EXISTS e_invoice_type TEXT    DEFAULT 'yok',
  ADD COLUMN IF NOT EXISTS vat_payer      BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS employee_range TEXT    DEFAULT '1-5',
  ADD COLUMN IF NOT EXISTS website        TEXT,
  ADD COLUMN IF NOT EXISTS contact_email  TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone  TEXT,
  ADD COLUMN IF NOT EXISTS logo_url       TEXT;

-- UPDATE policy: pilot rolündeki aktif üye güncelleyebilir
-- (companies_owner_write ALL policy'si owner için zaten geçerli)
CREATE POLICY "companies_pilot_update"
  ON public.companies FOR UPDATE
  USING (
    id IN (
      SELECT company_id FROM public.company_members
      WHERE user_id = auth.uid()
        AND role    = 'pilot'
        AND status  = 'active'
    )
  )
  WITH CHECK (
    id IN (
      SELECT company_id FROM public.company_members
      WHERE user_id = auth.uid()
        AND role    = 'pilot'
        AND status  = 'active'
    )
  );
