import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { yayin } from "@/lib/realtime";

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

const BASLANGIC: Bildirim[] = [];

export const useBildirimler = create<BildirimStore>()(
  persist(
    (set, get) => ({
      bildirimler: BASLANGIC,

      okunduYap: (id) => {
        set((s) => ({ bildirimler: s.bildirimler.map((b) => b.id === id ? { ...b, okundu: true } : b) }));
        yayin({ tip: "bildirimler", veri: get().bildirimler });
      },
      okunduToggle: (id) => {
        set((s) => ({ bildirimler: s.bildirimler.map((b) => b.id === id ? { ...b, okundu: !b.okundu } : b) }));
        yayin({ tip: "bildirimler", veri: get().bildirimler });
      },
      tumunuOkunduYap: () => {
        set((s) => ({ bildirimler: s.bildirimler.map((b) => ({ ...b, okundu: true })) }));
        yayin({ tip: "bildirimler", veri: get().bildirimler });
      },
      sil: (id) => {
        set((s) => ({ bildirimler: s.bildirimler.filter((b) => b.id !== id) }));
        yayin({ tip: "bildirimler", veri: get().bildirimler });
      },
      tumunuSil: () => {
        set({ bildirimler: [] });
        yayin({ tip: "bildirimler", veri: [] });
      },
      syncFromRemote: (bildirimler) => set({ bildirimler }),
    }),
    {
      name: "pilotsensin-bildirimler",
      storage: createJSONStorage(() => localStorage),
      // Sadece okundu durumunu ve silinen bildirimleri sakla
      partialize: (state) => ({
        bildirimler: state.bildirimler.map(({ id, okundu }) => ({ id, okundu })),
      }),
      merge: (persisted: any, current) => persisted ?? current,
    }
  )
);
