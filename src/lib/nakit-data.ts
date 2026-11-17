import type { Kurus } from "@/lib/para";
import type { Silinebilir } from "@/lib/silinebilir";
export { formatTL } from "@/lib/para";

export type IslemTipi = "gelir" | "gider";

export type OdemeyYontemi = "nakit" | "kart" | "havale" | "cek";

export interface Islem extends Silinebilir {
  id: string;
  tip: IslemTipi;
  /** Kuruş cinsinden tutar (örn. 5_000_000 = 50.000 ₺) */
  tutarKurus: Kurus;
  kategori: string;
  aciklama: string;
  tarih: string; // ISO
  odemeYontemi: OdemeyYontemi;
  /** Atomik iş olayı bağlantısı — aynı islemId tüm ilgili kayıtları birleştirir */
  islemId?: string;
  /** Dahili transfer mi? (Acil Fon vb.) — Kar-Zarar'da gelir/gider sayılmaz. */
  transferMi?: boolean;
}

export const GELIR_KATEGORILERI = [
  "Satış", "Hizmet Geliri", "Kira Geliri", "Faiz Geliri", "Diğer Gelir",
];

export const GIDER_KATEGORILERI = [
  "Kira", "Personel", "Tedarik / Hammadde", "Faturalar", "Vergi & SGK",
  "Pazarlama", "Ekipman", "Bakım & Onarım", "Diğer Gider",
];


export interface OzetSatir { etiket: string; gelirKurus: Kurus; giderKurus: Kurus; netKurus: Kurus }

// Günlük: son 24 saat, saatlik gruplar
export function saatlikOzet(islemler: Islem[]): OzetSatir[] {
  const aktif = islemler.filter((x) => !x.silindi);
  const simdi = new Date();
  return Array.from({ length: 24 }, (_, i) => {
    const saat = new Date(simdi);
    saat.setHours(simdi.getHours() - 23 + i, 0, 0, 0);
    const saatSonu = new Date(saat); saatSonu.setMinutes(59, 59, 999);
    const dilim = aktif.filter((x) => { const t = new Date(x.tarih); return t >= saat && t <= saatSonu; });
    const gelirKurus = dilim.filter((x) => x.tip === "gelir").reduce((s, x) => s + x.tutarKurus, 0);
    const giderKurus = dilim.filter((x) => x.tip === "gider").reduce((s, x) => s + x.tutarKurus, 0);
    return { etiket: `${String(saat.getHours()).padStart(2, "0")}:00`, gelirKurus, giderKurus, netKurus: (gelirKurus - giderKurus) };
  });
}

// Haftalık: son 7 gün, günlük gruplar
export function haftalikOzet(islemler: Islem[]): OzetSatir[] {
  const aktif = islemler.filter((x) => !x.silindi);
  return Array.from({ length: 7 }, (_, i) => {
    const gun = new Date(); gun.setDate(gun.getDate() - 6 + i); gun.setHours(0, 0, 0, 0);
    const gunSonu = new Date(gun); gunSonu.setHours(23, 59, 59, 999);
    const dilim = aktif.filter((x) => { const t = new Date(x.tarih); return t >= gun && t <= gunSonu; });
    const gelirKurus = dilim.filter((x) => x.tip === "gelir").reduce((s, x) => s + x.tutarKurus, 0);
    const giderKurus = dilim.filter((x) => x.tip === "gider").reduce((s, x) => s + x.tutarKurus, 0);
    return { etiket: gun.toLocaleDateString("tr-TR", { weekday: "short", day: "numeric" }), gelirKurus, giderKurus, netKurus: (gelirKurus - giderKurus) };
  });
}

// Aylık: son 30 gün, günlük gruplar
export function aylikOzet(islemler: Islem[]): OzetSatir[] {
  const aktif = islemler.filter((x) => !x.silindi);
  return Array.from({ length: 30 }, (_, i) => {
    const gun = new Date(); gun.setDate(gun.getDate() - 29 + i); gun.setHours(0, 0, 0, 0);
    const gunSonu = new Date(gun); gunSonu.setHours(23, 59, 59, 999);
    const dilim = aktif.filter((x) => { const t = new Date(x.tarih); return t >= gun && t <= gunSonu; });
    const gelirKurus = dilim.filter((x) => x.tip === "gelir").reduce((s, x) => s + x.tutarKurus, 0);
    const giderKurus = dilim.filter((x) => x.tip === "gider").reduce((s, x) => s + x.tutarKurus, 0);
    return { etiket: gun.toLocaleDateString("tr-TR", { day: "numeric", month: "short" }), gelirKurus, giderKurus, netKurus: (gelirKurus - giderKurus) };
  });
}

// Özel tarih aralığı: günlük gruplar
export function ozelAralikOzet(baslangic: string, bitis: string, islemler: Islem[]): OzetSatir[] {
  const aktif = islemler.filter((x) => !x.silindi);
  const bas = new Date(baslangic); bas.setHours(0, 0, 0, 0);
  const bit = new Date(bitis);     bit.setHours(23, 59, 59, 999);
  const gunSayisi = Math.round((bit.getTime() - bas.getTime()) / 86400000) + 1;
  return Array.from({ length: gunSayisi }, (_, i) => {
    const gun = new Date(bas); gun.setDate(bas.getDate() + i);
    const gunSonu = new Date(gun); gunSonu.setHours(23, 59, 59, 999);
    const dilim = aktif.filter((x) => { const t = new Date(x.tarih); return t >= gun && t <= gunSonu; });
    const gelirKurus = dilim.filter((x) => x.tip === "gelir").reduce((s, x) => s + x.tutarKurus, 0);
    const giderKurus = dilim.filter((x) => x.tip === "gider").reduce((s, x) => s + x.tutarKurus, 0);
    return { etiket: gun.toLocaleDateString("tr-TR", { day: "numeric", month: "short" }), gelirKurus, giderKurus, netKurus: (gelirKurus - giderKurus) };
  });
}

// Kategori dağılımı — değerler kuruş cinsinden
export function kategoriDagilimi(tip: IslemTipi, islemler: Islem[]) {
  const map: Record<string, number> = {};
  islemler.filter((i) => i.tip === tip && !i.silindi).forEach((i) => {
    map[i.kategori] = (map[i.kategori] || 0) + i.tutarKurus;
  });
  return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}
