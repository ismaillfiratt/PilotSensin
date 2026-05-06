import { create } from "zustand";
import { MOCK_URUNLER, stokDurumu, type Urun } from "@/lib/stok-data";

interface StokStore {
  urunler: Urun[];
  ekle:    (urun: Omit<Urun, "id">) => void;
  guncelle:(id: string, urun: Partial<Urun>) => void;
  sil:     (id: string) => void;
}

export const useStok = create<StokStore>((set) => ({
  urunler: MOCK_URUNLER,
  ekle:    (urun)     => set((s) => ({ urunler: [{ ...urun, id: Date.now().toString() }, ...s.urunler] })),
  guncelle:(id, urun) => set((s) => ({ urunler: s.urunler.map((u) => u.id === id ? { ...u, ...urun } : u) })),
  sil:     (id)       => set((s) => ({ urunler: s.urunler.filter((u) => u.id !== id) })),
}));

export { stokDurumu };
