import { create } from "zustand";
import { yayin } from "@/lib/realtime";
import { userStoreDB } from "@/lib/db";
import { getKullaniciId } from "@/lib/auth";

export type BildirimTip = "kritik" | "uyari" | "bilgi";
export type BildirimModul =
  | "stok" | "nakit-akisi" | "kar-zarar"
  | "gorevler" | "prosedurler" | "acil-fon" | "sistem";

export interface Bildirim {
  id: string;
  baslik: string;
  mesaj: string;
  tip: BildirimTip;
  modul: BildirimModul;
  tarih: string;
  okundu: boolean;
}

interface BildirimStore {
  bildirimler:      Bildirim[];
  okunduYap:        (id: string) => void;
  okunduToggle:     (id: string) => void;
  tumunuOkunduYap:  () => void;
  sil:              (id: string) => void;
  tumunuSil:        () => void;
  syncFromRemote:   (bildirimler: Bildirim[]) => void;
}

async function kaydet(bildirimler: Bildirim[]) {
  const uid = await getKullaniciId();
  if (uid) await userStoreDB.kaydet(uid, "bildirimler", bildirimler);
}

export const useBildirimler = create<BildirimStore>((set, get) => ({
  bildirimler: [],

  okunduYap: (id) => {
    set((s) => ({ bildirimler: s.bildirimler.map((b) => b.id === id ? { ...b, okundu: true } : b) }));
    yayin({ tip: "bildirimler", veri: get().bildirimler });
    kaydet(get().bildirimler);
  },

  okunduToggle: (id) => {
    set((s) => ({ bildirimler: s.bildirimler.map((b) => b.id === id ? { ...b, okundu: !b.okundu } : b) }));
    yayin({ tip: "bildirimler", veri: get().bildirimler });
    kaydet(get().bildirimler);
  },

  tumunuOkunduYap: () => {
    set((s) => ({ bildirimler: s.bildirimler.map((b) => ({ ...b, okundu: true })) }));
    yayin({ tip: "bildirimler", veri: get().bildirimler });
    kaydet(get().bildirimler);
  },

  sil: (id) => {
    set((s) => ({ bildirimler: s.bildirimler.filter((b) => b.id !== id) }));
    yayin({ tip: "bildirimler", veri: get().bildirimler });
    kaydet(get().bildirimler);
  },

  tumunuSil: () => {
    set({ bildirimler: [] });
    yayin({ tip: "bildirimler", veri: [] });
    kaydet([]);
  },

  syncFromRemote: (bildirimler) => set({ bildirimler }),
}));
