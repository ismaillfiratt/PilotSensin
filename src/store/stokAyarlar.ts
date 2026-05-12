import { create } from "zustand";
import { persist } from "zustand/middleware";
import { VARSAYILAN_BIRIMLER, VARSAYILAN_KATEGORILER } from "@/lib/stok-data";

interface StokAyarlarStore {
  birimler:     string[];
  kategoriler:  string[];
  birimEkle:    (b: string) => void;
  birimSil:     (b: string) => void;
  kategoriEkle: (k: string) => void;
  kategoriSil:  (k: string) => void;
}

export const useStokAyarlar = create<StokAyarlarStore>()(
  persist(
    (set) => ({
      birimler:     [...VARSAYILAN_BIRIMLER],
      kategoriler:  [...VARSAYILAN_KATEGORILER],
      birimEkle:    (b) => set((s) => ({ birimler:    [...s.birimler,    b] })),
      birimSil:     (b) => set((s) => ({ birimler:    s.birimler.filter((x) => x !== b) })),
      kategoriEkle: (k) => set((s) => ({ kategoriler: [...s.kategoriler, k] })),
      kategoriSil:  (k) => set((s) => ({ kategoriler: s.kategoriler.filter((x) => x !== k) })),
    }),
    { name: "pilot-stok-ayarlar-v1" }
  )
);
