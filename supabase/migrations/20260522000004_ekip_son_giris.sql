CREATE OR REPLACE FUNCTION public.get_ekip_uyeleri_zenginlestirilmis(company_id_param uuid)
RETURNS TABLE(
  member_id        uuid,
  user_id          uuid,
  email            text,
  full_name        text,
  role             text,
  role_id          uuid,
  status           text,
  joined_at        timestamptz,
  invited_at       timestamptz,
  last_sign_in_at  timestamptz,
  role_name        text
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Güvenlik kontrolü: çağıran kullanıcı bu şirketin aktif üyesi mi?
  IF NOT EXISTS (
    SELECT 1 FROM company_members
    WHERE company_id = company_id_param
      AND user_id    = auth.uid()
      AND status     = 'active'
  ) THEN
    RAISE EXCEPTION 'Bu şirketin üyesi değilsiniz' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    cm.id                                                          AS member_id,
    cm.user_id,
    u.email::text,
    (u.raw_user_meta_data->>'full_name')::text                     AS full_name,
    cm.role::text,
    cm.role_id,
    cm.status::text,
    cm.joined_at,
    cm.invited_at,
    u.last_sign_in_at,
    cr.name::text                                                   AS role_name
  FROM company_members cm
  JOIN auth.users u           ON u.id = cm.user_id
  LEFT JOIN company_roles cr  ON cr.id = cm.role_id
  WHERE cm.company_id = company_id_param
  ORDER BY cm.invited_at ASC;
END;
$$;

-- Erişim izni: authenticated kullanıcılar çağırabilir
GRANT EXECUTE ON FUNCTION public.get_ekip_uyeleri_zenginlestirilmis(uuid) TO authenticated;
