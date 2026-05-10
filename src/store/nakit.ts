import { create } from "zustand";
import { type Islem } from "@/lib/nakit-data";
import { yayin } from "@/lib/realtime";
import { userStoreDB } from "@/lib/db";
import { getKullaniciId } from "@/lib/auth";

interface NakitStore {
  islemler:       Islem[];
  ekle:           (islem: Omit<Islem, "id">) => Promise<void>;
  guncelle:       (id: string, islem: Omit<Islem, "id">) => Promise<void>;
  sil:            (id: string) => Promise<void>;
  syncFromRemote: (islemler: Islem[]) => void;
}

async function kaydet(islemler: Islem[]) {
  const uid = await getKullaniciId();
  if (uid) await userStoreDB.kaydet(uid, "nakit_islemler", islemler);
}

export const useNakit = create<NakitStore>((set, get) => ({
  islemler: [],

  ekle: async (islem) => {
    const yeni = { ...islem, id: Date.now().toString() };
    set((s) => ({ islemler: [yeni, ...s.islemler] }));
    yayin({ tip: "nakit", veri: get().islemler });
    await kaydet(get().islemler);
  },

  guncelle: async (id, islem) => {
    set((s) => ({ islemler: s.islemler.map((i) => i.id === id ? { ...islem, id } : i) }));
    yayin({ tip: "nakit", veri: get().islemler });
    await kaydet(get().islemler);
  },

  sil: async (id) => {
    set((s) => ({ islemler: s.islemler.filter((i) => i.id !== id) }));
    yayin({ tip: "nakit", veri: get().islemler });
    await kaydet(get().islemler);
  },

  syncFromRemote: (islemler) => set({ islemler }),
}));
