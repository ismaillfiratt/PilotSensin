import { create } from "zustand";
import { type Islem } from "@/lib/nakit-data";
import { yayin } from "@/lib/realtime";

interface NakitStore {
  islemler:       Islem[];
  ekle:           (islem: Omit<Islem, "id">) => void;
  guncelle:       (id: string, islem: Omit<Islem, "id">) => void;
  sil:            (id: string) => void;
  syncFromRemote: (islemler: Islem[]) => void;
}

export const useNakit = create<NakitStore>((set, get) => ({
  islemler: [],

  ekle: (islem) => {
    set((s) => ({ islemler: [{ ...islem, id: Date.now().toString() }, ...s.islemler] }));
    yayin({ tip: "nakit", veri: get().islemler });
  },
  guncelle: (id, islem) => {
    set((s) => ({ islemler: s.islemler.map((i) => i.id === id ? { ...islem, id } : i) }));
    yayin({ tip: "nakit", veri: get().islemler });
  },
  sil: (id) => {
    set((s) => ({ islemler: s.islemler.filter((i) => i.id !== id) }));
    yayin({ tip: "nakit", veri: get().islemler });
  },
  syncFromRemote: (islemler) => set({ islemler }),
}));
