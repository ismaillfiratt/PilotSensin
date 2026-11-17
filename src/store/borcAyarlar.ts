import { create } from "zustand";
import { persist } from "zustand/middleware";

const VARSAYILAN_TURLER = ["Manuel", "Kira", "Vergi", "Diğer"];

interface BorcAyarlarStore {
  turler:  string[];
  turEkle: (tur: string) => void;
  turSil:  (tur: string) => void;
}

export const useBorcAyarlar = create<BorcAyarlarStore>()(
  persist(
    (set) => ({
      turler:  [...VARSAYILAN_TURLER],
      turEkle: (tur) => set((s) => ({ turler: [...s.turler, tur] })),
      turSil:  (tur) => set((s) => ({ turler: s.turler.filter((t) => t !== tur) })),
    }),
    { name: "pilot-borc-ayarlar-v1" }
  )
);
