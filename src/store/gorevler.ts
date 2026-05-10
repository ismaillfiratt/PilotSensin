import { create } from "zustand";
import { type Gorev, type GorevDurumu } from "@/lib/gorev-data";
import { yayin } from "@/lib/realtime";
import { gorevlerDB } from "@/lib/db";
import { createClient } from "@/utils/supabase/client";

interface GorevStore {
  gorevler:       Gorev[];
  ekle:           (gorev: Omit<Gorev, "id" | "olusturmaTarih">) => void;
  guncelle:       (id: string, gorev: Partial<Gorev>) => void;
  durumDegis:     (id: string, durum: GorevDurumu) => void;
  sil:            (id: string) => void;
  syncFromRemote: (gorevler: Gorev[]) => void;
}

async function userId() {
  const { data } = await createClient().auth.getUser();
  return data.user?.id ?? "";
}

export const useGorevler = create<GorevStore>((set, get) => ({
  gorevler: [],

  ekle: async (gorev) => {
    const yeni: Gorev = { ...gorev, id: Date.now().toString(), olusturmaTarih: new Date().toISOString() };
    set((s) => ({ gorevler: [yeni, ...s.gorevler] }));
    yayin({ tip: "gorevler", veri: get().gorevler });
    const uid = await userId();
    if (uid) await gorevlerDB.ekle(uid, yeni);
  },
  guncelle: async (id, gorev) => {
    set((s) => ({ gorevler: s.gorevler.map((g) => g.id === id ? { ...g, ...gorev } : g) }));
    yayin({ tip: "gorevler", veri: get().gorevler });
    await gorevlerDB.guncelle(id, gorev);
  },
  durumDegis: async (id, durum) => {
    set((s) => ({ gorevler: s.gorevler.map((g) => g.id === id ? { ...g, durum } : g) }));
    yayin({ tip: "gorevler", veri: get().gorevler });
    await gorevlerDB.guncelle(id, { durum });
  },
  sil: async (id) => {
    set((s) => ({ gorevler: s.gorevler.filter((g) => g.id !== id) }));
    yayin({ tip: "gorevler", veri: get().gorevler });
    await gorevlerDB.sil(id);
  },
  syncFromRemote: (gorevler) => set({ gorevler }),
}));
