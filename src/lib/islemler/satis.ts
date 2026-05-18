/**
 * satisYap — Atomik satış iş olayı.
 *
 * Başarı sırası:
 *   1. Stok varlık ve yeterlilik kontrolü
 *   2. Stok adedi düşme
 *   3. Satış kaydı oluşturma
 *   4. Nakit gelir kaydı (vadeli değilse)
 *   5. Hesaplanan KDV kaydı
 *   6. Kritik stok bildirimi
 *   7. Realtime yayın
 *
 * Herhangi bir adım atılırsa geriye sarılır (rollback).
 */

import { useStok }             from "@/store/stok";
import { useNakit }            from "@/store/nakit";
import { useSatislar }         from "@/store/satislar";
import { useKdvHavuzu }        from "@/store/kdvHavuzu";
import { useBildirimler }      from "@/store/bildirimler";
import { useSirket }           from "@/store/sirket";
import { useBildirimAyarlari } from "@/store/bildirimAyarlari";
import { stokDurumu }          from "@/lib/stok-data";
import { yayin }               from "@/lib/realtime";
import { yazabilir, yetkiYok } from "./yetki";
import {
  satisAnlikBildirim, stokTukendiBildirim, stokKritikBildirim,
  vadeliSatisBildirim, kasaMinAltiBildirim, iadeBildirim,
} from "@/lib/bildirimler/anlik";
import type { Bildirim }            from "@/store/bildirimler";
import type { Kurus }               from "@/lib/para";
import type { SatisGirdi, IslemSonuc } from "./types";

/**
 * Bir satış iş olayını atomik olarak gerçekleştirir.
 * @param girdi - Satış parametreleri (bkz. SatisGirdi)
 * @returns IslemSonuc — başarı/başarısızlık ve islemId
 */
