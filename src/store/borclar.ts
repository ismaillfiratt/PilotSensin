import { create } from "zustand";
import { persist } from "zustand/middleware";
import { yayin } from "@/lib/realtime";
import { storeKaydet } from "@/lib/db";
import { useSirket } from "@/store/sirket";
import type { Borc, Taksit } from "@/lib/borc-data";

/* ═══════════════════════════════════════════════════════
   useBorclar — vadeli/taksitli ödeme store'u
   ═══════════════════════════════════════════════════════ */

interface BorclarStore {
  borclar: Borc[];

  /** Yeni borç ekle. taksitler de aynı obje içinde gelir. */
  ekle: (borc: Omit<Borc, "id" | "olusturmaTarihi">) => Promise<Borc>;

  /** Borcu güncelle (örn. aciklama, taksitler tamamen değiştirme) */
  guncelle: (id: string, yama: Partial<Omit<Borc, "id">>) => Promise<void>;

  /** Borcu soft-delete et (ve bağlı tüm taksitler) */
  sil: (id: string) => Promise<void>;

  /** Soft-delete edilmiş borcu geri al */
  geriAl: (id: string) => Promise<void>;

  /** Tek bir taksiti "ödendi" işaretle.
   *  nakitIslemId — alimYap gibi nakit gider oluşturulduğunda bağlanır.
   *  null verilirse sadece taksit kapanır (manuel ödeme). */
  taksitOde: (borcId: string, taksitId: string, nakitIslemId: string | null) => Promise<void>;

  /** "Ödendi" işaretini geri al — taksiti tekrar bekleyene çevir */
  taksitGeriAl: (borcId: string, taksitId: string) => Promise<void>;

  /** Bir borcun taksit listesini tamamen yeniden ata (düzenle modu) */
  taksitleriYenidenOlustur: (borcId: string, yeniTaksitler: Taksit[]) => Promise<void>;

  /** Kaynak (örn. alimYap islemId) ile borç bul */
  kaynakIleBul: (kaynakId: string) => Borc | undefined;

  /** Tüm aktif (silinmemiş) borçları döner */
  aktif: () => Borc[];

  /** Soft-delete edilmiş borçları döner (Çöp Kutusu için) */
  silinenler: () => Borc[];

  /** DataProvider'dan gelen remote sync */
  syncFromRemote: (borclar: Borc[]) => void;
}

const yayinla = (borclar: Borc[]) => {
  yayin({ tip: "borclar", veri: borclar });
};

const persistEt = async (borclar: Borc[]) => {
  await storeKaydet("borclar", borclar);
};

export const useBorclar = create<BorclarStore>()(
  persist(
    (set, get) => ({
      borclar: [],

      ekle: async (girdi) => {
        const yeni: Borc = {
          ...girdi,
          id:              crypto.randomUUID(),
          olusturmaTarihi: new Date().toISOString(),
        };
        set((s) => ({ borclar: [yeni, ...s.borclar] }));
        yayinla(get().borclar);
        await persistEt(get().borclar);
        return yeni;
      },

      guncelle: async (id, yama) => {
        set((s) => ({
          borclar: s.borclar.map((b) => b.id === id ? { ...b, ...yama } : b),
        }));
        yayinla(get().borclar);
        await persistEt(get().borclar);
      },

      sil: async (id) => {
        const simdi = new Date().toISOString();
        const kullanici = useSirket.getState().rolAdi || "pilot";
        set((s) => ({
          borclar: s.borclar.map((b) => b.id === id
            ? {
                ...b,
                silindi:          true,
                silinmeTarihi:    simdi,
                silenKullaniciAd: kullanici,
              }
            : b
          ),
        }));
        yayinla(get().borclar);
        await persistEt(get().borclar);
      },

      geriAl: async (id) => {
        set((s) => ({
          borclar: s.borclar.map((b) => b.id === id
            ? { ...b, silindi: false, silinmeTarihi: undefined, silenKullaniciAd: undefined }
            : b
          ),
        }));
        yayinla(get().borclar);
        await persistEt(get().borclar);
      },

      taksitOde: async (borcId, taksitId, nakitIslemId) => {
        const simdi = new Date().toISOString();
        set((s) => ({
          borclar: s.borclar.map((b) => b.id !== borcId ? b : {
            ...b,
            taksitler: b.taksitler.map((t) => t.id !== taksitId ? t : {
              ...t,
              odendiAt:     simdi,
              nakitIslemId: nakitIslemId,
            }),
          }),
        }));
        yayinla(get().borclar);
        await persistEt(get().borclar);
      },

      taksitGeriAl: async (borcId, taksitId) => {
        set((s) => ({
          borclar: s.borclar.map((b) => b.id !== borcId ? b : {
            ...b,
            taksitler: b.taksitler.map((t) => t.id !== taksitId ? t : {
              ...t,
              odendiAt:     null,
              nakitIslemId: null,
            }),
          }),
        }));
        yayinla(get().borclar);
        await persistEt(get().borclar);
      },

      taksitleriYenidenOlustur: async (borcId, yeniTaksitler) => {
        set((s) => ({
          borclar: s.borclar.map((b) => b.id !== borcId ? b : {
            ...b,
            taksitler: yeniTaksitler,
          }),
        }));
        yayinla(get().borclar);
        await persistEt(get().borclar);
      },

      kaynakIleBul: (kaynakId) =>
        get().borclar.find((b) => !b.silindi && b.kaynakId === kaynakId),

      aktif: () => get().borclar.filter((b) => !b.silindi),

      silinenler: () => get().borclar.filter((b) => b.silindi === true),

      syncFromRemote: (borclar) => set({ borclar }),
    }),
    {
      name:    "pilot-borclar-v1",
      version: 1,
    }
  )
);
