/**
 * giderEkle — İşletme gideri iş olayı.
 *
 * Başarı sırası:
 *   1. Nakit gider kaydı
 *   2. KDV'li ise indirilecek KDV kaydı
 *   3. Realtime yayın
 *
 * Bu işlem stoğu etkilemez.
 */

import { useNakit }             from "@/store/nakit";
import { useKdvHavuzu }         from "@/store/kdvHavuzu";
import { useBildirimler }       from "@/store/bildirimler";
import { useSirket }            from "@/store/sirket";
import { useBildirimAyarlari }  from "@/store/bildirimAyarlari";
import { yayin }                from "@/lib/realtime";
import { yazabilir, yetkiYok }  from "./yetki";
import { buyukGiderBildirim, kasaMinAltiBildirim } from "@/lib/bildirimler/anlik";
import type { Bildirim }        from "@/store/bildirimler";
import type { Kurus }           from "@/lib/para";
import type { GiderGirdi, IslemSonuc } from "./types";

/**
 * Bir işletme giderini atomik olarak kaydeder.
 * @param girdi - Gider parametreleri (bkz. GiderGirdi)
 */
export async function giderEkle(girdi: GiderGirdi): Promise<IslemSonuc<{ netTutar: Kurus; kdvTutariKurus: Kurus }>> {
  if (!yazabilir()) return yetkiYok("giderEkle");

  const islemId  = girdi.islemId ?? crypto.randomUUID();

  // İdempotency: aynı islemId zaten nakitte varsa atla
  if (useNakit.getState().islemler.some((i) => i.islemId === islemId)) {
    return { basarili: true, islemId };
  }
  const tarih    = girdi.tarih ?? new Date().toISOString();
  const kdvOrani = girdi.kdvOrani ?? 0;

  // KDV dahil kuruş tutarından KDV'yi ayrıştır (tamsayı)
  const kdvTutariKurus = (kdvOrani > 0
    ? Math.round(girdi.tutarKurus - girdi.tutarKurus / (1 + kdvOrani))
    : 0);
  const netTutar  = (girdi.tutarKurus - kdvTutariKurus);

  try {
    // ── 1. Nakit gider kaydı ──────────────────────────────────────────
    await useNakit.getState().ekle({
      tip:          "gider",
      tutarKurus:        girdi.tutarKurus,
      kategori:     girdi.kategori,
      aciklama:     girdi.aciklama ?? girdi.kategori,
      tarih,
      odemeYontemi: girdi.odemeYontemi as "nakit" | "kart" | "havale" | "cek",
      islemId,
    });

    // ── 2. İndirilecek KDV kaydı (varsa) ──────────────────────────────
    if (kdvOrani > 0 && kdvTutariKurus > 0) {
      useKdvHavuzu.getState().ekle({
        hareketId: islemId,
        urunId:    "gider",
        urunAd:    girdi.kategori,
        tip:       "giris",
        adet:      1,
        birimKdvKurus:  kdvTutariKurus,   // tek kalem olduğu için birim = toplam
        toplamKdvKurus: kdvTutariKurus,
        tarih,
        islemId,
      });
    }

    // ── 3. Olay bildirimleri ──────────────────────────────────────────
    {
      const rol      = (useSirket.getState().rol || "pilot") as "pilot" | "copilot";
      const kasaEsik = useBildirimAyarlari.getState().kasaMinEsikKurus;
      const kasaBakiye = useNakit.getState().islemler.reduce(
        (s, i) => s + (i.tip === "gelir" ? i.tutarKurus : -i.tutarKurus), 0
      );

      const bildirimleri = [
        buyukGiderBildirim({ kategori: girdi.kategori, tutarKurus: girdi.tutarKurus }, rol),
        kasaEsik > 0 && kasaBakiye < kasaEsik
          ? kasaMinAltiBildirim(kasaBakiye, kasaEsik)
          : null,
      ].filter((b): b is Bildirim => b !== null);

      for (const b of bildirimleri) {
        void useBildirimler.getState().hedefliEkle(b, rol);
      }
    }

    // ── 4. Realtime yayın ─────────────────────────────────────────────
    yayin({ tip: "kdv-havuzu", veri: useKdvHavuzu.getState().kayitlar });

    return { basarili: true, islemId, veri: { netTutar, kdvTutariKurus } };

  } catch (hata) {
    const mesaj = hata instanceof Error ? hata.message : String(hata);
    console.error("[giderEkle] hata:", mesaj);
    return { basarili: false, islemId, hata: mesaj };
  }
}
