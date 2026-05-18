"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CerezTercihleri {
  zorunlu:      true;
  fonksiyonel:  boolean;
  analitik:     boolean;
  pazarlama:    boolean;
  karar_tarihi: string;
}

interface CerezStore {
  tercihler:    CerezTercihleri | null;
  bannerAcik:   boolean;
  kabulEt:      (secimler: Omit<CerezTercihleri, "zorunlu" | "karar_tarihi">) => void;
  reddet:       () => void;
  bannerAc:     () => void;
  bannerKapat:  () => void;
}

export const useCerez = create<CerezStore>()(
  persist(
    (set) => ({
      tercihler:   null,
      bannerAcik:  false,

      kabulEt: (secimler) => set({
        tercihler: {
          zorunlu:      true,
          fonksiyonel:  secimler.fonksiyonel,
          analitik:     secimler.analitik,
          pazarlama:    secimler.pazarlama,
          karar_tarihi: new Date().toISOString(),
        },
        bannerAcik: false,
      }),

      reddet: () => set({
        tercihler: {
          zorunlu:      true,
          fonksiyonel:  false,
          analitik:     false,
          pazarlama:    false,
          karar_tarihi: new Date().toISOString(),
        },
        bannerAcik: false,
      }),

      bannerAc:    () => set({ bannerAcik: true }),
      bannerKapat: () => set({ bannerAcik: false }),
    }),
    {
      name: "cerez_tercihi",
      partialize: (s) => ({ tercihler: s.tercihler }),
    }
  )
);
