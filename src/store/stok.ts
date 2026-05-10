import { create } from "zustand";
import { stokDurumu, type Urun } from "@/lib/stok-data";
import { yayin } from "@/lib/realtime";
import { userStoreDB } from "@/lib/db";
import { getKullaniciId } from "@/lib/auth";

interface StokStore {
  urunler:        Urun[];
  ekle:           (urun: Omit<Urun, "id">) => Promise<void>;
  guncelle:       (id: string, urun: Partial<Urun>) => Promise<void>;
  sil:            (id: string) => Promise<void>;
  syncFromRemote: (urunler: Urun[]) => void;
}

async function kaydet(urunler: Urun[]) {
  const uid = await getKullaniciId();
  if (uid) await userStoreDB.kaydet(uid, "stok_urunler", urunler);
}

export const useStok = create<StokStore>((set, get) => ({
  urunler: [],

  ekle: async (urun) => {
    const yeni = { ...urun, id: Date.now().toString() };
    set((s) => ({ urunler: [yeni, ...s.urunler] }));
    yayin({ tip: "stok", veri: get().urunler });
    await kaydet(get().urunler);
  },

  guncelle: async (id, urun) => {
    set((s) => ({ urunler: s.urunler.map((u) => u.id === id ? { ...u, ...urun } : u) }));
    yayin({ tip: "stok", veri: get().urunler });
    await kaydet(get().urunler);
  },

  sil: async (id) => {
    set((s) => ({ urunler: s.urunler.filter((u) => u.id !== id) }));
    yayin({ tip: "stok", veri: get().urunler });
    await kaydet(get().urunler);
  },

  syncFromRemote: (urunler) => set({ urunler }),
}));

export { stokDurumu };
