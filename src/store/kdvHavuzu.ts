import { create } from "zustand";
import { persist } from "zustand/middleware";
import { yayin } from "@/lib/realtime";
import type { Kurus } from "@/lib/para";
import type { Silinebilir } from "@/lib/silinebilir";
import { getKullaniciId } from "@/lib/auth";
import { userStoreDB, storeKaydet } from "@/lib/db";

export interface KdvKaydi extends Silinebilir {
  id:             string;
  hareketId:      string;
  urunId:         string;
  urunAd:         string;
  tip:            "giris" | "cikis";
  adet:           number;
  birimKdvKurus:  Kurus;
  toplamKdvKurus: Kurus;
  tarih:          string;
  islemId?:       string;

  // KDV otomasyon duplicate koruması
  eklendigiKalemId?: string;
  eklendigiTarih?:   string;
}

interface KdvHavuzuStore {
  kayitlar: KdvKaydi[];

  ekle:           (kayit: Omit<KdvKaydi, "id">) => void;
  hareketSil:     (hareketId: string) => void;
  urunSil:        (urunId: string) => void;
  tumunuSifirla:  () => void;
  silinenler:     () => KdvKaydi[];
  syncFromRemote: (kayitlar: KdvKaydi[]) => void;

  /** Henüz planlanan kaleme işaretlenmemiş çıkış (hesaplanan) KDV kayıtları */
  eklenmemisKayitlar: () => KdvKaydi[];

  /** Kayıtları bir planlanan kalem ID'si ile işaretle */
  isaretle: (kayitIdleri: string[], kalemId: string) => Promise<void>;

  /** Bir planlanan kalem silindiğinde bağlı kayıtları serbest bırak */
  isaretiKaldir: (kalemId: string) => Promise<void>;
}

export const useKdvHavuzu = create<KdvHavuzuStore>()(
  persist(
    (set, get) => ({
      kayitlar: [],

      ekle: (kayit) => {
        set((s) => ({
          kayitlar: [{ ...kayit, id: crypto.randomUUID() }, ...s.kayitlar],
        }));
        yayin({ tip: "kdv-havuzu", veri: get().kayitlar });
        void storeKaydet("kdv_havuzu", get().kayitlar);
      },

      hareketSil: (hareketId) => {
        set((s) => ({ kayitlar: s.kayitlar.filter((k) => k.hareketId !== hareketId) }));
        yayin({ tip: "kdv-havuzu", veri: get().kayitlar });
      },

      urunSil: (urunId) => {
        set((s) => ({ kayitlar: s.kayitlar.filter((k) => k.urunId !== urunId) }));
        yayin({ tip: "kdv-havuzu", veri: get().kayitlar });
      },

      tumunuSifirla: () => {
        set({ kayitlar: [] });
        yayin({ tip: "kdv-havuzu", veri: [] });
      },

      silinenler: () => get().kayitlar.filter((k) => k.silindi === true),

      syncFromRemote: (kayitlar) => set({ kayitlar }),

      eklenmemisKayitlar: () =>
        get().kayitlar.filter(
          (k) => !k.silindi && k.tip === "cikis" && !k.eklendigiKalemId
        ),

      isaretle: async (kayitIdleri, kalemId) => {
        const simdi = new Date().toISOString();
        set((s) => ({
          kayitlar: s.kayitlar.map((k) =>
            kayitIdleri.includes(k.id)
              ? { ...k, eklendigiKalemId: kalemId, eklendigiTarih: simdi }
              : k
          ),
        }));
        yayin({ tip: "kdv-havuzu", veri: get().kayitlar });
        const kulId = await getKullaniciId();
        if (kulId) await userStoreDB.kaydet(kulId, "kdv_havuzu", get().kayitlar);
      },

      isaretiKaldir: async (kalemId) => {
        set((s) => ({
          kayitlar: s.kayitlar.map((k) =>
            k.eklendigiKalemId === kalemId
              ? { ...k, eklendigiKalemId: undefined, eklendigiTarih: undefined }
              : k
          ),
        }));
        yayin({ tip: "kdv-havuzu", veri: get().kayitlar });
        const kulId = await getKullaniciId();
        if (kulId) await userStoreDB.kaydet(kulId, "kdv_havuzu", get().kayitlar);
      },
    }),
    {
      name:    "pilot-kdv-havuzu-v1",
      version: 2,
      migrate: (state: unknown, from: number) => {
        const s = state as { kayitlar: Array<Record<string, unknown>> };
        const kayitlar = (s.kayitlar ?? []).map((k) => {
          const result: Record<string, unknown> = { ...k };
          // v0 → v1: kuruş dönüşümü
          if (from < 1) {
            result.birimKdvKurus  = Math.round((k.birimKdvKurus  as number ?? 0) * 100);
            result.toplamKdvKurus = Math.round((k.toplamKdvKurus as number ?? 0) * 100);
          }
          // v1 → v2: yeni alanlar varsayılan undefined
          if (from < 2) {
            result.eklendigiKalemId = undefined;
            result.eklendigiTarih   = undefined;
          }
          return result;
        });
        return { kayitlar };
      },
    }
  )
);

/* ─── Özet hesaplamaları ─── */

export function toplamGirdiKdv(kayitlar: KdvKaydi[]): Kurus {
  return kayitlar
    .filter((k) => !k.silindi && k.tip === "giris")
    .reduce((t, k) => t + k.toplamKdvKurus, 0);
}

export function toplamCiktiKdv(kayitlar: KdvKaydi[]): Kurus {
  return kayitlar
    .filter((k) => !k.silindi && k.tip === "cikis")
    .reduce((t, k) => t + k.toplamKdvKurus, 0);
}

// Pozitif → ödenecek, Negatif → devreden
export function netKdvBakiye(kayitlar: KdvKaydi[]): Kurus {
  return toplamCiktiKdv(kayitlar) - toplamGirdiKdv(kayitlar);
}
