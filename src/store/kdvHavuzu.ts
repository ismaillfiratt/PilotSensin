import { create } from "zustand";
import { persist } from "zustand/middleware";
import { yayin } from "@/lib/realtime";
import { getKullaniciId } from "@/lib/auth";
import type { Kurus } from "@/lib/para";
import type { Silinebilir } from "@/lib/silinebilir";

export interface KdvKaydi extends Silinebilir {
  id:            string;
  hareketId:     string;
  urunId:        string;
  urunAd:        string;
  tip:           "giris" | "cikis";
  adet:          number;
  birimKdvKurus: Kurus;
  toplamKdvKurus: Kurus;
  tarih:         string;
  islemId?:      string;
}

interface KdvHavuzuStore {
  kayitlar:       KdvKaydi[];
  ekle:           (kayit: Omit<KdvKaydi, "id">) => void;
  hareketSil:     (hareketId: string) => void;
  urunSil:        (urunId: string) => void;
  tumunuSifirla:  () => void;
  silinenler:     () => KdvKaydi[];
  syncFromRemote: (kayitlar: KdvKaydi[]) => void;
}

export const useKdvHavuzu = create<KdvHavuzuStore>()(
  persist(
    (set, get) => ({
      kayitlar: [],
      ekle: (kayit) => {
        set((s) => ({
          kayitlar: [
            { ...kayit, id: crypto.randomUUID() },
            ...s.kayitlar,
          ],
        }));
        yayin({ tip: "kdv-havuzu", veri: get().kayitlar });
      },
      hareketSil: (hareketId) => {
        set((s) => ({ kayitlar: s.kayitlar.filter((k) => k.hareketId !== hareketId) }));
        yayin({ tip: "kdv-havuzu", veri: get().kayitlar });
      },
      urunSil: (urunId) => {
        set((s) => ({ kayitlar: s.kayitlar.filter((k) => k.urunId !== urunId) }));
        yayin({ tip: "kdv-havuzu", veri: get().kayitlar });
      },
      tumunuSifirla: () => {
        set({ kayitlar: [] });
        yayin({ tip: "kdv-havuzu", veri: [] });
      },
      silinenler: () => get().kayitlar.filter((k) => k.silindi === true),
      syncFromRemote: (kayitlar) => set({ kayitlar }),
    }),
    {
      name:    "pilot-kdv-havuzu-v1",
      version: 1,
      migrate: (state: unknown, from: number) => {
        if (from === 0) {
          const s = state as { kayitlar: Array<Record<string, unknown>> };
          return {
            kayitlar: (s.kayitlar ?? []).map((k) => ({
              ...k,
              birimKdvKurus:  Math.round((k.birimKdvKurus  as number ?? k.birimKdvKurus  as number ?? 0) * 100),
              toplamKdvKurus: Math.round((k.toplamKdvKurus as number ?? k.toplamKdvKurus as number ?? 0) * 100),
            })),
          };
        }
        return state;
      },
    }
  )
);

/* ─── Özet hesaplamaları ─── */

export function toplamGirdiKdv(kayitlar: KdvKaydi[]): Kurus {
  return kayitlar
    .filter((k) => k.tip === "giris")
    .reduce((t, k) => t + k.toplamKdvKurus, 0);
}

export function toplamCiktiKdv(kayitlar: KdvKaydi[]): Kurus {
  return kayitlar
    .filter((k) => k.tip === "cikis")
    .reduce((t, k) => t + k.toplamKdvKurus, 0);
}

// Pozitif → ödenecek, Negatif → devreden
export function netKdvBakiye(kayitlar: KdvKaydi[]): Kurus {
  return toplamCiktiKdv(kayitlar) - toplamGirdiKdv(kayitlar);
}
