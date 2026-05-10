import { create } from "zustand";
import { yayin } from "@/lib/realtime";
import { bildirimlerDB } from "@/lib/db";
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
  bildirimler:    Bildirim[];
  okunduYap:      (id: string) => void;
  okunduToggle:   (id: string) => void;
  tumunuOkunduYap: () => void;
  sil:            (id: string) => void;
  tumunuSil:      () => void;
  syncFromRemote: (bildirimler: Bildirim[]) => void;
}

export const useBildirimler = create<BildirimStore>((set, get) => ({
  bildirimler: [],

  okunduYap: (id) => {
    set((s) => ({ bildirimler: s.bildirimler.map((b) => b.id === id ? { ...b, okundu: true } : b) }));
    yayin({ tip: "bildirimler", veri: get().bildirimler });
    bildirimlerDB.guncelle(id, true);
  },
  okunduToggle: (id) => {
    const yeniDurum = !(get().bildirimler.find(b => b.id === id)?.okundu ?? false);
    set((s) => ({ bildirimler: s.bildirimler.map((b) => b.id === id ? { ...b, okundu: yeniDurum } : b) }));
    yayin({ tip: "bildirimler", veri: get().bildirimler });
    bildirimlerDB.guncelle(id, yeniDurum);
  },
  tumunuOkunduYap: async () => {
    set((s) => ({ bildirimler: s.bildirimler.map((b) => ({ ...b, okundu: true })) }));
    yayin({ tip: "bildirimler", veri: get().bildirimler });
    const uid = await getKullaniciId();
    if (uid) bildirimlerDB.tumunuGuncelle(uid);
  },
  sil: (id) => {
    set((s) => ({ bildirimler: s.bildirimler.filter((b) => b.id !== id) }));
    yayin({ tip: "bildirimler", veri: get().bildirimler });
    bildirimlerDB.sil(id);
  },
  tumunuSil: async () => {
    set({ bildirimler: [] });
    yayin({ tip: "bildirimler", veri: [] });
    const uid = await getKullaniciId();
    if (uid) bildirimlerDB.tumunuSil(uid);
  },
  syncFromRemote: (bildirimler) => set({ bildirimler }),
}));
