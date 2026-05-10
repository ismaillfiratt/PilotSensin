import { createClient } from "@/utils/supabase/client";

const LS_KEY = "pilot_uid";
let _userId = "";

/**
 * Uygulama başladığında çağrılır. Auth değişince userId önbelleğini günceller.
 */
export function authDinle() {
  const client = createClient();

  // Önce localStorage'dan al (hızlı, ağsız)
  if (typeof window !== "undefined") {
    _userId = localStorage.getItem(LS_KEY) ?? "";
  }

  // Oturumu doğrula ve güncelle
  client.auth.getSession().then(({ data }) => {
    const id = data.session?.user?.id ?? "";
    _userId = id;
    if (typeof window !== "undefined") {
      if (id) localStorage.setItem(LS_KEY, id);
      else localStorage.removeItem(LS_KEY);
    }
  });

  // Auth durumu değişince güncelle (login/logout)
  client.auth.onAuthStateChange((_event, session) => {
    const id = session?.user?.id ?? "";
    _userId = id;
    if (typeof window !== "undefined") {
      if (id) localStorage.setItem(LS_KEY, id);
      else localStorage.removeItem(LS_KEY);
    }
  });
}

/**
 * Mevcut kullanıcı ID'sini döner. Önbellek → localStorage → Supabase sırası.
 */
export async function getKullaniciId(): Promise<string> {
  if (_userId) return _userId;

  // localStorage fallback
  if (typeof window !== "undefined") {
    const cached = localStorage.getItem(LS_KEY);
    if (cached) { _userId = cached; return cached; }
  }

  // Son çare: Supabase'den çek
  const { data } = await createClient().auth.getSession();
  const id = data.session?.user?.id ?? "";
  if (id) {
    _userId = id;
    if (typeof window !== "undefined") localStorage.setItem(LS_KEY, id);
  }
  return id;
}
