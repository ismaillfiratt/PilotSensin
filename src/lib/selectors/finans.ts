/**
 * Finansal selector'lar — salt okuma, store'a kayıt yapmaz.
 * Tüm fonksiyonlar pure: girdi olarak store verisini alır, hesaplanmış değer döner.
 */

import type { Islem }     from "@/lib/nakit-data";
import type { SatisKaydi } from "@/store/satislar";
import type { KdvKaydi }  from "@/store/kdvHavuzu";
import type { GiderItem } from "@/lib/db";
import type { Kurus }     from "@/lib/para";

/** Dönem başlangıcı: ayın ilk günü 00:00:00 */
function ayBasiTs(): number {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
}

/**
 * Kasadaki net bakiye.
 * Tüm nakit işlemleri toplamı — gelirler pozitif, giderler negatif.
 */
export function kasaBakiyesi(islemler: Islem[]): Kurus {
  return islemler
    .filter((i) => !i.silindi)
    .reduce(
      (toplam, i) => (i.tip === "gelir" ? toplam + i.tutarKurus : toplam - i.tutarKurus),
      0,
    );
}

/**
 * Bu aya ait net kâr.
 * Net Kâr = Brüt Kâr − Aylık İşletme Giderleri
 */
export function aylikNetKar(
  kayitlar:  SatisKaydi[],
  giderler:  GiderItem[],
): Kurus {
  return (aylikBrutKar(kayitlar) - giderler.reduce((t, g) => t + g.tutarKurus, 0));
}

/**
 * Bu aya ait brüt kâr (Ciro − SMM).
 */
export function aylikBrutKar(kayitlar: SatisKaydi[]): Kurus {
  const bas = ayBasiTs();
  return kayitlar
    .filter((k) => !k.iadeEdildi && new Date(k.tarih).getTime() >= bas)
    .reduce((t, k) => (t + k.brutKarKurus), 0);
}

/**
 * Bu aya ait toplam satış cirosu (KDV hariç).
 */
export function aylikCiro(kayitlar: SatisKaydi[]): Kurus {
  const bas = ayBasiTs();
  return kayitlar
    .filter((k) => !k.iadeEdildi && new Date(k.tarih).getTime() >= bas)
    .reduce((t, k) => (t + k.toplamCiroKurus), 0);
}

/**
 * Bu aya ait satılan mal maliyeti (SMM).
 */
export function aylikSMM(kayitlar: SatisKaydi[]): Kurus {
  const bas = ayBasiTs();
  return kayitlar
    .filter((k) => !k.iadeEdildi && new Date(k.tarih).getTime() >= bas)
    .reduce((t, k) => (t + k.birimAlisFiyatiKurus * k.adet), 0);
}

/**
 * KDV net pozisyonu.
 * Pozitif → ödenecek KDV, Negatif → devreden KDV.
 */
export function kdvNetPozisyon(kdvKayitlari: KdvKaydi[]): Kurus {
  return kdvKayitlari.reduce(
    (toplam, k) => (k.tip === "cikis" ? toplam + k.toplamKdvKurus : toplam - k.toplamKdvKurus),
    0,
  );
}
