import { useSirket } from "@/store/sirket";
import type { IslemSonuc } from "./types";

async function yetkiIhlaliGonder(denenenIslem: string) {
  try {
    const { yetkiIhlaliBildirim }    = await import("@/lib/bildirimler/anlik");
    const { useBildirimler }         = await import("@/store/bildirimler");
    const { createClient }           = await import("@/utils/supabase/client");
    const { data: { user } }         = await createClient().auth.getUser();
    const email                      = user?.email ?? "bilinmeyen";
    const rol = (useSirket.getState().rol || "pilot") as "pilot" | "copilot";
    void useBildirimler.getState().hedefliEkle(
      yetkiIhlaliBildirim(email, denenenIslem), rol
    );
  } catch { /* sessiz */ }
}

/**
 * Mevcut kullanıcının yazma yetkisi var mı?
 * - Şirket üyesi değilse (solo kullanıcı) → izin ver
 * - permissions.canEdit true ise → izin ver
 * - Değilse → izin verme
 */
export function yazabilir(): boolean {
  const { permissions } = useSirket.getState();
  if (permissions === null) return true; // şirket kurulmamış
  return permissions.canEdit;
}

/**
 * islem fonksiyonlarında kullanım: if (!yazabilir()) return yetkiYok("satisYap");
 * Fire-and-forget — yetkiIhlali bildirimi pilot'a iletilir.
 */
export function yetkiYok<T = void>(denenenIslem = "bilinmeyen-islem"): IslemSonuc<T> {
  void yetkiIhlaliGonder(denenenIslem);
  return {
    basarili: false,
    islemId:  crypto.randomUUID(),
    hata:     "Bu işlem için yetkiniz yok.",
  };
}
