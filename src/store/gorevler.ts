import { create } from "zustand";
import { type Gorev, type GorevDurumu } from "@/lib/gorev-data";
import { yayin } from "@/lib/realtime";

interface GorevStore {
  gorevler:       Gorev[];
  ekle:           (gorev: Omit<Gorev, "id" | "olusturmaTarih">) => void;
  guncelle:       (id: string, gorev: Partial<Gorev>) => void;
  durumDegis:     (id: string, durum: GorevDurumu) => void;
  sil:            (id: string) => void;
  syncFromRemote: (gorevler: Gorev[]) => void;
}

export const useGorevler = create<GorevStore>((set, get) => ({
  gorevler: [],

  ekle: (gorev) => {
    set((s) => ({ gorevler: [{ ...gorev, id: Date.now().toString(), olusturmaTarih: new Date().toISOString() }, ...s.gorevler] }));
    yayin({ tip: "gorevler", veri: get().gorevler });
  },
  guncelle: (id, gorev) => {
    set((s) => ({ gorevler: s.gorevler.map((g) => g.id === id ? { ...g, ...gorev } : g) }));
    yayin({ tip: "gorevler", veri: get().gorevler });
  },
  durumDegis: (id, durum) => {
    set((s) => ({ gorevler: s.gorevler.map((g) => g.id === id ? { ...g, durum } : g) }));
    yayin({ tip: "gorevler", veri: get().gorevler });
  },
  sil: (id) => {
    set((s) => ({ gorevler: s.gorevler.filter((g) => g.id !== id) }));
    yayin({ tip: "gorevler", veri: get().gorevler });
  },
  syncFromRemote: (gorevler) => set({ gorevler }),
}));
