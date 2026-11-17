import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UrunMarjKayit, UrunGideri } from "@/lib/urun-marj-data";
import { VARSAYILAN_DIRECT_GIDERLER } from "@/lib/urun-marj-data";

interface UrunMarjStore {
  kayitlar: UrunMarjKayit[];

  /** Ürün eklenince otomatik çağrılır. Zaten varsa işlem yapmaz. */
  ekleAsBoss:     (urunId: string) => void;

  giderEkle:      (urunId: string, gider: Omit<UrunGideri, "id">) => void;
  giderGuncelle:  (urunId: string, giderId: string, patch: Partial<UrunGideri>) => void;
  giderSil:       (urunId: string, giderId: string) => void;

  hedefMarjAyarla: (urunId: string, yuzde: number | null) => void;

  /** Ürün kalıcı silinince çağrılır. */
  sil:            (urunId: string) => void;

  syncFromRemote: (kayitlar: UrunMarjKayit[]) => void;
}

function simdi() { return new Date().toISOString(); }

export const useUrunMarjAnalizi = create<UrunMarjStore>()(
  persist(
    (set, get) => ({
      kayitlar: [],

      ekleAsBoss: (urunId) => {
        if (get().kayitlar.some((k) => k.urunId === urunId)) return;
        const yeni: UrunMarjKayit = {
          id:             crypto.randomUUID(),
          urunId,
          giderler:       VARSAYILAN_DIRECT_GIDERLER.map((g) => ({ ...g, id: crypto.randomUUID() })),
          hedefMarjYuzde: 25,
          olusturma:      simdi(),
          guncellenme:    simdi(),
        };
        set((s) => ({ kayitlar: [yeni, ...s.kayitlar] }));
      },

      giderEkle: (urunId, gider) => {
        const yeni = { ...gider, id: crypto.randomUUID() };
        set((s) => ({
          kayitlar: s.kayitlar.map((k) =>
            k.urunId === urunId
              ? { ...k, giderler: [...k.giderler, yeni], guncellenme: simdi() }
              : k
          ),
        }));
      },

      giderGuncelle: (urunId, giderId, patch) => {
        set((s) => ({
          kayitlar: s.kayitlar.map((k) =>
            k.urunId === urunId
              ? {
                  ...k,
                  giderler:    k.giderler.map((g) => g.id === giderId ? { ...g, ...patch } : g),
                  guncellenme: simdi(),
                }
              : k
          ),
        }));
      },

      giderSil: (urunId, giderId) => {
        set((s) => ({
          kayitlar: s.kayitlar.map((k) =>
            k.urunId === urunId
              ? { ...k, giderler: k.giderler.filter((g) => g.id !== giderId), guncellenme: simdi() }
              : k
          ),
        }));
      },

      hedefMarjAyarla: (urunId, yuzde) => {
        set((s) => ({
          kayitlar: s.kayitlar.map((k) =>
            k.urunId === urunId
              ? { ...k, hedefMarjYuzde: yuzde, guncellenme: simdi() }
              : k
          ),
        }));
      },

      sil: (urunId) => {
        set((s) => ({ kayitlar: s.kayitlar.filter((k) => k.urunId !== urunId) }));
      },

      syncFromRemote: (kayitlar) => set({ kayitlar }),
    }),
    {
      name:    "pilot-urun-marj-v1",
      version: 4,
      migrate: (state: unknown, from: number) => {
        const s = state as { kayitlar: Array<Record<string, unknown>> };
        const kayitlar = (s.kayitlar ?? []).map((k) => ({
          ...k,
          giderler: ((k.giderler ?? []) as Array<Record<string, unknown>>)
            .filter((g) => {
              if (from < 4) {
                const ad = String(g.ad ?? "").toLowerCase();
                // Eski satırları temizle: mal maliyeti (artık stoktan), KDV satırı,
                // Shopify aylık abonelik (İşletme Giderleri'ne taşındı)
                if (ad.includes("mal maliyeti") || ad.includes("mal mali")) return false;
                if (ad.startsWith("kdv") || ad === "kdv") return false;
                if (ad.includes("aylık abonelik") || ad.includes("aylik abonelik")) return false;
              }
              return true;
            })
            .map((g) => {
              const r = { ...g };
              if (from < 2) {
                r.kdvDahilHaric    = g.kdvDahilHaric    ?? "dahil";
                r.kdvOrani         = g.kdvOrani          ?? 20;
                r.kdvIndirilebilir = g.kdvIndirilebilir  ?? true;
              }
              if (from < 3) {
                r.yuzdeBase = g.yuzdeBase ?? "satis";
              }
              return r;
            }),
        }));
        return { kayitlar };
      },
    }
  )
);
