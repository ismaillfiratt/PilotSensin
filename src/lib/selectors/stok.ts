/**
 * Stok selector'ları — salt okuma.
 */

import { stokDurumu, type Urun } from "@/lib/stok-data";
import type { SatisKaydi }       from "@/store/satislar";
import type { Kurus }            from "@/lib/para";

/**
 * Tüm stokun toplam maliyet değeri (birimMaliyetKurus × mevcutAdet) — kuruş.
 */
export function stokDegeri(urunler: Urun[]): Kurus {
  return urunler.reduce(
    (t, u) => (t + (u.birimMaliyetKurus ?? 0) * u.mevcutAdet),
    0,
  );
}

/**
 * Kritik veya uyarı seviyesindeki ürünlerin listesi.
 */
export function kritikUrunler(urunler: Urun[]): Urun[] {
  return urunler
    .filter((u) => {
      const d = stokDurumu(u);
      return d === "kritik" || d === "uyari";
    })
    .sort((a, b) => {
      const s = { kritik: 0, uyari: 1, normal: 2, olu: 3 } as const;
      return s[stokDurumu(a)] - s[stokDurumu(b)];
    });
}

/**
 * Son 30 gün içinde en çok satılan ürünler (adet bazında).
 */
export function enCokSatanlar(
  kayitlar: SatisKaydi[],
  urunler:  Urun[],
  limit = 5,
): Array<{ urun: Urun; toplamAdet: number; toplamCiroKurus: Kurus }> {
  const son30 = Date.now() - 30 * 86_400_000;

  const ozet: Record<string, { toplamAdet: number; toplamCiroKurus: number }> = {};

  for (const k of kayitlar) {
    if (!k.urunId || k.iadeEdildi) continue;
    if (new Date(k.tarih).getTime() < son30) continue;
    if (!ozet[k.urunId]) ozet[k.urunId] = { toplamAdet: 0, toplamCiroKurus: 0 };
    ozet[k.urunId].toplamAdet += k.adet;
    ozet[k.urunId].toplamCiroKurus += k.toplamCiroKurus;
  }

  return Object.entries(ozet)
    .sort((a, b) => b[1].toplamAdet - a[1].toplamAdet)
    .slice(0, limit)
    .flatMap(([urunId, veri]) => {
      const urun = urunler.find((u) => u.id === urunId);
      return urun ? [{ urun, toplamAdet: veri.toplamAdet, toplamCiroKurus: veri.toplamCiroKurus }] : [];
    });
}

/**
 * Geçmiş satış verilerinden günlük ortalama satışı hesaplar.
 * Statik `Urun.gunlukSatis` alanının dinamik alternatifi.
 *
 * @param urunId   - Hesaplanacak ürün ID'si
 * @param satislar - useSatislar().kayitlar
 * @param gun      - Kaç günlük pencerede bak (varsayılan: 30)
 */
export function gunlukOrtalamaSatis(
  urunId:   string,
  satislar: SatisKaydi[],
  gun = 30,
): number {
  const sinir  = Date.now() - gun * 86_400_000;
  const toplam = satislar
    .filter((k) => k.urunId === urunId && !k.iadeEdildi && new Date(k.tarih).getTime() >= sinir)
    .reduce((t, k) => t + k.adet, 0);
  return toplam / gun;
}

/**
 * Mevcut stok ve günlük ortalama satışa göre kaç gün yetişeceğini döner.
 * `stok-data.ts::gunKaldi()` yerine dinamik alternatif.
 */
export function gunKaldiDinamik(
  urun:     Urun,
  satislar: SatisKaydi[],
  gun = 30,
): number | null {
  const ort = gunlukOrtalamaSatis(urun.id, satislar, gun);
  if (ort <= 0) return null;
  return Math.floor(urun.mevcutAdet / ort);
}
