import { create } from "zustand";
import { type Gorev, type GorevDurumu } from "@/lib/gorev-data";
import { yayin } from "@/lib/realtime";
import { userStoreDB } from "@/lib/db";
import { getKullaniciId } from "@/lib/auth";

interface GorevStore {
  gorevler:       Gorev[];
  ekle:           (gorev: Omit<Gorev, "id" | "olusturmaTarih">) => Promise<void>;
  guncelle:       (id: string, gorev: Partial<Gorev>) => Promise<void>;
  durumDegis:     (id: string, durum: GorevDurumu) => Promise<void>;
  sil:            (id: string) => Promise<void>;
  syncFromRemote: (gorevler: Gorev[]) => void;
}

async function kaydet(gorevler: Gorev[]) {
  const uid = await getKullaniciId();
  if (uid) await userStoreDB.kaydet(uid, "gorevler", gorevler);
}

export const useGorevler = create<GorevStore>((set, get) => ({
  gorevler: [],

  ekle: async (gorev) => {
    const yeni: Gorev = { ...gorev, id: Date.now().toString(), olusturmaTarih: new Date().toISOString() };
    set((s) => ({ gorevler: [yeni, ...s.gorevler] }));
    yayin({ tip: "gorevler", veri: get().gorevler });
    await kaydet(get().gorevler);
  },

  guncelle: async (id, gorev) => {
    set((s) => ({ gorevler: s.gorevler.map((g) => g.id === id ? { ...g, ...gorev } : g) }));
    yayin({ tip: "gorevler", veri: get().gorevler });
    await kaydet(get().gorevler);
  },

  durumDegis: async (id, durum) => {
    set((s) => ({ gorevler: s.gorevler.map((g) => g.id === id ? { ...g, durum } : g) }));
    yayin({ tip: "gorevler", veri: get().gorevler });
    await kaydet(get().gorevler);
  },

  sil: async (id) => {
    set((s) => ({ gorevler: s.gorevler.filter((g) => g.id !== id) }));
    yayin({ tip: "gorevler", veri: get().gorevler });
    await kaydet(get().gorevler);
  },

  syncFromRemote: (gorevler) => set({ gorevler }),
}));
