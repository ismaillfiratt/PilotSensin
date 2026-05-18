import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface GiderKalemi {
  id:            string;
  ad:            string;
  miktar:        number;
  tip:           "tutar" | "yuzde";
  kdvOrani:      number;            // 0, 1, 10, 20 ...
  kdvDahil:      boolean;
  yüzdeBaz:      "alis" | "satis" | "ozel"; // % hesaplama tabanı
  yüzdeOzelBaz?: number;           // "ozel" seçilince taban tutar
}

export interface UrunMaliyetKayit {
  urunId:              string;
  alisFiyati:          number;
  alisFiyatiKdvOrani:  number;
  alisFiyatiKdvDahil:  boolean;
  satisFiyati:         number;
  satisFiyatiKdvOrani: number;
  giderler:            GiderKalemi[];
}

export const VARSAYILAN_GIDERLER: Omit<GiderKalemi, "id" | "miktar">[] = [
  { ad: "Kargo Ücreti",        tip: "tutar", kdvOrani: 20, kdvDahil: false, yüzdeBaz: "alis" },
  { ad: "Paketleme Malzemesi", tip: "tutar", kdvOrani: 20, kdvDahil: false, yüzdeBaz: "alis" },
  { ad: "Platform Komisyonu",  tip: "yuzde", kdvOrani: 20, kdvDahil: false, yüzdeBaz: "alis" },
];

const VARSAYILAN_KDV_ORANLARI = [0, 1, 10, 20];

interface UrunMaliyetStore {
  kayitlar:       UrunMaliyetKayit[];
  kdvOranlari:    number[];
  upsert:         (kayit: UrunMaliyetKayit) => Promise<void>;
  sil:            (urunId: string) => Promise<void>;
  kdvOraniEkle:   (oran: number) => void;
  kdvOraniSil:    (oran: number) => void;
  syncFromRemote: (kayitlar: UrunMaliyetKayit[]) => void;
}

// @deprecated — Supabase sync kaldırıldı (ADIM 5)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function kaydet(_kayitlar: UrunMaliyetKayit[]) {}

export const useUrunMaliyetler = create<UrunMaliyetStore>()(
  persist(
    (set, get) => ({
      kayitlar:    [],
      kdvOranlari: VARSAYILAN_KDV_ORANLARI,

      upsert: async (kayit) => {
        set((s) => ({
          kayitlar: s.kayitlar.some((k) => k.urunId === kayit.urunId)
            ? s.kayitlar.map((k) => (k.urunId === kayit.urunId ? kayit : k))
            : [...s.kayitlar, kayit],
        }));
        await kaydet(get().kayitlar);
      },

      sil: async (urunId) => {
        set((s) => ({ kayitlar: s.kayitlar.filter((k) => k.urunId !== urunId) }));
        await kaydet(get().kayitlar);
      },

      kdvOraniEkle: (oran) =>
        set((s) => ({
          kdvOranlari: s.kdvOranlari.includes(oran)
            ? s.kdvOranlari
            : [...s.kdvOranlari, oran].sort((a, b) => a - b),
        })),

      kdvOraniSil: (oran) =>
        set((s) => ({
          kdvOranlari: s.kdvOranlari.filter((o) => o !== oran),
        })),

      syncFromRemote: (kayitlar) => set({ kayitlar }),
    }),
    { name: "pilot-urun-maliyet-v4" }
  )
);

/* ─────────────── KDV Hesaplama Motoru (VUK) ─────────────── */

function matraHesapla(brütGiris: number, kdvOrani: number, kdvDahil: boolean): number {
  if (!kdvDahil || kdvOrani === 0) return brütGiris;
  return brütGiris / (1 + kdvOrani / 100);
}

export function alisMatrahi(kayit: UrunMaliyetKayit): number {
  return matraHesapla(kayit.alisFiyati, kayit.alisFiyatiKdvOrani ?? 20, kayit.alisFiyatiKdvDahil ?? false);
}

export function alisFiyatiKdv(kayit: UrunMaliyetKayit): number {
  const oran = kayit.alisFiyatiKdvOrani ?? 20;
  if (!oran) return 0;
  return alisMatrahi(kayit) * oran / 100;
}

// Giderin raw girdi tutarı (yüzdeBaz dahil)
function giderGirdiTutari(g: GiderKalemi, kayit: UrunMaliyetKayit): number {
  if (g.tip !== "yuzde") return g.miktar;
  const baz =
    g.yüzdeBaz === "satis" ? kayit.satisFiyati
    : g.yüzdeBaz === "ozel" ? (g.yüzdeOzelBaz ?? 0)
    : kayit.alisFiyati; // "alis" (default)
  return (baz * g.miktar) / 100;
}

// Giderin matrahi (KDV hariç)
export function giderMatrahi(g: GiderKalemi, kayit: UrunMaliyetKayit): number {
  return matraHesapla(giderGirdiTutari(g, kayit), g.kdvOrani, g.kdvDahil);
}

// Giderin KDV tutarı
export function giderKdvTutari(g: GiderKalemi, kayit: UrunMaliyetKayit): number {
  if (!g.kdvOrani) return 0;
  return giderMatrahi(g, kayit) * g.kdvOrani / 100;
}

// Toplam matrah: ürün + tüm giderler (KDV hariç)
export function toplamMatrah(kayit: UrunMaliyetKayit): number {
  return kayit.giderler.reduce((t, g) => t + giderMatrahi(g, kayit), alisMatrahi(kayit));
}

// Toplam indirilecek KDV
export function toplamIndirilebilirKdv(kayit: UrunMaliyetKayit): number {
  return kayit.giderler.reduce((t, g) => t + giderKdvTutari(g, kayit), alisFiyatiKdv(kayit));
}

// Genel toplam (kasadan çıkan)
export function brütMaliyet(kayit: UrunMaliyetKayit): number {
  return toplamMatrah(kayit) + toplamIndirilebilirKdv(kayit);
}

// Hesaplanan KDV (satıştan tahsil edilen)
export function hesaplananKdv(kayit: UrunMaliyetKayit): number {
  const oran = kayit.satisFiyatiKdvOrani ?? 20;
  if (!oran || !kayit.satisFiyati) return 0;
  return kayit.satisFiyati * oran / 100;
}

// Net KDV: pozitif = ödenecek, negatif = devreden
export function netKdv(kayit: UrunMaliyetKayit): number {
  return hesaplananKdv(kayit) - toplamIndirilebilirKdv(kayit);
}

// Backwards compat
export function toplamMaliyet(kayit: UrunMaliyetKayit): number { return toplamMatrah(kayit); }
export function netKar(kayit: UrunMaliyetKayit): number { return kayit.satisFiyati - toplamMatrah(kayit); }
export function karMarji(kayit: UrunMaliyetKayit): number {
  if (!kayit.satisFiyati) return 0;
  return (netKar(kayit) / kayit.satisFiyati) * 100;
}
