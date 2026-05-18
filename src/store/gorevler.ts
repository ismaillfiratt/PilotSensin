import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type Gorev, type GorevDurumu } from "@/lib/gorev-data";
import { yayin } from "@/lib/realtime";
import { storeKaydet } from "@/lib/db";
import { softDeletePatch, softDeleteTemizle, type SilOpts } from "@/lib/softDelete";

const VARSAYILAN_SORUMLULAR = ["İsmail", "Ayşe", "Mehmet", "Ali", "Fatma"];

interface GorevStore {
  gorevler:       Gorev[];
  sorumlular:     string[];
  sorumluEkle:    (isim: string) => void;
  sorumluSil:     (isim: string) => void;
  ekle:           (gorev: Omit<Gorev, "id" | "olusturmaTarih">) => Promise<void>;
  guncelle:       (id: string, gorev: Partial<Gorev>) => Promise<void>;
  durumDegis:     (id: string, durum: GorevDurumu) => Promise<void>;
  sil:            (id: string, opts?: SilOpts) => Promise<void>;
  geriAl:         (id: string) => Promise<void>;
  kaliciSil:      (id: string) => Promise<void>;
  silinenler:     () => Gorev[];
  syncFromRemote: (gorevler: Gorev[]) => void;
}

async function kaydet(gorevler: Gorev[]) {
  await storeKaydet("gorevler", gorevler);
}

export const useGorevler = create<GorevStore>()(
  persist(
    (set, get) => ({
      gorevler:   [],
      sorumlular: [...VARSAYILAN_SORUMLULAR],

      sorumluEkle: (isim) => {
        const temiz = isim.trim();
        if (!temiz || get().sorumlular.includes(temiz)) return;
        set((s) => ({ sorumlular: [...s.sorumlular, temiz] }));
      },

      sorumluSil: (isim) => {
        set((s) => ({ sorumlular: s.sorumlular.filter((x) => x !== isim) }));
      },

      ekle: async (gorev) => {
        const yeni: Gorev = { ...gorev, id: crypto.randomUUID(), olusturmaTarih: new Date().toISOString() };
        set((s) => ({ gorevler: [yeni, ...s.gorevler] }));
        yayin({ tip: "gorevler", veri: get().gorevler });
        await kaydet(get().gorevler);
      },

      guncelle: async (id, gorev) => {
        set((s) => ({ gorevler: s.gorevler.map((g) => g.id === id ? { ...g, ...gorev } : g) }));
        yayin({ tip: "gorevler", veri: get().gorevler });
        await kaydet(get().gorevler);
      },

      durumDegis: async (id, durum) => {
        const simdi = new Date().toISOString();
        set((s) => ({
          gorevler: s.gorevler.map((g) =>
            g.id === id
              ? {
                  ...g,
                  durum,
                  tamamlanmaTarihi: durum === "tamamlandi" && !g.tamamlanmaTarihi ? simdi : g.tamamlanmaTarihi,
                  devamaTarihi:     durum === "devam"      && !g.devamaTarihi      ? simdi : g.devamaTarihi,
                }
              : g
          ),
        }));
        yayin({ tip: "gorevler", veri: get().gorevler });
        await kaydet(get().gorevler);
      },

      sil: async (id, opts) => {
        const patch = await softDeletePatch(opts);
        set((s) => ({ gorevler: s.gorevler.map((g) => g.id === id ? { ...g, ...patch } : g) }));
        yayin({ tip: "gorevler", veri: get().gorevler });
        await kaydet(get().gorevler);
      },

      geriAl: async (id) => {
        set((s) => ({ gorevler: s.gorevler.map((g) => g.id === id ? { ...g, ...softDeleteTemizle() } : g) }));
        yayin({ tip: "gorevler", veri: get().gorevler });
        await kaydet(get().gorevler);
      },

      kaliciSil: async (id) => {
        set((s) => ({ gorevler: s.gorevler.filter((g) => g.id !== id) }));
        yayin({ tip: "gorevler", veri: get().gorevler });
        await kaydet(get().gorevler);
      },

      silinenler: () => get().gorevler.filter((g) => g.silindi === true),

      syncFromRemote: (gorevler) => set({ gorevler }),
    }),
    {
      name: "pilot-gorevler-v1",
      partialize: (s) => ({ gorevler: s.gorevler, sorumlular: s.sorumlular }),
    }
  )
);
