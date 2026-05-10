import { create } from "zustand";
import { type IsletmeGideri } from "@/lib/kar-zarar-data";
import { type GiderItem, userStoreDB } from "@/lib/db";
import { yayin } from "@/lib/realtime";
import { getKullaniciId } from "@/lib/auth";

interface IsletmeGiderleriStore {
  giderler:       GiderItem[];
  ekle:           (gider: IsletmeGideri) => Promise<void>;
  guncelle:       (id: string, tutar: number) => Promise<void>;
  sil:            (id: string) => Promise<void>;
  syncFromRemote: (giderler: GiderItem[]) => void;
}

async function kaydet(giderler: GiderItem[]) {
  const uid = await getKullaniciId();
  if (uid) await userStoreDB.kaydet(uid, "isletme_giderleri", giderler);
}

export const useIsletmeGiderleri = create<IsletmeGiderleriStore>((set, get) => ({
  giderler: [],

  ekle: async (gider) => {
    const yeni: GiderItem = { ...gider, id: Date.now().toString() };
    set((s) => ({ giderler: [...s.giderler, yeni] }));
    yayin({ tip: "isletme-giderleri", veri: get().giderler });
    await kaydet(get().giderler);
  },

  guncelle: async (id, tutar) => {
    set((s) => ({ giderler: s.giderler.map((g) => g.id === id ? { ...g, tutar } : g) }));
    yayin({ tip: "isletme-giderleri", veri: get().giderler });
    await kaydet(get().giderler);
  },

  sil: async (id) => {
    set((s) => ({ giderler: s.giderler.filter((g) => g.id !== id) }));
    yayin({ tip: "isletme-giderleri", veri: get().giderler });
    await kaydet(get().giderler);
  },

  syncFromRemote: (giderler) => set({ giderler }),
}));
