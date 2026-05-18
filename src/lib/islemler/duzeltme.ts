/**
 * stokDuzelt — Stok düzeltme iş olayı (fire, sayım farkı, iade vb.).
 *
 * Başarı sırası:
 *   1. Ürün varlık kontrolü
 *   2. Stok adedini yeni değere set et (fark hesabına gerek yok)
 *   3. Realtime yayın
 *
 * Bu işlem kasayı veya KDV'yi ETKİLEMEZ.
 */

import { useStok }             from "@/store/stok";
import { useSirket }           from "@/store/sirket";
import { useBildirimler }      from "@/store/bildirimler";
import { yayin }               from "@/lib/realtime";
import { yazabilir, yetkiYok } from "./yetki";
import { stokDuzeltmeFireBildirim } from "@/lib/bildirimler/anlik";
import type { DuzeltmeGirdi, IslemSonuc } from "./types";

const SEBEP_ETIKET: Record<DuzeltmeGirdi["sebep"], string> = {
  "fire":        "Fire / Hasar",
  "sayim-farki": "Sayım Farkı",
  "iade":        "Tedarikçi İadesi",
  "diger":       "Düzeltme",
};

/**
 * Stok sayım farkı, fire veya benzeri durumlar için stok adedini düzeltir.
 * @param girdi - Düzeltme parametreleri (bkz. DuzeltmeGirdi)
 */
export async function stokDuzelt(girdi: DuzeltmeGirdi): Promise<IslemSonuc<{ oncekiAdet: number; yeniAdet: number; fark: number }>> {
  if (!yazabilir()) return yetkiYok("stokDuzelt");

  const islemId = crypto.randomUUID();
  const tarih   = new Date().toISOString();

  // ── 1. Ürün varlık kontrolü ────────────────────────────────────────────
  const { urunler, guncelle: stokGuncelle } = useStok.getState();
  const urun = urunler.find((u) => u.id === girdi.urunId);

  if (!urun) {
    return { basarili: false, islemId, hata: `Ürün bulunamadı: ${girdi.urunId}` };
  }

  if (girdi.yeniAdet < 0) {
    return { basarili: false, islemId, hata: "Stok adedi negatif olamaz." };
  }

  const oncekiAdet = urun.mevcutAdet;
  const fark       = girdi.yeniAdet - oncekiAdet;
  const etiket     = SEBEP_ETIKET[girdi.sebep];

  try {
    // ── 2. Stok adedini güncelle + hareket kaydı ──────────────────────
    await stokGuncelle(urun.id, { mevcutAdet: girdi.yeniAdet, sonHareket: tarih });
    useStok.getState().hareketEkle(urun.id, {
      tip:      "sayim",
      miktar:   Math.abs(fark),
      onceki:   oncekiAdet,
      sonraki:  girdi.yeniAdet,
      tarih,
      aciklama: girdi.aciklama ?? etiket,
      kimin:    useSirket.getState().rolAdi || "pilot",
      islemId,
    });

    // ── 3. Fire bildirimi (fark negatif = ürün azaldı) ────────────────
    if (girdi.sebep === "fire" && fark < 0) {
      const rol = (useSirket.getState().rol || "pilot") as "pilot" | "copilot";
      const b   = stokDuzeltmeFireBildirim(urun, Math.abs(fark));
      if (b) void useBildirimler.getState().hedefliEkle(b, rol);
    }

    // ── 4. Realtime yayın ─────────────────────────────────────────────
    yayin({ tip: "stok", veri: useStok.getState().urunler });

    console.info(
      `[stokDuzelt] ${urun.ad}: ${oncekiAdet} → ${girdi.yeniAdet} ` +
      `(${fark >= 0 ? "+" : ""}${fark}) — ${etiket}` +
      (girdi.aciklama ? ` — ${girdi.aciklama}` : "")
    );

    return {
      basarili: true,
      islemId,
      veri: { oncekiAdet, yeniAdet: girdi.yeniAdet, fark },
    };

  } catch (hata) {
    // ── Rollback ──────────────────────────────────────────────────────
    await stokGuncelle(urun.id, { mevcutAdet: oncekiAdet }).catch(() => null);
    const mesaj = hata instanceof Error ? hata.message : String(hata);
    console.error("[stokDuzelt] rollback:", mesaj);
    return { basarili: false, islemId, hata: mesaj };
  }
}
