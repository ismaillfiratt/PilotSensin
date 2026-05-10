import { createClient } from "@/utils/supabase/client";

let _userId = "";

/**
 * Uygulama başladığında çağrılır. Auth durumu değişince userId önbelleğini günceller.
 * AppLayout veya bir Provider içinde bir kez çağrılmalı.
 */
export function authDinle() {
  const client = createClient();

  // Mevcut oturumu hemen al
  client.auth.getSession().then(({ data }) => {
    _userId = data.session?.user?.id ?? "";
  });

  // Auth durumu değişince (login/logout) güncelle
  client.auth.onAuthStateChange((_event, session) => {
    _userId = session?.user?.id ?? "";
  });
}

/**
 * Mevcut kullanıcı ID'sini döner.
 * Önbellek doluysa anında döner; yoksa oturumu Supabase'den çeker.
 */
export async function getKullaniciId(): Promise<string> {
  if (_userId) return _userId;

  // Önbellek boşsa direkt çek
  const { data } = await createClient().auth.getSession();
  _userId = data.session?.user?.id ?? "";
  return _userId;
}
