import { create } from "zustand";
import { type IsletmeGideri } from "@/lib/kar-zarar-data";
import { yayin } from "@/lib/realtime";

interface IsletmeGiderleriStore {
  giderler:       IsletmeGideri[];
  ekle:           (gider: IsletmeGideri) => void;
  guncelle:       (kategori: string, tutar: number) => void;
  sil:            (kategori: string) => void;
  syncFromRemote: (giderler: IsletmeGideri[]) => void;
}

export const useIsletmeGiderleri = create<IsletmeGiderleriStore>((set, get) => ({
  giderler: [],

  ekle: (gider) => {
    set((s) => ({ giderler: [...s.giderler, gider] }));
    yayin({ tip: "isletme-giderleri", veri: get().giderler });
  },
  guncelle: (kategori, tutar) => {
    set((s) => ({ giderler: s.giderler.map((g) => g.kategori === kategori ? { ...g, tutar } : g) }));
    yayin({ tip: "isletme-giderleri", veri: get().giderler });
  },
  sil: (kategori) => {
    set((s) => ({ giderler: s.giderler.filter((g) => g.kategori !== kategori) }));
    yayin({ tip: "isletme-giderleri", veri: get().giderler });
  },
  syncFromRemote: (giderler) => set({ giderler }),
}));
