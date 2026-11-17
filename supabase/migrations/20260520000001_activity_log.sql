-- ─────────────────────────────────────────────────────────────────────────────
-- Activity Log — kullanıcı ve şirket aktivite kaydı (audit trail)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.activity_log (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id)       ON DELETE CASCADE,
  company_id       UUID                    REFERENCES public.companies(id) ON DELETE CASCADE,
  modul            TEXT        NOT NULL,
  eylem            TEXT        NOT NULL,
  ozet             TEXT        NOT NULL,
  meta             JSONB,
  olusturma_tarih  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- İndeksler
CREATE INDEX IF NOT EXISTS activity_log_user_date_idx
  ON public.activity_log (user_id, olusturma_tarih DESC);

CREATE INDEX IF NOT EXISTS activity_log_company_date_idx
  ON public.activity_log (company_id, olusturma_tarih DESC);

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Kullanıcı kendi kayıtlarını okur
CREATE POLICY "activity_log_self_read"
  ON public.activity_log FOR SELECT
  USING (user_id = auth.uid());

-- Aynı şirketteki üyeler birbirinin aktivitelerini okur
CREATE POLICY "activity_log_company_read"
  ON public.activity_log FOR SELECT
  USING (
    company_id IS NOT NULL AND
    company_id IN (
      SELECT company_id
      FROM public.company_members
      WHERE user_id = auth.uid()
        AND status = 'active'
    )
  );

-- Kullanıcı yalnızca kendisi adına kayıt oluşturabilir
CREATE POLICY "activity_log_self_insert"
  ON public.activity_log FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE ve DELETE yasak — audit log değiştirilemez
