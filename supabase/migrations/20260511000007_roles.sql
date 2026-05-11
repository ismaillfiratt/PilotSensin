-- ── Özel roller tablosu ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.company_roles (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID    NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name        TEXT    NOT NULL,
  is_owner    BOOLEAN NOT NULL DEFAULT false,
  permissions JSONB   NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.company_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "roles_member_read" ON public.company_roles
  FOR SELECT USING (company_id = public.get_my_company_id());

CREATE POLICY "roles_owner_write" ON public.company_roles
  FOR ALL USING (
    company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid())
  );

-- ── company_members güncellemeleri ─────────────────────────────────────
ALTER TABLE public.company_members
  ADD COLUMN IF NOT EXISTS role_id     UUID REFERENCES public.company_roles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS permissions JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS full_name   TEXT;

-- Status constraint güncelle (pending + suspended ekle)
ALTER TABLE public.company_members DROP CONSTRAINT IF EXISTS company_members_status_check;
ALTER TABLE public.company_members ADD CONSTRAINT company_members_status_check
  CHECK (status IN ('active','inactive','pending','suspended'));

-- Mevcut 'inactive' satırları 'suspended' olarak güncelle (isteğe bağlı)
-- UPDATE public.company_members SET status = 'suspended' WHERE status = 'inactive';
