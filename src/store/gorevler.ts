import { create } from "zustand";
import { MOCK_GOREVLER, type Gorev, type GorevDurumu } from "@/lib/gorev-data";

interface GorevStore {
  gorevler: Gorev[];
  ekle:       (gorev: Omit<Gorev, "id" | "olusturmaTarih">) => void;
  guncelle:   (id: string, gorev: Partial<Gorev>) => void;
  durumDegis: (id: string, durum: GorevDurumu) => void;
  sil:        (id: string) => void;
}

export const useGorevler = create<GorevStore>((set) => ({
  gorevler: MOCK_GOREVLER,
  ekle: (gorev) => set((s) => ({
    gorevler: [{ ...gorev, id: Date.now().toString(), olusturmaTarih: new Date().toISOString() }, ...s.gorevler],
  })),
  guncelle:   (id, gorev) => set((s) => ({ gorevler: s.gorevler.map((g) => g.id === id ? { ...g, ...gorev } : g) })),
  durumDegis: (id, durum) => set((s) => ({ gorevler: s.gorevler.map((g) => g.id === id ? { ...g, durum } : g) })),
  sil:        (id)        => set((s) => ({ gorevler: s.gorevler.filter((g) => g.id !== id) })),
}));
