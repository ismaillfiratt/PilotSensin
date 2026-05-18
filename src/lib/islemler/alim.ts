/**
 * alimYap — Atomik tedarik/stok girişi iş olayı.
 *
 * Başarı sırası:
 *   1. Ürün varlık kontrolü
 *   2. Stok adedi artırma + ağırlıklı ortalama maliyet güncelleme
 *   3. Nakit gider kaydı
 *   4. İndirilecek KDV kaydı
 *   5. Realtime yayın
 */

import { useStok }             from "@/store/stok";
import { useNakit }            from "@/store/nakit";
import { useKdvHavuzu }        from "@/store/kdvHavuzu";
import { useSirket }           from "@/store/sirket";
import { useBildirimler }      from "@/store/bildirimler";
import { useBildirimAyarlari } from "@/store/bildirimAyarlari";
import { yayin }               from "@/lib/realtime";
import { yazabilir, yetkiYok } from "./yetki";
import { kasaMinAltiBildirim } from "@/lib/bildirimler/anlik";
import type { Kurus }          from "@/lib/para";
import type { AlimGirdi, IslemSonuc } from "./types";

/**
 * Bir tedarik/alım iş olayını atomik olarak gerçekleştirir.
 * Ürünün birimMaliyetKurus'ini ağırlıklı ortalama ile günceller.
 * @param girdi - Alım parametreleri (bkz. AlimGirdi)
 */
export async function alimYap(girdi: AlimGirdi): Promise<IslemSonuc> {
  if (!yazabilir()) return yetkiYok("alimYap");

  const islemId = girdi.islemId ?? crypto.randomUUID();
  const tarih   = girdi.tarih ?? new Date().toISOString();

  // İdempotency: aynı islemId zaten nakitte varsa atla
  if (useNakit.getState().islemler.some((i) => i.islemId === islemId)) {
    return { basarili: true, islemId };
  }

  // ── 1. Ürün varlık kontrolü ────────────────────────────────────────────
  const { urunler, guncelle: stokGuncelle } = useStok.getState();
  const urun = urunler.find((u) => u.id === girdi.urunId);

  if (!urun) {
    return { basarili: false, islemId, hata: `Ürün bulunamadı: ${girdi.urunId}` };
  }

  // Rollback için önceki değerleri sakla
  const oncekiAdet    = urun.mevcutAdet;
  const oncekiMaliyet = urun.birimMaliyetKurus ?? 0;

  // ── 2. Ağırlıklı ortalama maliyet hesapla — tüm değerler kuruş ────────
  const yeniToplam  = oncekiAdet + girdi.adet;
  // (mevcutAdet × eskiMaliyet + yeniAdet × yeniFiyat) / toplam → integer round
  const yeniMaliyet = (yeniToplam > 0
    ? Math.round(((oncekiAdet * oncekiMaliyet) + (girdi.adet * girdi.birimAlisFiyatiKurus)) / yeniToplam)
    : girdi.birimAlisFiyatiKurus);

  const toplamTutar = Math.round(girdi.birimAlisFiyatiKurus * girdi.adet);
  const kdvTutariKurus   = Math.round(toplamTutar * girdi.kdvOrani);
  const kasaCikis   = toplamTutar + kdvTutariKurus;

  try {
    // ── 2. Stok güncelle + hareket kaydı ─────────────────────────────
    await stokGuncelle(urun.id, {
      mevcutAdet:   yeniToplam,
      birimMaliyetKurus: yeniMaliyet,
      sonHareket:   tarih,
    });
    useStok.getState().hareketEkle(urun.id, {
      tip:      "giris",
      miktar:   girdi.adet,
      onceki:   oncekiAdet,
      sonraki:  yeniToplam,
      tarih,
      aciklama: girdi.aciklama ?? `${urun.ad} — ${girdi.adet} ${urun.birim} alımı`,
      kimin:    useSirket.getState().rolAdi || "pilot",
      islemId,
    });

    // ── 3. Nakit gider kaydı ──────────────────────────────────────────
    await useNakit.getState().ekle({
      tip:          "gider",
      tutarKurus:        kasaCikis,
      kategori:     "Tedarik / Hammadde",
      aciklama:     girdi.aciklama ?? `${urun.ad} — ${girdi.adet} ${urun.birim} alımı`,
      tarih,
      odemeYontemi: girdi.odemeYontemi as "nakit" | "kart" | "havale" | "cek",
      islemId,
    });

    // ── 4. İndirilecek KDV kaydı ──────────────────────────────────────
    if (girdi.kdvOrani > 0) {
      useKdvHavuzu.getState().ekle({
        hareketId: islemId,
        urunId:    urun.id,
        urunAd:    urun.ad,
        tip:       "giris",          // indirilecek KDV
        adet:      girdi.adet,
        birimKdvKurus:  Math.round(girdi.birimAlisFiyatiKurus * girdi.kdvOrani),
        toplamKdvKurus: kdvTutariKurus,
        tarih,
        islemId,
      });
    }

    // ── 5. Kasa min bildirimi ─────────────────────────────────────────
    {
      const rol      = (useSirket.getState().rol || "pilot") as "pilot" | "copilot";
      const kasaEsik = useBildirimAyarlari.getState().kasaMinEsikKurus;
      const kasaBakiye = useNakit.getState().islemler.reduce(
        (s, i) => s + (i.tip === "gelir" ? i.tutarKurus : -i.tutarKurus), 0
      );
      if (kasaEsik > 0 && kasaBakiye < kasaEsik) {
        void useBildirimler.getState().hedefliEkle(
          kasaMinAltiBildirim(kasaBakiye, kasaEsik), rol
        );
      }
    }

    // ── 6. Realtime yayın ─────────────────────────────────────────────
    yayin({ tip: "kdv-havuzu", veri: useKdvHavuzu.getState().kayitlar });

    return { basarili: true, islemId };

  } catch (hata) {
    // ── Rollback: stok değerlerini geri yükle ─────────────────────────
    await stokGuncelle(urun.id, {
      mevcutAdet:   oncekiAdet,
      birimMaliyetKurus: oncekiMaliyet,
    }).catch(() => null);

    const mesaj = hata instanceof Error ? hata.message : String(hata);
    console.error("[alimYap] rollback:", mesaj);
    return { basarili: false, islemId, hata: mesaj };
  }
}
