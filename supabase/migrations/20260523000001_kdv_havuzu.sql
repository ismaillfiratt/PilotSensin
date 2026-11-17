-- KDV havuzu için kalıcı depolama — eklendigiKalemId persist edilsin
ALTER TABLE public.user_store
  ADD COLUMN IF NOT EXISTS kdv_havuzu JSONB NOT NULL DEFAULT '[]';

ALTER TABLE public.company_store
  ADD COLUMN IF NOT EXISTS kdv_havuzu JSONB NOT NULL DEFAULT '[]';
