import { create } from "zustand";
import { type Islem } from "@/lib/nakit-data";
import { yayin } from "@/lib/realtime";
import { nakitDB } from "@/lib/db";
import { createClient } from "@/utils/supabase/client";

interface NakitStore {
  islemler:       Islem[];
  ekle:           (islem: Omit<Islem, "id">) => void;
  guncelle:       (id: string, islem: Omit<Islem, "id">) => void;
  sil:            (id: string) => void;
  syncFromRemote: (islemler: Islem[]) => void;
}

async function userId() {
  const { data } = await createClient().auth.getUser();
  return data.user?.id ?? "";
}

export const useNakit = create<NakitStore>((set, get) => ({
  islemler: [],

  ekle: async (islem) => {
    const yeni = { ...islem, id: Date.now().toString() };
    set((s) => ({ islemler: [yeni, ...s.islemler] }));
    yayin({ tip: "nakit", veri: get().islemler });
    const uid = await userId();
    if (uid) await nakitDB.ekle(uid, yeni);
  },
  guncelle: async (id, islem) => {
    const guncellendi = { ...islem, id };
    set((s) => ({ islemler: s.islemler.map((i) => i.id === id ? guncellendi : i) }));
    yayin({ tip: "nakit", veri: get().islemler });
    await nakitDB.guncelle(guncellendi);
  },
  sil: async (id) => {
    set((s) => ({ islemler: s.islemler.filter((i) => i.id !== id) }));
    yayin({ tip: "nakit", veri: get().islemler });
    await nakitDB.sil(id);
  },
  syncFromRemote: (islemler) => set({ islemler }),
}));
