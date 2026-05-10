import { createClient } from "@/utils/supabase/client";

/**
 * Mevcut kullanıcı ID'sini döner. localStorage/cookie'den okur,
 * ağ çağrısı YAPMAZ. RLS zaten güvenliği sağlar.
 */
export async function getKullaniciId(): Promise<string> {
  const { data } = await createClient().auth.getSession();
  return data.session?.user?.id ?? "";
}
