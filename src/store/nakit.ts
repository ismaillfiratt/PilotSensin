import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type Islem } from "@/lib/nakit-data";
import { yayin } from "@/lib/realtime";
import { storeKaydet } from "@/lib/db";
import { softDeletePatch, softDeleteTemizle, type SilOpts } from "@/lib/softDelete";
import { aktiviteKaydet } from "@/lib/aktiviteLog";
import { aksiyonKaydet }  from "@/lib/uyari-motoru/aksiyonTakipci";

interface NakitStore {
  islemler:       Islem[];
  ekle:           (islem: Omit<Islem, "id">) => Promise<void>;
  guncelle:       (id: string, islem: Omit<Islem, "id">) => Promise<void>;
  sil:            (id: string, opts?: SilOpts) => Promise<void>;
  geriAl:         (id: string) => Promise<void>;
  kaliciSil:      (id: string) => Promise<void>;
  silinenler:     () => Islem[];
  syncFromRemote: (islemler: Islem[]) => void;
}

async function kaydet(islemler: Islem[]) {
  await storeKaydet("nakit_islemler", islemler);
}

export const useNakit = create<NakitStore>()(
  persist(
    (set, get) => ({
      islemler: [],

      ekle: async (islem) => {
        const yeni = { ...islem, id: crypto.randomUUID() };
        set((s) => ({ islemler: [yeni, ...s.islemler] }));
        yayin({ tip: "nakit", veri: get().islemler });
        await kaydet(get().islemler);
        const tutar = (islem.tutarKurus / 100).toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });
        void aktiviteKaydet({ modul: "nakit", eylem: islem.tip, ozet: `${islem.tip === "gelir" ? "Gelir" : "Gider"} kaydedildi: ${tutar}`, meta: { islemId: yeni.id, kategori: islem.kategori } });
        aksiyonKaydet("nakit-akisi");
      },

      guncelle: async (id, islem) => {
        set((s) => ({ islemler: s.islemler.map((i) => i.id === id ? { ...islem, id } : i) }));
        yayin({ tip: "nakit", veri: get().islemler });
        await kaydet(get().islemler);
        void aktiviteKaydet({ modul: "nakit", eylem: "guncelle", ozet: `Nakit işlem güncellendi`, meta: { islemId: id } });
        aksiyonKaydet("nakit-akisi");
      },

      sil: async (id, opts) => {
        const islem = get().islemler.find(i => i.id === id);
        const patch = await softDeletePatch(opts);
        set((s) => ({ islemler: s.islemler.map((i) => i.id === id ? { ...i, ...patch } : i) }));
        yayin({ tip: "nakit", veri: get().islemler });
        await kaydet(get().islemler);
        void aktiviteKaydet({ modul: "nakit", eylem: "sil", ozet: `${islem?.tip === "gelir" ? "Gelir" : "Gider"} kaydı silindi`, meta: { islemId: id } });
        aksiyonKaydet("nakit-akisi");
      },

      geriAl: async (id) => {
        set((s) => ({ islemler: s.islemler.map((i) => i.id === id ? { ...i, ...softDeleteTemizle() } : i) }));
        yayin({ tip: "nakit", veri: get().islemler });
        await kaydet(get().islemler);
      },

      kaliciSil: async (id) => {
        set((s) => ({ islemler: s.islemler.filter((i) => i.id !== id) }));
        yayin({ tip: "nakit", veri: get().islemler });
        await kaydet(get().islemler);
      },

      silinenler: () => get().islemler.filter((i) => i.silindi === true),

      syncFromRemote: (islemler) => set({ islemler }),
    }),
    {
      name:    "pilot-nakit-v1",
      version: 1,
      migrate: (state: unknown, from: number) => {
        if (from === 0) {
          const s = state as { islemler: Array<Record<string, unknown>> };
          return {
            islemler: (s.islemler ?? []).map((i) => ({
              ...i,
              tutarKurus: Math.round((i.tutarKurus as number) * 100),
            })),
          };
        }
        return state;
      },
      partialize: (s) => ({ islemler: s.islemler }),
    }
  )
);
