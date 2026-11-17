import { create } from "zustand";
import { persist } from "zustand/middleware";
import { storeKaydet } from "@/lib/db";
import type { Kurus } from "@/lib/para";
import { useKdvHavuzu } from "@/store/kdvHavuzu";

export type PlanlananTip = "gelir" | "gider";
export type PlanlananKaynak = "manuel" | "kdv_otomatik" | "maas_otomatik";
export type TekrarPeriyot = "gunluk" | "haftalik" | "aylik" | "2ayda1" | "3ayda1";

export interface TekrarlayanKayit {
  id:           string;
  ad:           string;
  tip:          PlanlananTip;
  kategori:     string;
  tutarKurus:   Kurus;
  odemeGunu:    number;
  aktif:        boolean;
  /** Varsayılan: "aylik" — geriye dönük uyum için opsiyonel */
  tekrarPeriyot?: TekrarPeriyot;
}

export interface PlanlananKalem {
  id:          string;
  tip:         PlanlananTip;
  kategori:    string;
  tutarKurus:       Kurus;
  vadeTarihi:  string;
  tamamlandi:  boolean;
  aciklama:    string;
  kaynak:      PlanlananKaynak;
}

interface NakitAkisStore {
  kalemler:       PlanlananKalem[];
  tekrarlayanlar: TekrarlayanKayit[];

  ekle:                (kalem: Omit<PlanlananKalem, "id"> & { id?: string }) => Promise<void>;
  sil:                 (id: string) => Promise<void>;
  tamamla:             (id: string) => Promise<void>;
  tamamlaGeriAl:       (id: string) => Promise<void>;

  tekrarlayanEkle:     (kayit: Omit<TekrarlayanKayit, "id">) => Promise<void>;
  tekrarlayanSil:      (id: string) => Promise<void>;
  tekrarlayanGuncelle: (id: string, partial: Partial<TekrarlayanKayit>) => Promise<void>;

  syncFromRemote: (veri: { kalemler: PlanlananKalem[]; tekrarlayanlar: TekrarlayanKayit[] }) => void;
}

async function kaydet(kalemler: PlanlananKalem[], tekrarlayanlar: TekrarlayanKayit[]) {
  await Promise.all([
    storeKaydet("nakit_planlanan",   kalemler),
    storeKaydet("nakit_tekrarlayan", tekrarlayanlar),
  ]);
}

export const useNakitAkis = create<NakitAkisStore>()(
  persist(
    (set, get) => ({
      kalemler:       [],
      tekrarlayanlar: [],

      ekle: async (kalem) => {
        const id = kalem.id ?? crypto.randomUUID();
        set((s) => ({
          kalemler: [{ ...kalem, id }, ...s.kalemler],
        }));
        const { kalemler, tekrarlayanlar } = get();
        await kaydet(kalemler, tekrarlayanlar);
      },

      sil: async (id) => {
        const kalem = get().kalemler.find((k) => k.id === id);
        if (kalem?.kaynak === "kdv_otomatik") {
          useKdvHavuzu.getState().isaretiKaldir(id);
        }
        set((s) => ({ kalemler: s.kalemler.filter((k) => k.id !== id) }));
        const { kalemler, tekrarlayanlar } = get();
        await kaydet(kalemler, tekrarlayanlar);
      },

      tamamla: async (id) => {
        set((s) => ({
          kalemler: s.kalemler.map((k) => k.id === id ? { ...k, tamamlandi: true } : k),
        }));
        const { kalemler, tekrarlayanlar } = get();
        await kaydet(kalemler, tekrarlayanlar);
      },

      tamamlaGeriAl: async (id) => {
        set((s) => ({
          kalemler: s.kalemler.map((k) => k.id === id ? { ...k, tamamlandi: false } : k),
        }));
        const { kalemler, tekrarlayanlar } = get();
        await kaydet(kalemler, tekrarlayanlar);
      },

      tekrarlayanEkle: async (kayit) => {
        set((s) => ({
          tekrarlayanlar: [...s.tekrarlayanlar, { ...kayit, id: crypto.randomUUID() }],
        }));
        const { kalemler, tekrarlayanlar } = get();
        await kaydet(kalemler, tekrarlayanlar);
      },

      tekrarlayanSil: async (id) => {
        set((s) => ({ tekrarlayanlar: s.tekrarlayanlar.filter((k) => k.id !== id) }));
        const { kalemler, tekrarlayanlar } = get();
        await kaydet(kalemler, tekrarlayanlar);
      },

      tekrarlayanGuncelle: async (id, partial) => {
        set((s) => ({
          tekrarlayanlar: s.tekrarlayanlar.map((k) => k.id === id ? { ...k, ...partial } : k),
        }));
        const { kalemler, tekrarlayanlar } = get();
        await kaydet(kalemler, tekrarlayanlar);
      },

      syncFromRemote: ({ kalemler, tekrarlayanlar }) =>
        set({ kalemler, tekrarlayanlar }),
    }),
    {
      name:    "pilot-nakit-akis-v1",
      version: 1,
      migrate: (state: unknown, from: number) => {
        if (from === 0) {
          const s = state as {
            kalemler:       Array<Record<string, unknown>>;
            tekrarlayanlar: Array<Record<string, unknown>>;
          };
          return {
            kalemler: (s.kalemler ?? []).map((k) => ({
              ...k,
              tutarKurus: Math.round((k.tutarKurus as number) * 100),
            })),
            tekrarlayanlar: (s.tekrarlayanlar ?? []).map((t) => ({
              ...t,
              tutarKurus: Math.round((t.tutarKurus as number) * 100),
            })),
          };
        }
        return state;
      },
    }
  )
);
