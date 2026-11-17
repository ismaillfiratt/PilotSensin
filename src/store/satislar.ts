import { create } from "zustand";
import { persist } from "zustand/middleware";
import { storeKaydet } from "@/lib/db";
import { yayin } from "@/lib/realtime";
import { getKullaniciId } from "@/lib/auth";
import { aktiviteKaydet } from "@/lib/aktiviteLog";
import { aksiyonKaydet }  from "@/lib/uyari-motoru/aksiyonTakipci";
import type { Kurus } from "@/lib/para";
import type { Silinebilir } from "@/lib/silinebilir";

export interface SatisKaydi extends Silinebilir {
  id:                    string;
  urunId:                string | null;
  urunAd:                string;
  kategori:              string;
  tarih:                 string;
  adet:                  number;
  birimSatisFiyatiKurus: Kurus;
  birimAlisFiyatiKurus:  Kurus;
  birimKarKurus:         Kurus;
  toplamCiroKurus:       Kurus;
  brutKarKurus:          Kurus;
  kdvOrani:              number;
  kdvTutariKurus:        Kurus;
  kasaGirisKurus:        Kurus;
  tip:                   "urun" | "hizmet";
  islemId?:              string;
  iadeEdildi?:           boolean;

  // Marj analizi snapshot (satış anında dondurulur, sonradan değişmez)
  toplamDirectMaliyetKurus?: Kurus;    // tüm direct cost × adet
  birimBrutKarKurus?:        Kurus;    // satisNet - directMaliyetNet (birim başı)
  birimBrutMarjYuzde?:       number;   // % (0–100)
  directMaliyetNetKurus?:    Kurus;    // KDV hariç direct cost (birim başı)
  directMaliyetKdvKurus?:    Kurus;    // İndirilebilir KDV (birim başı)
  marjSnapshotTarihi?:       string;   // ISO — snapshot ne zaman alındı
}

interface SatislarStore {
  kayitlar:       SatisKaydi[];
  ekle:           (kayit: Omit<SatisKaydi, "id">) => Promise<void>;
  guncelle:       (id: string, guncelleme: Partial<SatisKaydi>) => Promise<void>;
  sil:            (id: string, opts?: import("@/lib/softDelete").SilOpts) => Promise<void>;
  geriAl:         (id: string) => Promise<void>;
  kaliciSil:      (id: string) => Promise<void>;
  silinenler:     () => SatisKaydi[];
  syncFromRemote: (kayitlar: SatisKaydi[]) => void;
}

async function kaydet(kayitlar: SatisKaydi[]) {
  await storeKaydet("satislar", kayitlar);
}

export const useSatislar = create<SatislarStore>()(
  persist(
    (set, get) => ({
      kayitlar: [],

      ekle: async (kayit) => {
        const yeni = { ...kayit, id: crypto.randomUUID() };
        set((s) => ({ kayitlar: [yeni, ...s.kayitlar] }));
        yayin({ tip: "satislar", veri: get().kayitlar });
        await kaydet(get().kayitlar);
        const ciro = (kayit.toplamCiroKurus / 100).toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });
        void aktiviteKaydet({ modul: "satis", eylem: "ekle", ozet: `"${kayit.urunAd}" satışı kaydedildi (${kayit.adet} adet, ${ciro})`, meta: { satisId: yeni.id, urunId: kayit.urunId, kategori: kayit.kategori } });
        aksiyonKaydet("kar-zarar");
      },

      guncelle: async (id, guncelleme) => {
        const onceki = get().kayitlar.find(k => k.id === id);
        set((s) => ({ kayitlar: s.kayitlar.map((k) => k.id === id ? { ...k, ...guncelleme } : k) }));
        yayin({ tip: "satislar", veri: get().kayitlar });
        await kaydet(get().kayitlar);
        void aktiviteKaydet({ modul: "satis", eylem: "guncelle", ozet: `"${onceki?.urunAd ?? id}" satış kaydı güncellendi`, meta: { satisId: id } });
        aksiyonKaydet("kar-zarar");
      },

      sil: async (id, opts) => {
        const kayit = get().kayitlar.find(k => k.id === id);
        const { softDeletePatch } = await import("@/lib/softDelete");
        const patch = await softDeletePatch(opts);
        set((s) => ({ kayitlar: s.kayitlar.map((k) => k.id === id ? { ...k, ...patch } : k) }));
        yayin({ tip: "satislar", veri: get().kayitlar });
        await kaydet(get().kayitlar);
        void aktiviteKaydet({ modul: "satis", eylem: "sil", ozet: `"${kayit?.urunAd ?? id}" satış kaydı silindi`, meta: { satisId: id } });
        aksiyonKaydet("kar-zarar");
      },

      geriAl: async (id) => {
        const { softDeleteTemizle } = await import("@/lib/softDelete");
        set((s) => ({ kayitlar: s.kayitlar.map((k) => k.id === id ? { ...k, ...softDeleteTemizle() } : k) }));
        yayin({ tip: "satislar", veri: get().kayitlar });
        await kaydet(get().kayitlar);
      },

      kaliciSil: async (id) => {
        set((s) => ({ kayitlar: s.kayitlar.filter((k) => k.id !== id) }));
        yayin({ tip: "satislar", veri: get().kayitlar });
        await kaydet(get().kayitlar);
      },

      silinenler: () => get().kayitlar.filter((k) => k.silindi === true),

      syncFromRemote: (kayitlar) => set({ kayitlar }),
    }),
    {
      name:    "pilot-satislar-v1",
      version: 1,
      migrate: (state: unknown, from: number) => {
        if (from === 0) {
          const s = state as { kayitlar: Array<Record<string, unknown>> };
          const oldKeys = [
            ["birimSatisFiyatiKurus", "birimSatisFiyatiKurus"],
            ["birimAlisFiyatiKurus",  "birimAlisFiyatiKurus"],
            ["birimKarKurus",         "birimKarKurus"],
            ["toplamCiroKurus",       "toplamCiroKurus"],
            ["brutKarKurus",          "brutKarKurus"],
            ["kdvTutariKurus",        "kdvTutariKurus"],
            ["kasaGirisKurus",        "kasaGirisKurus"],
          ] as const;
          return {
            kayitlar: (s.kayitlar ?? []).map((k) => {
              const updated = { ...k };
              for (const [oldKey, newKey] of oldKeys) {
                const val = updated[oldKey] ?? updated[newKey];
                if (typeof val === "number") {
                  updated[newKey] = Number.isInteger(val) ? val : Math.round(val * 100);
                  delete updated[oldKey];
                }
              }
              return updated;
            }),
          };
        }
        return state;
      },
    }
  )
);

/* ─── Hesaplama yardımcıları ─── */

export function aylikBrutKar(kayitlar: SatisKaydi[]): Kurus {
  const simdi  = new Date();
  const ayBasi = new Date(simdi.getFullYear(), simdi.getMonth(), 1);
  return kayitlar
    .filter((k) => new Date(k.tarih) >= ayBasi)
    .reduce((t, k) => t + k.brutKarKurus, 0);
}

export function aylikCiro(kayitlar: SatisKaydi[]): Kurus {
  const simdi  = new Date();
  const ayBasi = new Date(simdi.getFullYear(), simdi.getMonth(), 1);
  return kayitlar
    .filter((k) => new Date(k.tarih) >= ayBasi)
    .reduce((t, k) => t + k.toplamCiroKurus, 0);
}
