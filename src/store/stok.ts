import { create } from "zustand";
import { persist } from "zustand/middleware";
import { stokDurumu, type Urun, type StokHareketi } from "@/lib/stok-data";
import { yayin } from "@/lib/realtime";
import { storeKaydet } from "@/lib/db";
import { softDeletePatch, softDeleteTemizle, type SilOpts } from "@/lib/softDelete";
import { useUrunMarjAnalizi } from "@/store/urunMarjAnalizi";
import { aktiviteKaydet }    from "@/lib/aktiviteLog";
import { aksiyonKaydet }     from "@/lib/uyari-motoru/aksiyonTakipci";

interface StokStore {
  urunler:        Urun[];
  ekle:           (urun: Omit<Urun, "id">, opts?: { skipSave?: boolean }) => Promise<string>;
  guncelle:       (id: string, urun: Partial<Urun>) => Promise<void>;
  sil:            (id: string, opts?: SilOpts) => Promise<void>;
  geriAl:         (id: string) => Promise<void>;
  kaliciSil:      (id: string) => Promise<void>;
  silinenler:     () => Urun[];
  hareketEkle:    (urunId: string, hareket: Omit<StokHareketi, "id">) => void;
  syncFromRemote: (urunler: Urun[]) => void;
}

async function kaydet(urunler: Urun[]) {
  await storeKaydet("stok_urunler", urunler);
}

export const useStok = create<StokStore>()(
  persist(
    (set, get) => ({
      urunler: [],

      ekle: async (urun, opts) => {
        const yeni = { ...urun, id: crypto.randomUUID() };
        set((s) => ({ urunler: [yeni, ...s.urunler] }));
        useUrunMarjAnalizi.getState().ekleAsBoss(yeni.id);
        yayin({ tip: "stok", veri: get().urunler });
        if (!opts?.skipSave) await kaydet(get().urunler);
        void aktiviteKaydet({ modul: "stok", eylem: "ekle", ozet: `"${urun.ad}" ürünü eklendi`, meta: { urunId: yeni.id, kategori: urun.kategori } });
        aksiyonKaydet("stok");
        return yeni.id;
      },

      guncelle: async (id, urun) => {
        const onceki = get().urunler.find(u => u.id === id);
        set((s) => ({ urunler: s.urunler.map((u) => u.id === id ? { ...u, ...urun } : u) }));
        yayin({ tip: "stok", veri: get().urunler });
        await kaydet(get().urunler);
        void aktiviteKaydet({ modul: "stok", eylem: "guncelle", ozet: `"${onceki?.ad ?? id}" ürünü güncellendi`, meta: { urunId: id } });
        aksiyonKaydet("stok");
      },

      sil: async (id, opts) => {
        const urun = get().urunler.find(u => u.id === id);
        const patch = await softDeletePatch(opts);
        set((s) => ({ urunler: s.urunler.map((u) => u.id === id ? { ...u, ...patch } : u) }));
        yayin({ tip: "stok", veri: get().urunler });
        await kaydet(get().urunler);
        void aktiviteKaydet({ modul: "stok", eylem: "sil", ozet: `"${urun?.ad ?? id}" ürünü silindi`, meta: { urunId: id } });
        aksiyonKaydet("stok");
      },

      geriAl: async (id) => {
        set((s) => ({ urunler: s.urunler.map((u) => u.id === id ? { ...u, ...softDeleteTemizle() } : u) }));
        yayin({ tip: "stok", veri: get().urunler });
        await kaydet(get().urunler);
      },

      kaliciSil: async (id) => {
        useUrunMarjAnalizi.getState().sil(id);
        set((s) => ({ urunler: s.urunler.filter((u) => u.id !== id) }));
        yayin({ tip: "stok", veri: get().urunler });
        await kaydet(get().urunler);
      },

      silinenler: () => get().urunler.filter((u) => u.silindi === true),

      hareketEkle: (urunId, hareket) => {
        set((s) => ({
          urunler: s.urunler.map((u) =>
            u.id === urunId
              ? {
                  ...u,
                  hareketler: [
                    { ...hareket, id: crypto.randomUUID() },
                    ...(u.hareketler ?? []),
                  ].slice(0, 200),
                }
              : u
          ),
        }));
        // Hareket geçmişini persistent storage'a da yaz
        yayin({ tip: "stok", veri: get().urunler });
        kaydet(get().urunler).catch(console.error);
      },

      syncFromRemote: (urunler) => set({ urunler }),
    }),
    {
      name:    "pilot-stok-v1",
      version: 1,
      migrate: (state: unknown, from: number) => {
        if (from === 0) {
          const s = state as { urunler: Array<Record<string, unknown>> };
          return {
            urunler: (s.urunler ?? []).map((u) => ({
              ...u,
              ...(typeof u.birimMaliyetKurus === "number"
                ? { birimMaliyetKurus: Math.round((u.birimMaliyetKurus as number) * 100) }
                : {}),
            })),
          };
        }
        return state;
      },
      partialize: (s) => ({ urunler: s.urunler }),
    }
  )
);

export { stokDurumu };
