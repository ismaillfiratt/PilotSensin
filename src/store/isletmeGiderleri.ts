import { create } from "zustand";
import { type IsletmeGideri } from "@/lib/kar-zarar-data";
import { type GiderRow, isletmeGiderleriDB } from "@/lib/db";
import { yayin } from "@/lib/realtime";
import { getKullaniciId } from "@/lib/auth";

// Giderler dbId ile saklanır (silme/güncelleme için UUID lazım)
export type GiderItem = IsletmeGideri & { dbId?: string };

interface IsletmeGiderleriStore {
  giderler:       GiderItem[];
  ekle:           (gider: IsletmeGideri) => Promise<void>;
  guncelle:       (dbId: string, tutar: number) => void;
  sil:            (dbId: string) => void;
  syncFromRemote: (giderler: GiderRow[]) => void;
}

export const useIsletmeGiderleri = create<IsletmeGiderleriStore>((set, get) => ({
  giderler: [],

  ekle: async (gider) => {
    // Optimistik güncelleme
    const temp: GiderItem = { ...gider, dbId: undefined };
    set((s) => ({ giderler: [...s.giderler, temp] }));

    const uid = await getKullaniciId();
    if (uid) {
      const dbId = await isletmeGiderleriDB.ekle(uid, gider);
      // DB'den gelen UUID ile güncelle
      set((s) => ({
        giderler: s.giderler.map((g) =>
          g.kategori === gider.kategori && g.dbId === undefined
            ? { ...g, dbId }
            : g
        ),
      }));
      yayin({ tip: "isletme-giderleri", veri: get().giderler });
    }
  },

  guncelle: (dbId, tutar) => {
    set((s) => ({ giderler: s.giderler.map((g) => g.dbId === dbId ? { ...g, tutar } : g) }));
    isletmeGiderleriDB.guncelle(dbId, tutar);
    yayin({ tip: "isletme-giderleri", veri: get().giderler });
  },

  sil: (dbId) => {
    set((s) => ({ giderler: s.giderler.filter((g) => g.dbId !== dbId) }));
    isletmeGiderleriDB.sil(dbId);
    yayin({ tip: "isletme-giderleri", veri: get().giderler });
  },

  syncFromRemote: (giderler) => set({ giderler }),
}));
