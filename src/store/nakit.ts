import { create } from "zustand";
import { MOCK_ISLEMLER, type Islem } from "@/lib/nakit-data";

interface NakitStore {
  islemler: Islem[];
  ekle:     (islem: Omit<Islem, "id">) => void;
  guncelle: (id: string, islem: Omit<Islem, "id">) => void;
  sil:      (id: string) => void;
}

export const useNakit = create<NakitStore>((set) => ({
  islemler: MOCK_ISLEMLER,
  ekle:     (islem)     => set((s) => ({ islemler: [{ ...islem, id: Date.now().toString() }, ...s.islemler] })),
  guncelle: (id, islem) => set((s) => ({ islemler: s.islemler.map((i) => i.id === id ? { ...islem, id } : i) })),
  sil:      (id)        => set((s) => ({ islemler: s.islemler.filter((i) => i.id !== id) })),
}));
