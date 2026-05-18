import { create } from "zustand";
import { persist } from "zustand/middleware";
import { mevcutBirikim, type FonHedef, type FonIslem } from "@/lib/acil-fon-data";
import { yayin } from "@/lib/realtime";
import { storeKaydet } from "@/lib/db";
import { softDeletePatch, softDeleteTemizle, type SilOpts } from "@/lib/softDelete";

interface AcilFonStore {
  hedefler:       FonHedef[];
  islemler:       FonIslem[];
  aktifHedefId:   string | null;

  hedefEkle:      (h: Omit<FonHedef, "id" | "olusturmaTarih">) => Promise<void>;
  hedefGuncelle:  (id: string, h: Partial<FonHedef>) => Promise<void>;
  hedefSil:       (id: string, opts?: SilOpts) => Promise<void>;
  hedefGeriAl:    (id: string) => Promise<void>;
  hedefKaliciSil: (id: string) => Promise<void>;
  hedefSilinenler:() => FonHedef[];
  setAktifHedef:  (id: string | null) => void;

  islemEkle:      (islem: Omit<FonIslem, "id">) => Promise<void>;
  islemGuncelle:  (id: string, islem: Omit<FonIslem, "id">) => Promise<void>;
  islemSil:       (id: string, opts?: SilOpts) => Promise<void>;
  islemGeriAl:    (id: string) => Promise<void>;
  islemKaliciSil: (id: string) => Promise<void>;
  islemSilinenler:() => FonIslem[];

  mevcut:         (hedefId?: string) => number;

  syncFromRemote: (data: { hedefler: FonHedef[]; islemler: FonIslem[]; aktifHedefId: string | null }) => void;
}

function yayinla(get: () => AcilFonStore) {
  yayin({ tip: "acil-fon", veri: { hedefler: get().hedefler, islemler: get().islemler, aktifHedefId: get().aktifHedefId } });
}

async function kaydetHedefler(hedefler: FonHedef[]) {
  await storeKaydet("acil_fon_hedefler", hedefler);
}

async function kaydetIslemler(islemler: FonIslem[]) {
  await storeKaydet("acil_fon_islemler", islemler);
}

export const useAcilFon = create<AcilFonStore>()(
  persist(
    (set, get) => ({
      hedefler:     [],
      islemler:     [],
      aktifHedefId: null,

      mevcut: (hedefId) => mevcutBirikim(get().islemler.filter(i => !i.silindi), hedefId),

      hedefEkle: async (h) => {
        const yeni: FonHedef = { ...h, id: crypto.randomUUID(), olusturmaTarih: new Date().toISOString() };
        set(s => ({ hedefler: [yeni, ...s.hedefler] }));
        yayinla(get);
        await kaydetHedefler(get().hedefler);
      },
      hedefGuncelle: async (id, h) => {
        set(s => ({ hedefler: s.hedefler.map(x => x.id === id ? { ...x, ...h } : x) }));
        yayinla(get);
        await kaydetHedefler(get().hedefler);
      },
      hedefSil: async (id, opts) => {
        const patch = await softDeletePatch(opts);
        set(s => ({ hedefler: s.hedefler.map(x => x.id === id ? { ...x, ...patch } : x), aktifHedefId: s.aktifHedefId === id ? null : s.aktifHedefId }));
        yayinla(get);
        await kaydetHedefler(get().hedefler);
      },
      hedefGeriAl: async (id) => {
        set(s => ({ hedefler: s.hedefler.map(x => x.id === id ? { ...x, ...softDeleteTemizle() } : x) }));
        yayinla(get);
        await kaydetHedefler(get().hedefler);
      },
      hedefKaliciSil: async (id) => {
        set(s => ({ hedefler: s.hedefler.filter(x => x.id !== id), aktifHedefId: s.aktifHedefId === id ? null : s.aktifHedefId }));
        yayinla(get);
        await kaydetHedefler(get().hedefler);
      },
      hedefSilinenler: () => get().hedefler.filter(h => h.silindi === true),
      setAktifHedef: (id) => set({ aktifHedefId: id }),

      islemEkle: async (islem) => {
        const yeni: FonIslem = { ...islem, id: crypto.randomUUID() };
        set(s => ({ islemler: [yeni, ...s.islemler] }));
        yayinla(get);
        await kaydetIslemler(get().islemler);
      },
      islemGuncelle: async (id, islem) => {
        set(s => ({ islemler: s.islemler.map(x => x.id === id ? { ...islem, id } : x) }));
        yayinla(get);
        await kaydetIslemler(get().islemler);
      },
      islemSil: async (id, opts) => {
        const patch = await softDeletePatch(opts);
        set(s => ({ islemler: s.islemler.map(x => x.id === id ? { ...x, ...patch } : x) }));
        yayinla(get);
        await kaydetIslemler(get().islemler);
      },
      islemGeriAl: async (id) => {
        set(s => ({ islemler: s.islemler.map(x => x.id === id ? { ...x, ...softDeleteTemizle() } : x) }));
        yayinla(get);
        await kaydetIslemler(get().islemler);
      },
      islemKaliciSil: async (id) => {
        set(s => ({ islemler: s.islemler.filter(x => x.id !== id) }));
        yayinla(get);
        await kaydetIslemler(get().islemler);
      },
      islemSilinenler: () => get().islemler.filter(i => i.silindi === true),

      // hedefSil eski adıyla geriye uyumluluk (acil-fon/page.tsx kullanıyor)
      syncFromRemote: (data) => set(data),
    }),
    {
      name:    "pilot-acil-fon-v2",
      version: 1,
      migrate: (state: unknown, from: number) => {
        if (from === 0) {
          const s = state as {
            hedefler:     Array<Record<string, unknown>>;
            islemler:     Array<Record<string, unknown>>;
            aktifHedefId: string | null;
          };
          return {
            aktifHedefId: s.aktifHedefId ?? null,
            hedefler: (s.hedefler ?? []).map((h) => ({
              ...h,
              toplamHedefKurus: Math.round((h.toplamHedefKurus as number) * 100),
              aylikOdemeKurus:  Math.round((h.aylikOdemeKurus  as number) * 100),
            })),
            islemler: (s.islemler ?? []).map((i) => ({
              ...i,
              tutarKurus: Math.round((i.tutarKurus as number) * 100),
            })),
          };
        }
        return state;
      },
      partialize: (s) => ({ hedefler: s.hedefler, islemler: s.islemler, aktifHedefId: s.aktifHedefId }),
    }
  )
);
