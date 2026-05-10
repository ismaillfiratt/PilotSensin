import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type Gorev, type GorevDurumu } from "@/lib/gorev-data";
import { yayin } from "@/lib/realtime";
import { userStoreDB } from "@/lib/db";
import { getKullaniciId } from "@/lib/auth";

const VARSAYILAN_SORUMLULAR = ["İsmail", "Ayşe", "Mehmet", "Ali", "Fatma"];

interface GorevStore {
  gorevler:       Gorev[];
  sorumlular:     string[];
  sorumluEkle:    (isim: string) => void;
  sorumluSil:     (isim: string) => void;
  ekle:           (gorev: Omit<Gorev, "id" | "olusturmaTarih">) => Promise<void>;
  guncelle:       (id: string, gorev: Partial<Gorev>) => Promise<void>;
  durumDegis:     (id: string, durum: GorevDurumu) => Promise<void>;
  sil:            (id: string) => Promise<void>;
  syncFromRemote: (gorevler: Gorev[]) => void;
}

async function kaydet(gorevler: Gorev[]) {
  const uid = await getKullaniciId();
  if (uid) await userStoreDB.kaydet(uid, "gorevler", gorevler);
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
        const yeni: Gorev = { ...gorev, id: Date.now().toString(), olusturmaTarih: new Date().toISOString() };
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
                  // tamamlanmaTarihi sadece tamamlandıya geçişte set edilir, geri alınmaz
                  tamamlanmaTarihi: durum === "tamamlandi" && !g.tamamlanmaTarihi
                    ? simdi
                    : g.tamamlanmaTarihi,
                }
              : g
          ),
        }));
        yayin({ tip: "gorevler", veri: get().gorevler });
        await kaydet(get().gorevler);
      },

      sil: async (id) => {
        set((s) => ({ gorevler: s.gorevler.filter((g) => g.id !== id) }));
        yayin({ tip: "gorevler", veri: get().gorevler });
        await kaydet(get().gorevler);
      },

      syncFromRemote: (gorevler) => set({ gorevler }),
    }),
    {
      name: "pilot-gorevler-v1",
      partialize: (s) => ({ gorevler: s.gorevler, sorumlular: s.sorumlular }),
    }
  )
);
