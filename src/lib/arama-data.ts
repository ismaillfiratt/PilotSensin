import { MOCK_URUNLER as STOK_URUNLER } from "./stok-data";
import { MOCK_ISLEMLER as NAKIT_ISLEMLER } from "./nakit-data";
import { MOCK_GOREVLER } from "./gorev-data";
import { MOCK_PROSEDURLER } from "./prosedur-data";
import { MOCK_URUNLER as KZ_URUNLER } from "./kar-zarar-data";

export type AramaSonucTip = "stok" | "nakit" | "gorev" | "prosedur" | "urun";

export interface AramaSonucu {
  id: string;
  tip: AramaSonucTip;
  baslik: string;
  altBilgi: string;
  href: string;
}

const TUM_SONUCLAR: AramaSonucu[] = [
  ...STOK_URUNLER.map((u) => ({
    id: `stok-${u.id}`,
    tip: "stok" as const,
    baslik: u.ad,
    altBilgi: `Stok → ${u.kategori} · ${u.mevcutAdet} ${u.birim}`,
    href: "/stok",
  })),

  ...NAKIT_ISLEMLER.map((i) => ({
    id: `nakit-${i.id}`,
    tip: "nakit" as const,
    baslik: i.aciklama || i.kategori,
    altBilgi: `Nakit Akışı → ${i.tip === "gelir" ? "Gelir" : "Gider"} · ₺${i.tutar.toLocaleString("tr-TR")}`,
    href: "/nakit-akisi",
  })),

  ...MOCK_GOREVLER.map((g) => ({
    id: `gorev-${g.id}`,
    tip: "gorev" as const,
    baslik: g.baslik,
    altBilgi: `Görevler → ${g.sorumlu} · ${g.durum === "tamamlandi" ? "Tamamlandı" : g.durum === "devam" ? "Devam Ediyor" : "Yapılacak"}`,
    href: "/gorevler",
  })),

  ...MOCK_PROSEDURLER.map((p) => ({
    id: `prosedur-${p.id}`,
    tip: "prosedur" as const,
    baslik: p.baslik,
    altBilgi: `Prosedürler → ${p.kategori} · ${p.adimlar.length} adım`,
    href: "/prosedurler",
  })),

  ...KZ_URUNLER.map((u) => ({
    id: `kz-${u.id}`,
    tip: "urun" as const,
    baslik: u.ad,
    altBilgi: `Kar-Zarar → ${u.kategori} · ₺${u.satisFiyati} satış`,
    href: "/kar-zarar",
  })),
];

export function ara(sorgu: string): AramaSonucu[] {
  if (!sorgu || sorgu.trim().length < 2) return [];
  const k = sorgu.toLowerCase().trim();
  return TUM_SONUCLAR.filter(
    (s) =>
      s.baslik.toLowerCase().includes(k) ||
      s.altBilgi.toLowerCase().includes(k)
  ).slice(0, 12);
}

export const TIP_ETIKET: Record<AramaSonucTip, string> = {
  stok:     "Stok",
  nakit:    "Nakit Akışı",
  gorev:    "Görev",
  prosedur: "Prosedür",
  urun:     "Ürün",
};

export const TIP_RENK: Record<AramaSonucTip, string> = {
  stok:     "#a78bfa",
  nakit:    "#22c55e",
  gorev:    "#fbc024",
  prosedur: "#60a5fa",
  urun:     "#f97316",
};