export async function satisYap(girdi: SatisGirdi): Promise<IslemSonuc> {
  if (!yazabilir()) return yetkiYok("satisYap");

  const islemId = girdi.islemId ?? crypto.randomUUID();
  const tarih   = girdi.tarih ?? new Date().toISOString();

  // İdempotency: aynı islemId ile daha önce işlem yapılmışsa atla
  if (useSatislar.getState().kayitlar.some((k) => k.islemId === islemId)) {
    return { basarili: true, islemId };
  }

  // ── 1. Stok ürünü bul ve stok yeterliliği kontrol et ──────────────────
  const { urunler, guncelle: stokGuncelle } = useStok.getState();

  let urun = girdi.urunId ? urunler.find((u) => u.id === girdi.urunId) : null;

  if (girdi.urunId && !urun) {
    return { basarili: false, islemId, hata: `Ürün bulunamadı: ${girdi.urunId}` };
  }

  if (urun && urun.mevcutAdet < girdi.adet) {
    return {
      basarili: false,
      islemId,
      hata: `Yetersiz stok: mevcut ${urun.mevcutAdet} ${urun.birim}, istenen ${girdi.adet}`,
    };
  }

  const urunAd       = urun?.ad ?? girdi.urunAd ?? "Hizmet";
  const kategori     = urun?.kategori ?? "Hizmet";
  const birimMaliyetKurus = urun?.birimMaliyetKurus ?? 0;

  // Hesaplanan değerler — tümü kuruş tamsayı
  const toplamCiroKurus = Math.round(girdi.birimSatisFiyatiKurus * girdi.adet);
  const kdvTutariKurus  = Math.round(toplamCiroKurus * girdi.kdvOrani);
  const kasaGirisKurus  = toplamCiroKurus + kdvTutariKurus;
  const birimKarKurus   = girdi.birimSatisFiyatiKurus - birimMaliyetKurus;
  const brutKarKurus    = Math.round(birimKarKurus * girdi.adet);

  // Rollback için önceki değerleri sakla
  const oncekiAdet = urun?.mevcutAdet ?? 0;

  try {
    // ── 2. Stok adedi düş + hareket kaydı ─────────────────────────────
    if (urun) {
      const yeniAdet = oncekiAdet - girdi.adet;
      await stokGuncelle(urun.id, { mevcutAdet: yeniAdet, sonHareket: tarih });
      useStok.getState().hareketEkle(urun.id, {
        tip:      "cikis",
        miktar:   girdi.adet,
        onceki:   oncekiAdet,
        sonraki:  yeniAdet,
        tarih,
        aciklama: girdi.aciklama ?? `${urunAd} — satış`,
        kimin:    useSirket.getState().rolAdi || "pilot",
        islemId,
      });
    }

    // ── 3. Satış kaydı oluştur ─────────────────────────────────────────
    await useSatislar.getState().ekle({
      urunId:           girdi.urunId,
      urunAd,
      kategori,
      tarih,
      adet:             girdi.adet,
      birimSatisFiyatiKurus: girdi.birimSatisFiyatiKurus,
      birimAlisFiyatiKurus:  birimMaliyetKurus,
      birimKarKurus,
      toplamCiroKurus,
      brutKarKurus,
      kdvOrani:         girdi.kdvOrani,
      kdvTutariKurus,
      kasaGirisKurus,
      tip:              urun ? "urun" : "hizmet",
      islemId,
    });

    // ── 4. Nakit gelir kaydı (vadeli değilse) ─────────────────────────
    if (girdi.odemeYontemi !== "vadeli") {
      await useNakit.getState().ekle({
        tip:          "gelir",
        tutarKurus:        kasaGirisKurus,
        kategori:     "Satış",
        aciklama:     girdi.aciklama ?? `${urunAd} × ${girdi.adet}`,
        tarih,
        odemeYontemi: girdi.odemeYontemi as "nakit" | "kart" | "havale" | "cek",
        islemId,
      });
    }

    // ── 5. Hesaplanan KDV kaydı ────────────────────────────────────────
    if (girdi.kdvOrani > 0) {
      useKdvHavuzu.getState().ekle({
        hareketId: islemId,
        urunId:    girdi.urunId ?? "hizmet",
        urunAd,
        tip:       "cikis",          // hesaplanan KDV
        adet:      girdi.adet,
        birimKdvKurus:  Math.round(girdi.birimSatisFiyatiKurus * girdi.kdvOrani),
        toplamKdvKurus: kdvTutariKurus,
        tarih,
        islemId,
      });
    }

    // ── 6. Olay bildirimleri ──────────────────────────────────────────
    {
      const rol       = (useSirket.getState().rol || "pilot") as "pilot" | "copilot";
      const kasaEsik  = useBildirimAyarlari.getState().kasaMinEsikKurus;
      const kasaBakiye = useNakit.getState().islemler.reduce(
        (s, i) => s + (i.tip === "gelir" ? i.tutarKurus : -i.tutarKurus), 0
      );
      const guncel = urun ? useStok.getState().urunler.find((u) => u.id === urun!.id) : null;
      const durum  = guncel ? stokDurumu(guncel) : null;

      const bildirimleri = [
        satisAnlikBildirim({ urunAd, adet: girdi.adet, kasaGirisKurus, yapanRol: rol, islemId }),
        durum === "olu"    && guncel ? stokTukendiBildirim(guncel, islemId)  : null,
        durum === "kritik" && guncel ? stokKritikBildirim(guncel, islemId)   : null,
        girdi.odemeYontemi === "vadeli"
          ? vadeliSatisBildirim({ urunAd, kasaGirisKurus, islemId })
          : null,
        kasaEsik > 0 && kasaBakiye < kasaEsik
          ? kasaMinAltiBildirim(kasaBakiye, kasaEsik)
          : null,
      ].filter((b): b is Bildirim => b !== null);

      for (const b of bildirimleri) {
        void useBildirimler.getState().hedefliEkle(b, rol);
      }
    }

    // ── 7. Realtime yayın ─────────────────────────────────────────────
    yayin({ tip: "satislar", veri: useSatislar.getState().kayitlar });
    yayin({ tip: "kdv-havuzu", veri: useKdvHavuzu.getState().kayitlar });

    return { basarili: true, islemId };

  } catch (hata) {
    // ── Rollback: stok adedini geri yükle ─────────────────────────────
    if (urun) {
      await stokGuncelle(urun.id, { mevcutAdet: oncekiAdet }).catch(() => null);
    }
    const mesaj = hata instanceof Error ? hata.message : String(hata);
    console.error("[satisYap] rollback:", mesaj);
    return { basarili: false, islemId, hata: mesaj };
  }
}

