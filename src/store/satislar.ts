import { create } from "zustand";
import { persist } from "zustand/middleware";
import { storeKaydet } from "@/lib/db";
import { yayin } from "@/lib/realtime";
import { getKullaniciId } from "@/lib/auth";
import type { Kurus } from "@/lib/para";
import type { Silinebilir } from "@/lib/silinebilir";

export interface SatisKaydi extends Silinebilir {
  id:                    string;
  urunId:                string | null;
  urunAd:                string;
  kategori:              string;
  tarih:                 string;
  adet:                  number;
  birimSatisFiyatiKurus: Kurus;
  birimAlisFiyatiKurus:  Kurus;
  birimKarKurus:         Kurus;
  toplamCiroKurus:       Kurus;
  brutKarKurus:          Kurus;
  kdvOrani:              number;
  kdvTutariKurus:        Kurus;
  kasaGirisKurus:        Kurus;
  tip:                   "urun" | "hizmet";
  islemId?:              string;
  iadeEdildi?:           boolean;
}

interface SatislarStore {
  kayitlar:       SatisKaydi[];
  ekle:           (kayit: Omit<SatisKaydi, "id">) => Promise<void>;
  guncelle:       (id: string, guncelleme: Partial<SatisKaydi>) => Promise<void>;
  sil:            (id: string, opts?: import("@/lib/softDelete").SilOpts) => Promise<void>;
  geriAl:         (id: string) => Promise<void>;
  kaliciSil:      (id: string) => Promise<void>;
  silinenler:     () => SatisKaydi[];
  syncFromRemote: (kayitlar: SatisKaydi[]) => void;
}

async function kaydet(kayitlar: SatisKaydi[]) {
  await storeKaydet("satislar", kayitlar);
}

export const useSatislar = create<SatislarStore>()(
  persist(
    (set, get) => ({
      kayitlar: [],

      ekle: async (kayit) => {
        set((s) => ({
          kayitlar: [{ ...kayit, id: crypto.randomUUID() }, ...s.kayitlar],
        }));
        yayin({ tip: "satislar", veri: get().kayitlar });
        await kaydet(get().kayitlar);
      },

      guncelle: async (id, guncelleme) => {
        set((s) => ({ kayitlar: s.kayitlar.map((k) => k.id === id ? { ...k, ...guncelleme } : k) }));
        yayin({ tip: "satislar", veri: get().kayitlar });
        await kaydet(get().kayitlar);
      },

      sil: async (id, opts) => {
        const { softDeletePatch } = await import("@/lib/softDelete");
        const patch = await softDeletePatch(opts);
        set((s) => ({ kayitlar: s.kayitlar.map((k) => k.id === id ? { ...k, ...patch } : k) }));
        yayin({ tip: "satislar", veri: get().kayitlar });
        await kaydet(get().kayitlar);
      },

      geriAl: async (id) => {
        const { softDeleteTemizle } = await import("@/lib/softDelete");
        set((s) => ({ kayitlar: s.kayitlar.map((k) => k.id === id ? { ...k, ...softDeleteTemizle() } : k) }));
        yayin({ tip: "satislar", veri: get().kayitlar });
        await kaydet(get().kayitlar);
      },

      kaliciSil: async (id) => {
        set((s) => ({ kayitlar: s.kayitlar.filter((k) => k.id !== id) }));
        yayin({ tip: "satislar", veri: get().kayitlar });
        await kaydet(get().kayitlar);
      },

      silinenler: () => get().kayitlar.filter((k) => k.silindi === true),

      syncFromRemote: (kayitlar) => set({ kayitlar }),
    }),
    {
      name:    "pilot-satislar-v1",
      version: 1,
      migrate: (state: unknown, from: number) => {
        if (from === 0) {
          const s = state as { kayitlar: Array<Record<string, unknown>> };
          const oldKeys = [
            ["birimSatisFiyatiKurus", "birimSatisFiyatiKurus"],
            ["birimAlisFiyatiKurus",  "birimAlisFiyatiKurus"],
            ["birimKarKurus",         "birimKarKurus"],
            ["toplamCiroKurus",       "toplamCiroKurus"],
            ["brutKarKurus",          "brutKarKurus"],
            ["kdvTutariKurus",        "kdvTutariKurus"],
            ["kasaGirisKurus",        "kasaGirisKurus"],
          ] as const;
          return {
            kayitlar: (s.kayitlar ?? []).map((k) => {
              const updated = { ...k };
              for (const [oldKey, newKey] of oldKeys) {
                const val = updated[oldKey] ?? updated[newKey];
                if (typeof val === "number") {
                  updated[newKey] = Number.isInteger(val) ? val : Math.round(val * 100);
                  delete updated[oldKey];
                }
              }
              return updated;
            }),
          };
        }
        return state;
      },
    }
  )
);

/* ─── Hesaplama yardımcıları ─── */

export function aylikBrutKar(kayitlar: SatisKaydi[]): Kurus {
  const simdi  = new Date();
  const ayBasi = new Date(simdi.getFullYear(), simdi.getMonth(), 1);
  return kayitlar
    .filter((k) => new Date(k.tarih) >= ayBasi)
    .reduce((t, k) => t + k.brutKarKurus, 0);
}

export function aylikCiro(kayitlar: SatisKaydi[]): Kurus {
  const simdi  = new Date();
  const ayBasi = new Date(simdi.getFullYear(), simdi.getMonth(), 1);
  return kayitlar
    .filter((k) => new Date(k.tarih) >= ayBasi)
    .reduce((t, k) => t + k.toplamCiroKurus, 0);
}
