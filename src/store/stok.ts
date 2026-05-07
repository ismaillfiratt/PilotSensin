import { create } from "zustand";
import { MOCK_URUNLER, stokDurumu, type Urun } from "@/lib/stok-data";
import { yayin } from "@/lib/realtime";

interface StokStore {
  urunler:        Urun[];
  ekle:           (urun: Omit<Urun, "id">) => void;
  guncelle:       (id: string, urun: Partial<Urun>) => void;
  sil:            (id: string) => void;
  syncFromRemote: (urunler: Urun[]) => void;
}

export const useStok = create<StokStore>((set, get) => ({
  urunler: MOCK_URUNLER,

  ekle: (urun) => {
    set((s) => ({ urunler: [{ ...urun, id: Date.now().toString() }, ...s.urunler] }));
    yayin({ tip: "stok", veri: get().urunler });
  },
  guncelle: (id, urun) => {
    set((s) => ({ urunler: s.urunler.map((u) => u.id === id ? { ...u, ...urun } : u) }));
    yayin({ tip: "stok", veri: get().urunler });
  },
  sil: (id) => {
    set((s) => ({ urunler: s.urunler.filter((u) => u.id !== id) }));
    yayin({ tip: "stok", veri: get().urunler });
  },
  syncFromRemote: (urunler) => set({ urunler }),
}));

export { stokDurumu };
