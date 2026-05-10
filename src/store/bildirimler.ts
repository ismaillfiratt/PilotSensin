import { create } from "zustand";
import { persist } from "zustand/middleware";
import { yayin } from "@/lib/realtime";
import { userStoreDB } from "@/lib/db";
import { getKullaniciId } from "@/lib/auth";

export type BildirimTip   = "kritik" | "uyari" | "bilgi";
export type BildirimModul =
  | "stok" | "nakit-akisi" | "kar-zarar"
  | "gorevler" | "prosedurler" | "acil-fon" | "sistem";

export interface Bildirim {
  id:          string;
  baslik:      string;
  mesaj:       string;
  tip:         BildirimTip;
  modul:       BildirimModul;
  tarih:       string;
  okundu:      boolean;
  ilgiliLink?: string;
}

interface BildirimStore {
  bildirimler:       Bildirim[];
  sessizModu:        boolean;
  sessizBitis:       string | null; // ISO veya null (süresiz)

  ekle:              (b: Omit<Bildirim, "tarih" | "okundu">) => Promise<void>;
  okunduYap:         (id: string) => void;
  okunduToggle:      (id: string) => void;
  tumunuOkunduYap:   () => void;
  sil:               (id: string) => void;
  tumunuSil:         () => void;
  syncFromRemote:    (bildirimler: Bildirim[]) => void;

  sessizeAl:         (dakika: number | null) => void; // null = süresiz
  sessizModuAc:      () => void;
  sessizKontrol:     () => void; // süresi dolduysa otomatik kapat
}

async function kaydet(bildirimler: Bildirim[]) {
  const uid = await getKullaniciId();
  if (uid) await userStoreDB.kaydet(uid, "bildirimler", bildirimler);
}

export const useBildirimler = create<BildirimStore>()(
  persist(
    (set, get) => ({
      bildirimler: [],
      sessizModu:  false,
      sessizBitis: null,

      ekle: async (b) => {
        if (get().bildirimler.some((m) => m.id === b.id)) return;
        const yeni: Bildirim = { ...b, tarih: new Date().toISOString(), okundu: false };
        set((s) => ({ bildirimler: [yeni, ...s.bildirimler] }));
        yayin({ tip: "bildirimler", veri: get().bildirimler });
        await kaydet(get().bildirimler);
      },

      okunduYap: (id) => {
        set((s) => ({ bildirimler: s.bildirimler.map((b) => b.id === id ? { ...b, okundu: true } : b) }));
        yayin({ tip: "bildirimler", veri: get().bildirimler });
        kaydet(get().bildirimler);
      },
      okunduToggle: (id) => {
        set((s) => ({ bildirimler: s.bildirimler.map((b) => b.id === id ? { ...b, okundu: !b.okundu } : b) }));
        yayin({ tip: "bildirimler", veri: get().bildirimler });
        kaydet(get().bildirimler);
      },
      tumunuOkunduYap: () => {
        set((s) => ({ bildirimler: s.bildirimler.map((b) => ({ ...b, okundu: true })) }));
        yayin({ tip: "bildirimler", veri: get().bildirimler });
        kaydet(get().bildirimler);
      },
      sil: (id) => {
        set((s) => ({ bildirimler: s.bildirimler.filter((b) => b.id !== id) }));
        yayin({ tip: "bildirimler", veri: get().bildirimler });
        kaydet(get().bildirimler);
      },
      tumunuSil: () => {
        set({ bildirimler: [] });
        yayin({ tip: "bildirimler", veri: [] });
        kaydet([]);
      },

      syncFromRemote: (bildirimler) => set({ bildirimler }),

      sessizeAl: (dakika) => {
        const bitis = dakika === null
          ? null
          : new Date(Date.now() + dakika * 60_000).toISOString();
        set({ sessizModu: true, sessizBitis: bitis });
      },

      sessizModuAc: () => set({ sessizModu: false, sessizBitis: null }),

      sessizKontrol: () => {
        const { sessizModu, sessizBitis } = get();
        if (!sessizModu) return;
        if (sessizBitis && new Date(sessizBitis) <= new Date()) {
          set({ sessizModu: false, sessizBitis: null });
        }
      },
    }),
    {
      name: "pilot-bildirimler-v1",
      partialize: (s) => ({
        bildirimler: s.bildirimler,
        sessizModu:  s.sessizModu,
        sessizBitis: s.sessizBitis,
      }),
    }
  )
);
