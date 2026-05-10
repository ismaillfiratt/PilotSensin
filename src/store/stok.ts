import { create } from "zustand";
import { stokDurumu, type Urun } from "@/lib/stok-data";
import { yayin } from "@/lib/realtime";
import { stokDB } from "@/lib/db";
import { createClient } from "@/utils/supabase/client";

interface StokStore {
  urunler:        Urun[];
  ekle:           (urun: Omit<Urun, "id">) => void;
  guncelle:       (id: string, urun: Partial<Urun>) => void;
  sil:            (id: string) => void;
  syncFromRemote: (urunler: Urun[]) => void;
}

async function userId() {
  const { data } = await createClient().auth.getUser();
  return data.user?.id ?? "";
}

export const useStok = create<StokStore>((set, get) => ({
  urunler: [],

  ekle: async (urun) => {
    const yeni = { ...urun, id: Date.now().toString() };
    set((s) => ({ urunler: [yeni, ...s.urunler] }));
    yayin({ tip: "stok", veri: get().urunler });
    const uid = await userId();
    if (uid) await stokDB.ekle(uid, yeni);
  },
  guncelle: async (id, urun) => {
    set((s) => ({ urunler: s.urunler.map((u) => u.id === id ? { ...u, ...urun } : u) }));
    yayin({ tip: "stok", veri: get().urunler });
    await stokDB.guncelle(id, urun);
  },
  sil: async (id) => {
    set((s) => ({ urunler: s.urunler.filter((u) => u.id !== id) }));
    yayin({ tip: "stok", veri: get().urunler });
    await stokDB.sil(id);
  },
  syncFromRemote: (urunler) => set({ urunler }),
}));

export { stokDurumu };
