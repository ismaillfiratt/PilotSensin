-- ── user_recovery_codes ─────────────────────────────────────────────────────
create table if not exists public.user_recovery_codes (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  code_hash   text        not null,
  used_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists idx_recovery_codes_user_used
  on public.user_recovery_codes (user_id, used_at);

alter table public.user_recovery_codes enable row level security;

-- Kullanıcı sadece kendi kodlarının meta'sını görür — code_hash asla açıklanmaz
create policy "recovery_codes_select_own"
  on public.user_recovery_codes for select
  using (auth.uid() = user_id);

-- INSERT/UPDATE/DELETE sadece service_role yapabilir
create policy "recovery_codes_service_insert"
  on public.user_recovery_codes for insert
  with check (auth.role() = 'service_role');

create policy "recovery_codes_service_update"
  on public.user_recovery_codes for update
  using (auth.role() = 'service_role');

create policy "recovery_codes_service_delete"
  on public.user_recovery_codes for delete
  using (auth.role() = 'service_role');


-- ── trusted_devices ──────────────────────────────────────────────────────────
create table if not exists public.trusted_devices (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references auth.users(id) on delete cascade,
  token_hash    text        not null unique,
  device_label  text,
  last_used_at  timestamptz not null default now(),
  expires_at    timestamptz not null,
  created_at    timestamptz not null default now()
);

create index if not exists idx_trusted_devices_user_expires
  on public.trusted_devices (user_id, expires_at);

alter table public.trusted_devices enable row level security;

-- Kullanıcı kendi cihazlarını listeleyebilir (token_hash hariç)
create policy "trusted_devices_select_own"
  on public.trusted_devices for select
  using (auth.uid() = user_id);

-- INSERT/UPDATE/DELETE sadece service_role
create policy "trusted_devices_service_insert"
  on public.trusted_devices for insert
  with check (auth.role() = 'service_role');

create policy "trusted_devices_service_update"
  on public.trusted_devices for update
  using (auth.role() = 'service_role');

create policy "trusted_devices_service_delete"
  on public.trusted_devices for delete
  using (auth.role() = 'service_role');
