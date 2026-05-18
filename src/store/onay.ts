import { create } from "zustand";
import type { SilinebilirTip } from "@/lib/silinebilir";

export interface OnaySecenek {
  tip:               SilinebilirTip;
  isim:              string;
  kaskadBaglıSayisi: number;
  onayMetni?:        string;
  iptalMetni?:       string;
}

export interface OnayYanit {
  onaylandi: boolean;
  kaskad:    boolean;
}

interface OnayStore {
  acik:         boolean;
  secenek:      OnaySecenek | null;
  cozucu:       ((r: OnayYanit) => void) | null;
  /** Oturum boyunca "bir daha sorma" seçilen tipler — persist edilmez. */
  sessizTipler: Set<SilinebilirTip>;

  ac:                    (s: OnaySecenek) => Promise<OnayYanit>;
  onayla:                (kaskad: boolean) => void;
  vazgec:                () => void;
  bu_oturumdaSusturuldu: (tip: SilinebilirTip) => void;
}

export const useOnay = create<OnayStore>()((set, get) => ({
  acik:         false,
  secenek:      null,
  cozucu:       null,
  sessizTipler: new Set(),

  ac: (secenek) =>
    new Promise<OnayYanit>((coz) => {
      set({ acik: true, secenek, cozucu: coz });
    }),

  onayla: (kaskad) => {
    const { cozucu } = get();
    set({ acik: false, secenek: null, cozucu: null });
    cozucu?.({ onaylandi: true, kaskad });
  },

  vazgec: () => {
    const { cozucu } = get();
    set({ acik: false, secenek: null, cozucu: null });
    cozucu?.({ onaylandi: false, kaskad: false });
  },

  bu_oturumdaSusturuldu: (tip) => {
    set((s) => {
      const yeni = new Set(s.sessizTipler);
      yeni.add(tip);
      return { sessizTipler: yeni };
    });
  },
}));
