/**
 * Uygulama geneli arama altyapısı.
 * Mock bağımlılığı yok; store verisini dışarıdan alır.
 */

import type { Urun }     from "./stok-data";
import type { Islem }    from "./nakit-data";
import type { Gorev }    from "./gorev-data";
import type { Prosedur } from "./prosedur-data";
import type { SatisKaydi } from "@/store/satislar";

export type AramaSonucTip = "stok" | "nakit" | "gorev" | "prosedur" | "urun";

export interface AramaSonucu {
  id:       string;
  tip:      AramaSonucTip;
  baslik:   string;
  altBilgi: string;
  href:     string;
}

export interface AramaVeri {
  stokUrunler:  Urun[];
  nakitIslemler: Islem[];
  gorevler:     Gorev[];
  prosedurler:  Prosedur[];
  satisKayitlari: SatisKaydi[];
}

/** Verilen store verilerinden arama indeksi oluşturur. */
export function aramaIndeksiOlustur(veri: AramaVeri): AramaSonucu[] {
  return [
    ...veri.stokUrunler.map((u) => ({
      id:       `stok-${u.id}`,
      tip:      "stok" as const,
      baslik:   u.ad,
      altBilgi: `Stok → ${u.kategori} · ${u.mevcutAdet} ${u.birim}`,
      href:     "/stok",
    })),

    ...veri.nakitIslemler.slice(0, 100).map((i) => ({
      id:       `nakit-${i.id}`,
      tip:      "nakit" as const,
      baslik:   i.aciklama || i.kategori,
      altBilgi: `Nakit → ${i.tip === "gelir" ? "Gelir" : "Gider"} · ${i.tutarKurus.toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 })}`,
      href:     "/nakit-akisi",
    })),

    ...veri.gorevler.map((g) => ({
      id:       `gorev-${g.id}`,
      tip:      "gorev" as const,
      baslik:   g.baslik,
      altBilgi: `Görevler → ${g.sorumlu} · ${g.durum === "tamamlandi" ? "Tamamlandı" : g.durum === "devam" ? "Devam Ediyor" : "Yapılacak"}`,
      href:     "/gorevler",
    })),

    ...veri.prosedurler.map((p) => ({
      id:       `prosedur-${p.id}`,
      tip:      "prosedur" as const,
      baslik:   p.baslik,
      altBilgi: `Prosedürler → ${p.kategori} · ${p.adimlar.length} adım`,
      href:     "/prosedurler",
    })),

    ...veri.satisKayitlari.slice(0, 100).map((k) => ({
      id:       `satis-${k.id}`,
      tip:      "urun" as const,
      baslik:   k.urunAd,
      altBilgi: `Satış → ${k.kategori} · ${k.adet} adet · ${k.toplamCiroKurus.toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 })}`,
      href:     "/kar-zarar",
    })),
  ];
}

/**
 * Verilen indeks içinde sorgu ile eşleşen sonuçları döner.
 * @param sorgu   Kullanıcının yazdığı metin
 * @param indeks  aramaIndeksiOlustur() çıktısı
 */
export function ara(sorgu: string, indeks: AramaSonucu[]): AramaSonucu[] {
  if (!sorgu || sorgu.trim().length < 2) return [];
  const k = sorgu.toLowerCase().trim();
  return indeks
    .filter((s) => s.baslik.toLowerCase().includes(k) || s.altBilgi.toLowerCase().includes(k))
    .slice(0, 12);
}

export const TIP_ETIKET: Record<AramaSonucTip, string> = {
  stok:     "Stok",
  nakit:    "Nakit Akışı",
  gorev:    "Görev",
  prosedur: "Prosedür",
  urun:     "Satış",
};

export const TIP_RENK: Record<AramaSonucTip, string> = {
  stok:     "#a78bfa",
  nakit:    "#22c55e",
  gorev:    "#fbc024",
  prosedur: "#60a5fa",
  urun:     "#f97316",
};
