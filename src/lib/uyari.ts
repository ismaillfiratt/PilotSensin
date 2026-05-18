/**
 * UI bildirim yardımcıları — islem sonuçlarını kullanıcıya gösterir.
 */

import { useBildirimler } from "@/store/bildirimler";
import type { IslemSonuc } from "@/lib/islemler/types";

/**
 * Bir iş olayı sonucunu kullanıcıya gösterir.
 * Başarı durumunda opsiyonel "bilgi" bildirimi; başarısızlıkta "kritik" bildirimi.
 */
export async function islemSonucGoster<T>(
  sonuc:         IslemSonuc<T>,
  basariMesaji?: string,
): Promise<void> {
  if (sonuc.basarili) {
    if (basariMesaji) {
      await useBildirimler.getState().ekle({
        id:     crypto.randomUUID(),
        baslik: "İşlem Tamamlandı",
        mesaj:  basariMesaji,
        tip:    "bilgi",
        modul:  "sistem",
      });
    }
    return;
  }

  await useBildirimler.getState().ekle({
    id:     crypto.randomUUID(),
    baslik: "İşlem Başarısız",
    mesaj:  sonuc.hata ?? "Bilinmeyen hata",
    tip:    "kritik",
    modul:  "sistem",
  });
}
