import type { SilinebilirTip } from "@/lib/silinebilir";
import type { OnayYanit } from "@/store/onay";

/**
 * Standart silme onayı — tüm silme noktalarında bu fonksiyon kullanılır.
 *
 * - "Bu oturumda sorma" seçilmişse pencere açmadan direkt onay döner.
 * - Aksi hâlde OnayDialog'u açar ve kullanıcı kararını bekler.
 */
export async function onaylaSil(p: {
  tip:           SilinebilirTip;
  isim:          string;
  baglıSayisi?:  number;
}): Promise<OnayYanit> {
  const { useOnay } = await import("@/store/onay");
  const store = useOnay.getState();

  if (store.sessizTipler.has(p.tip)) {
    return { onaylandi: true, kaskad: true };
  }

  return store.ac({
    tip:               p.tip,
    isim:              p.isim,
    kaskadBaglıSayisi: p.baglıSayisi ?? 0,
    onayMetni:         "Evet, Sil",
    iptalMetni:        "Vazgeç",
  });
}
