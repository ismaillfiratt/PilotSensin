import { create } from "zustand";
import { persist } from "zustand/middleware";
import { GELIR_KATEGORILERI, GIDER_KATEGORILERI } from "@/lib/nakit-data";

export interface OdemeYontemi {
  value: string;
  label: string;
}

const VARSAYILAN_ODEME: OdemeYontemi[] = [
  { value: "nakit",   label: "Nakit" },
  { value: "kart",    label: "Kart" },
  { value: "havale",  label: "Havale / EFT" },
  { value: "cek",     label: "Çek" },
];

interface NakitAyarlarStore {
  gelirKategoriler: string[];
  giderKategoriler: string[];
  odemeYontemleri:  OdemeYontemi[];
  kategoriEkle:     (tip: "gelir" | "gider", k: string) => void;
  kategoriSil:      (tip: "gelir" | "gider", k: string) => void;
  odemeEkle:        (value: string, label: string) => void;
  odemeSil:         (value: string) => void;
}

export const useNakitAyarlar = create<NakitAyarlarStore>()(
  persist(
    (set) => ({
      gelirKategoriler: [...GELIR_KATEGORILERI],
      giderKategoriler: [...GIDER_KATEGORILERI],
      odemeYontemleri:  [...VARSAYILAN_ODEME],

      kategoriEkle: (tip, k) =>
        set((s) => {
          const alan = tip === "gelir" ? "gelirKategoriler" : "giderKategoriler";
          if (s[alan].includes(k)) return s;
          return { [alan]: [...s[alan], k] };
        }),

      kategoriSil: (tip, k) =>
        set((s) => {
          const alan = tip === "gelir" ? "gelirKategoriler" : "giderKategoriler";
          return { [alan]: s[alan].filter((c) => c !== k) };
        }),

      odemeEkle: (value, label) =>
        set((s) => {
          if (s.odemeYontemleri.some((o) => o.value === value)) return s;
          return { odemeYontemleri: [...s.odemeYontemleri, { value, label }] };
        }),

      odemeSil: (value) =>
        set((s) => ({
          odemeYontemleri: s.odemeYontemleri.filter((o) => o.value !== value),
        })),
    }),
    { name: "pilot-nakit-ayarlar-v1" }
  )
);
