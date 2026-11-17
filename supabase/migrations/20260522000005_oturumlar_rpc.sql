-- Aktif oturumları listele (sadece kendi oturumları)
CREATE OR REPLACE FUNCTION public.get_aktif_oturumlar()
RETURNS TABLE(
  session_id      uuid,
  created_at      timestamptz,
  updated_at      timestamptz,
  user_agent      text,
  ip              text,
  current_session boolean
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_uid uuid;
BEGIN
  current_uid := auth.uid();
  IF current_uid IS NULL THEN
    RAISE EXCEPTION 'Yetkisiz' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    s.id                                                     AS session_id,
    s.created_at,
    s.updated_at,
    s.user_agent::text,
    s.ip::text,
    (s.id = (
      SELECT id FROM auth.sessions
      WHERE user_id = current_uid
      ORDER BY updated_at DESC
      LIMIT 1
    ))                                                       AS current_session
  FROM auth.sessions s
  WHERE s.user_id = current_uid
    AND (s.not_after IS NULL OR s.not_after > now())
  ORDER BY s.updated_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_aktif_oturumlar() TO authenticated;

-- Tek bir oturumu iptal et (sadece kendi oturumu)
CREATE OR REPLACE FUNCTION public.revoke_session(session_id_param uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Yetkisiz' USING ERRCODE = '42501';
  END IF;
  DELETE FROM auth.sessions
  WHERE id = session_id_param AND user_id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.revoke_session(uuid) TO authenticated;
