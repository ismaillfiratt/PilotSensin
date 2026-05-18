/** Modul düzeyinde bellek — sayfa yenilenmeden sıfırlanmaz */
const sonGonderim = new Map<string, number>();

/**
 * Aynı anahtar için `ms` milisaniyeden daha kısa sürede tekrar çağrılırsa
 * false döner (throttle aktif). İlk çağrı veya süre dolmuşsa true döner.
 *
 * @param anahtar  - Genellikle `"${tip}-${modul}-${baslik}"` formatında
 * @param ms       - Throttle penceresi (varsayılan 60 saniye)
 */
export function throttle(anahtar: string, ms: number = 60_000): boolean {
  const simdi = Date.now();
  const son   = sonGonderim.get(anahtar) ?? 0;
  if (simdi - son < ms) return false;
  sonGonderim.set(anahtar, simdi);
  return true;
}
