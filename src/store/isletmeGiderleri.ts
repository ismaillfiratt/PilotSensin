import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type IsletmeGideri } from "@/lib/kar-zarar-data";
import { type GiderItem, storeKaydet } from "@/lib/db";
import { yayin } from "@/lib/realtime";
import { softDeletePatch, softDeleteTemizle, type SilOpts } from "@/lib/softDelete";

interface IsletmeGiderleriStore {
  giderler:       GiderItem[];
  ekle:           (gider: IsletmeGideri) => Promise<void>;
  guncelle:       (id: string, guncelleme: Partial<IsletmeGideri>) => Promise<void>;
  sil:            (id: string, opts?: SilOpts) => Promise<void>;
  geriAl:         (id: string) => Promise<void>;
  kaliciSil:      (id: string) => Promise<void>;
  silinenler:     () => GiderItem[];
  syncFromRemote: (giderler: GiderItem[]) => void;
}

async function kaydet(giderler: GiderItem[]) {
  await storeKaydet("isletme_giderleri", giderler);
}

export const useIsletmeGiderleri = create<IsletmeGiderleriStore>()(
  persist(
    (set, get) => ({
      giderler: [],

      ekle: async (gider) => {
        const yeni: GiderItem = { ...gider, id: crypto.randomUUID() };
        set((s) => ({ giderler: [...s.giderler, yeni] }));
        yayin({ tip: "isletme-giderleri", veri: get().giderler });
        await kaydet(get().giderler);
      },

      guncelle: async (id, guncelleme) => {
        set((s) => ({ giderler: s.giderler.map((g) => g.id === id ? { ...g, ...guncelleme } : g) }));
        yayin({ tip: "isletme-giderleri", veri: get().giderler });
        await kaydet(get().giderler);
      },

      sil: async (id, opts) => {
        const patch = await softDeletePatch(opts);
        set((s) => ({ giderler: s.giderler.map((g) => g.id === id ? { ...g, ...patch } : g) }));
        yayin({ tip: "isletme-giderleri", veri: get().giderler });
        await kaydet(get().giderler);
      },

      geriAl: async (id) => {
        set((s) => ({ giderler: s.giderler.map((g) => g.id === id ? { ...g, ...softDeleteTemizle() } : g) }));
        yayin({ tip: "isletme-giderleri", veri: get().giderler });
        await kaydet(get().giderler);
      },

      kaliciSil: async (id) => {
        set((s) => ({ giderler: s.giderler.filter((g) => g.id !== id) }));
        yayin({ tip: "isletme-giderleri", veri: get().giderler });
        await kaydet(get().giderler);
      },

      silinenler: () => get().giderler.filter((g) => g.silindi === true),

      syncFromRemote: (giderler) => {
        const mevcutlar = get().giderler;
        if (giderler.length === 0 && mevcutlar.length > 0) return;
        set({ giderler });
      },
    }),
    {
      name:    "pilot-giderler-v1",
      version: 1,
      migrate: (state: unknown, from: number) => {
        if (from === 0) {
          const s = state as { giderler: Array<Record<string, unknown>> };
          return {
            giderler: (s.giderler ?? []).map((g) => ({
              ...g,
              tutarKurus: Math.round((g.tutarKurus as number) * 100),
            })),
          };
        }
        return state;
      },
      partialize: (s) => ({ giderler: s.giderler }),
    }
  )
);
