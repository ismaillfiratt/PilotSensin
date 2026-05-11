-- ── Şirketler ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.companies (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  owner_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan        TEXT        NOT NULL DEFAULT 'free',
  max_members INT         NOT NULL DEFAULT 3,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "companies_member_read" ON public.companies
  FOR SELECT USING (
    id IN (
      SELECT company_id FROM public.company_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "companies_owner_write" ON public.companies
  FOR ALL USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- ── Üyeler ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.company_members (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  email       TEXT        NOT NULL,
  role        TEXT        NOT NULL DEFAULT 'copilot' CHECK (role IN ('pilot','copilot')),
  status      TEXT        NOT NULL DEFAULT 'active'  CHECK (status IN ('active','inactive')),
  invited_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  joined_at   TIMESTAMPTZ
);

ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members_company_read" ON public.company_members
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM public.company_members cm2
      WHERE cm2.user_id = auth.uid() AND cm2.status = 'active'
    )
  );

CREATE POLICY "members_owner_write" ON public.company_members
  FOR ALL USING (
    company_id IN (
      SELECT id FROM public.companies WHERE owner_id = auth.uid()
    )
  );

-- ── Davetler ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.invitations (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  email       TEXT        NOT NULL,
  role        TEXT        NOT NULL DEFAULT 'copilot' CHECK (role IN ('pilot','copilot')),
  token       TEXT        NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by  UUID        NOT NULL REFERENCES auth.users(id),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
  accepted_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Davet sahibi yönetebilir
CREATE POLICY "invitations_owner" ON public.invitations
  FOR ALL USING (
    company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid())
  );

-- Token ile herkes okuyabilir (kabul akışı)
CREATE POLICY "invitations_token_read" ON public.invitations
  FOR SELECT USING (true);

-- ── Şirket veri deposu ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.company_store (
  company_id        UUID PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
  nakit_islemler    JSONB NOT NULL DEFAULT '[]',
  gorevler          JSONB NOT NULL DEFAULT '[]',
  stok_urunler      JSONB NOT NULL DEFAULT '[]',
  prosedurler       JSONB NOT NULL DEFAULT '[]',
  checklist_items   JSONB NOT NULL DEFAULT '[]',
  acil_fon_hedefler JSONB NOT NULL DEFAULT '[]',
  acil_fon_islemler JSONB NOT NULL DEFAULT '[]',
  isletme_giderleri JSONB NOT NULL DEFAULT '[]'
);

ALTER TABLE public.company_store ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_store_member" ON public.company_store
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM public.company_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

ALTER PUBLICATION supabase_realtime ADD TABLE public.company_store;
ALTER PUBLICATION supabase_realtime ADD TABLE public.company_members;
