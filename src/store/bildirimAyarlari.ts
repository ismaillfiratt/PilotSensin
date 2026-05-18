import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Kurus } from "@/lib/para";
import type { BildirimModul, BildirimTip } from "@/store/bildirimler";

export interface SessizSaat {
  aktif:     boolean;
  baslangic: string;  // "22:00"
  bitis:     string;  // "08:00"
}

interface BildirimAyarlariStore {
  modul:            Record<BildirimModul, boolean>;
  tip:              Record<BildirimTip, boolean>;
  ses:              boolean;
  push:             boolean;
  sessizSaat:       SessizSaat;
  /** 0 = devre dışı */
  kasaMinEsikKurus: Kurus;

  setModul:        (modul: BildirimModul, aktif: boolean) => void;
  setTip:          (tip: BildirimTip, aktif: boolean) => void;
  setSes:          (aktif: boolean) => void;
  setPush:         (aktif: boolean) => void;
  setSessizSaat:   (partial: Partial<SessizSaat>) => void;
  setKasaMinEsik:  (kurus: Kurus) => void;
}

const VARSAYILAN_MODUL: Record<BildirimModul, boolean> = {
  "stok":        true,
  "nakit-akisi": true,
  "kar-zarar":   true,
  "gorevler":    true,
  "prosedurler": true,
  "acil-fon":    true,
  "sistem":      true,
  "ekip":        true,
};

const VARSAYILAN_TIP: Record<BildirimTip, boolean> = {
  kritik: true,
  uyari:  true,
  bilgi:  true,
  basari: true,
};

export const useBildirimAyarlari = create<BildirimAyarlariStore>()(
  persist(
    (set) => ({
      modul:            { ...VARSAYILAN_MODUL },
      tip:              { ...VARSAYILAN_TIP },
      ses:              true,
      push:             false,
      sessizSaat:       { aktif: false, baslangic: "22:00", bitis: "08:00" },
      kasaMinEsikKurus: 0,

      setModul: (modul, aktif) =>
        set((s) => ({ modul: { ...s.modul, [modul]: aktif } })),

      setTip: (tip, aktif) => {
        if (tip === "kritik") return;
        set((s) => ({ tip: { ...s.tip, [tip]: aktif } }));
      },

      setSes:  (aktif) => set({ ses: aktif }),
      setPush: (aktif) => set({ push: aktif }),

      setSessizSaat: (partial) =>
        set((s) => ({ sessizSaat: { ...s.sessizSaat, ...partial } })),

      setKasaMinEsik: (kurus) => set({ kasaMinEsikKurus: kurus }),
    }),
    { name: "pilot-bildirim-ayarlari-v1" }
  )
);