/**
 * Bir satışı iade eder.
 * Orijinal islemId'ye sahip kayıtları tersine çevirir.
 * @param islemId - İade edilecek orijinal satışın islemId'si
 */
export async function satisIade(islemId: string): Promise<IslemSonuc> {
  if (!yazabilir()) return yetkiYok("satisIade");

  const iadeIslemId = crypto.randomUUID();
  const tarih       = new Date().toISOString();

  const kayitlar = useSatislar.getState().kayitlar.filter(
    (k) => k.islemId === islemId
  );

  if (kayitlar.length === 0) {
    return { basarili: false, islemId: iadeIslemId, hata: `islemId bulunamadı: ${islemId}` };
  }

  // Daha önce iade edilmiş mi?
  if (kayitlar.some((k) => k.iadeEdildi)) {
    return { basarili: false, islemId: iadeIslemId, hata: "Bu satış zaten iade edilmiş." };
  }

  try {
    const { guncelle: stokGuncelle, urunler } = useStok.getState();

    for (const kayit of kayitlar) {
      // Stok geri yükle + hareket kaydı
      if (kayit.urunId) {
        const urun = urunler.find((u) => u.id === kayit.urunId);
        if (urun) {
          const yeniAdet = urun.mevcutAdet + kayit.adet;
          await stokGuncelle(urun.id, { mevcutAdet: yeniAdet, sonHareket: tarih });
          useStok.getState().hareketEkle(urun.id, {
            tip:      "giris",
            miktar:   kayit.adet,
            onceki:   urun.mevcutAdet,
            sonraki:  yeniAdet,
            tarih,
            aciklama: `İade: ${kayit.urunAd}`,
            kimin:    useSirket.getState().rolAdi || "pilot",
            islemId:  iadeIslemId,
          });
        }
      }

      // Nakit gider kaydı (kasadan çıkış)
      if (kayit.kasaGirisKurus > 0) {
        // Orijinal satışın ödeme yöntemini bul (vadeli ise nakit yok → "nakit" kullan)
        const orijinal = useNakit.getState().islemler.find(
          (i) => i.islemId === islemId && i.tip === "gelir"
        );
        await useNakit.getState().ekle({
          tip:          "gider",
          tutarKurus:        kayit.kasaGirisKurus,
          kategori:     "Satış İadesi",
          aciklama:     `İade: ${kayit.urunAd} × ${kayit.adet}`,
          tarih,
          odemeYontemi: orijinal?.odemeYontemi ?? "nakit",
          islemId:      iadeIslemId,
        });
      }

      // KDV: hesaplananı azalt
      if (kayit.kdvTutariKurus > 0) {
        useKdvHavuzu.getState().ekle({
          hareketId: iadeIslemId,
          urunId:    kayit.urunId ?? "hizmet",
          urunAd:    kayit.urunAd,
          tip:       "giris",          // ters kayıt → hesaplananı düşürür
          adet:      kayit.adet,
          birimKdvKurus:  Math.round(kayit.birimSatisFiyatiKurus * kayit.kdvOrani),
          toplamKdvKurus: kayit.kdvTutariKurus,
          tarih,
          islemId:   iadeIslemId,
        });
      }

      // Satış kaydını iade edildi olarak işaretle
      await useSatislar.getState().guncelle?.(kayit.id, { iadeEdildi: true });
    }

    yayin({ tip: "satislar", veri: useSatislar.getState().kayitlar });
    yayin({ tip: "kdv-havuzu", veri: useKdvHavuzu.getState().kayitlar });

    // Orijinal satışa ait stale bildirimleri temizle (büyük satış, stok tükendi vb.)
    useBildirimler.getState().olayBildirimiSil(islemId);

    // İade bildirimi (ilk kayıt yeterli)
    const rol = (useSirket.getState().rol || "pilot") as "pilot" | "copilot";
    if (kayitlar[0]) {
      void useBildirimler.getState().hedefliEkle(iadeBildirim(kayitlar[0]), rol);
    }

    return { basarili: true, islemId: iadeIslemId };

  } catch (hata) {
    const mesaj = hata instanceof Error ? hata.message : String(hata);
    console.error("[satisIade] hata:", mesaj);
    return { basarili: false, islemId: iadeIslemId, hata: mesaj };
  }
}
