/**
 * Para birimi altyapısı.
 *
 * Kurus: number alias — branded type yerine adlandırma disiplini kullanılır.
 * Para taşıyan TÜM değişken/alan adları "Kurus" suffix'i ile bitmeli:
 *   tutarKurus, birimFiyatiKurus, kdvTutariKurus, toplamCiroKurus ...
 *
 * Gösterim: formatTL(354650) → "3.546,50 ₺"  (her zaman 2 ondalık)
 */

/** Kuruş değeri — plain number, adlandırma ile ayırt edilir */
export type Kurus = number;

/** TL (ondalık) → kuruş. Giriş kapısı; UI'dan gelen değerler için. */
export const kurus = (tlDeger: number): Kurus =>
  Math.round(tlDeger * 100);

/** Kuruş → TL ondalıklı. Hesaplama amaçlı. */
export const tl = (k: Kurus): number => k / 100;

/**
 * Kuruşu gösterimlük TL string'e çevirir — daima 2 ondalık basamak.
 *   100        → "1,00 ₺"
 *   354650     → "3.546,50 ₺"
 *   1234567    → "12.345,67 ₺"
 *   100000000  → "1.000.000,00 ₺"
 *   -354650    → "-3.546,50 ₺"
 */
export const formatTL = (k: Kurus): string =>
  new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(k / 100) + " ₺";

/**
 * Geliştirme modunda kuruş değerinin integer olduğunu kontrol eder.
 * Prod'da hiçbir şey yapmaz (zero overhead).
 */
export function kurusKontrol(k: number): void {
  if (process.env.NODE_ENV !== "production" && !Number.isInteger(k)) {
    console.error("[para] Kuruş integer olmalı:", k);
  }
}
