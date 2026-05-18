-- ─────────────────────────────────────────────────────────────────────────────
-- Kullanıcıların sistem bildirimlerini "dismissed" veya "okundu" olarak
-- işaretleyebilmesi için ara tablo
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.notification_read_states (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID        NOT NULL REFERENCES auth.users(id)                ON DELETE CASCADE,
  notification_id UUID        NOT NULL REFERENCES public.system_notifications(id) ON DELETE CASCADE,
  is_read         BOOLEAN     NOT NULL DEFAULT FALSE,
  dismissed_popup BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, notification_id)
);

ALTER TABLE public.notification_read_states ENABLE ROW LEVEL SECURITY;

-- Her kullanıcı sadece kendi kayıtlarına erişebilir
CREATE POLICY "notif_read_states_self" ON public.notification_read_states
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE        ON public.notification_read_states TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_read_states TO service_role;
