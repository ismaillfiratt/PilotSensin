import { createClient } from "@/utils/supabase/client";

let _userId = "";

/**
 * Uygulama başladığında çağrılır. Auth değişince userId önbelleğini günceller.
 */
export function authDinle() {
  const client = createClient();

  client.auth.getSession().then(({ data }) => {
    _userId = data.session?.user?.id ?? "";
  });

  client.auth.onAuthStateChange((_event, session) => {
    _userId = session?.user?.id ?? "";
  });
}

/**
 * Mevcut kullanıcı ID'sini döner. Önce in-memory önbellek, sonra Supabase.
 */
export async function getKullaniciId(): Promise<string> {
  if (_userId) return _userId;

  const { data } = await createClient().auth.getSession();
  _userId = data.session?.user?.id ?? "";
  return _userId;
}
