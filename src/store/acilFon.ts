import { create } from "zustand";
import { persist } from "zustand/middleware";
import { mevcutBirikim, type FonHedef, type FonIslem } from "@/lib/acil-fon-data";
import { yayin } from "@/lib/realtime";
import { storeKaydet } from "@/lib/db";
import { softDeletePatch, softDeleteTemizle, type SilOpts } from "@/lib/softDelete";
import { aktiviteKaydet } from "@/lib/aktiviteLog";
import { aksiyonKaydet }  from "@/lib/uyari-motoru/aksiyonTakipci";
import { useNakit } from "@/store/nakit";

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

  syncFromRemote: (data: { hedefler: FonHedef[]; islemler: FonIslem[] }) => void;
}

function yayinla(get: () => AcilFonStore) {
  yayin({ tip: "acil-fon", veri: { hedefler: get().hedefler, islemler: get().islemler } });
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
        void aktiviteKaydet({ modul: "acil-fon", eylem: "hedef-ekle", ozet: `"${h.ad}" acil fon hedefi oluşturuldu`, meta: { hedefId: yeni.id } });
      },
      hedefGuncelle: async (id, h) => {
        const onceki = get().hedefler.find(x => x.id === id);
        set(s => ({ hedefler: s.hedefler.map(x => x.id === id ? { ...x, ...h } : x) }));
        yayinla(get);
        await kaydetHedefler(get().hedefler);
        void aktiviteKaydet({ modul: "acil-fon", eylem: "hedef-guncelle", ozet: `"${onceki?.ad ?? id}" acil fon hedefi güncellendi`, meta: { hedefId: id } });
      },
      hedefSil: async (id, opts) => {
        const hedef = get().hedefler.find(x => x.id === id);
        const patch = await softDeletePatch(opts);
        set(s => ({ hedefler: s.hedefler.map(x => x.id === id ? { ...x, ...patch } : x), aktifHedefId: s.aktifHedefId === id ? null : s.aktifHedefId }));
        yayinla(get);
        await kaydetHedefler(get().hedefler);
        void aktiviteKaydet({ modul: "acil-fon", eylem: "hedef-sil", ozet: `"${hedef?.ad ?? id}" acil fon hedefi silindi`, meta: { hedefId: id } });
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
        const tutar = (islem.tutarKurus / 100).toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });
        void aktiviteKaydet({ modul: "acil-fon", eylem: islem.tip, ozet: `Acil fona ${islem.tip === "yatirma" ? "yatırma" : "çekme"}: ${tutar}`, meta: { islemId: yeni.id, hedefId: islem.hedefId } });
        aksiyonKaydet("acil-fon");

        // ── Kasa transferi: yatırma = gider, çekme = gelir ──────────────
        const hedef = get().hedefler.find(h => h.id === islem.hedefId);
        const aciklama = hedef
          ? `Acil Fon: ${hedef.ad}${islem.tip === "cekme" ? " çekim" : ""}`
          : islem.tip === "yatirma" ? "Acil Fon birikimi" : "Acil Fon çekim";
        await useNakit.getState().ekle({
          tip:          islem.tip === "yatirma" ? "gider" : "gelir",
          tutarKurus:   islem.tutarKurus,
          kategori:     "Acil Fon Transferi",
          aciklama,
          tarih:        islem.tarih,
          odemeYontemi: "nakit",
          islemId:      yeni.id,
          transferMi:   true,
        });
      },
      islemGuncelle: async (id, islem) => {
        set(s => ({ islemler: s.islemler.map(x => x.id === id ? { ...islem, id } : x) }));
        yayinla(get);
        await kaydetIslemler(get().islemler);
        void aktiviteKaydet({ modul: "acil-fon", eylem: "islem-guncelle", ozet: `Acil fon işlemi güncellendi`, meta: { islemId: id } });
        aksiyonKaydet("acil-fon");

        // ── Bağlı nakit kaydını güncelle ──────────────────────────────
        const nakitStore = useNakit.getState();
        const nakitIslem = nakitStore.islemler.find(i => i.islemId === id && !i.silindi);
        if (nakitIslem) {
          const hedef    = get().hedefler.find(h => h.id === islem.hedefId);
          const aciklama = hedef
            ? `Acil Fon: ${hedef.ad}${islem.tip === "cekme" ? " çekim" : ""}`
            : islem.tip === "yatirma" ? "Acil Fon birikimi" : "Acil Fon çekim";
          await nakitStore.guncelle(nakitIslem.id, {
            tip:          islem.tip === "yatirma" ? "gider" : "gelir",
            tutarKurus:   islem.tutarKurus,
            kategori:     "Acil Fon Transferi",
            aciklama,
            tarih:        islem.tarih,
            odemeYontemi: "nakit",
            islemId:      id,
            transferMi:   true,
          });
        }
      },
      islemSil: async (id, opts) => {
        const islem = get().islemler.find(x => x.id === id);
        const patch = await softDeletePatch(opts);
        set(s => ({ islemler: s.islemler.map(x => x.id === id ? { ...x, ...patch } : x) }));
        yayinla(get);
        await kaydetIslemler(get().islemler);
        void aktiviteKaydet({ modul: "acil-fon", eylem: "islem-sil", ozet: `Acil fon ${islem?.tip === "yatirma" ? "yatırma" : "çekme"} işlemi silindi`, meta: { islemId: id } });
        aksiyonKaydet("acil-fon");

        // ── Bağlı nakit kaydını sil ───────────────────────────────────
        const nakitStore = useNakit.getState();
        const nakitIslem = nakitStore.islemler.find(i => i.islemId === id && !i.silindi);
        if (nakitIslem) await nakitStore.sil(nakitIslem.id, opts);
      },
      islemGeriAl: async (id) => {
        set(s => ({ islemler: s.islemler.map(x => x.id === id ? { ...x, ...softDeleteTemizle() } : x) }));
        yayinla(get);
        await kaydetIslemler(get().islemler);

        // ── Bağlı nakit kaydını geri al ──────────────────────────────
        const nakitStore = useNakit.getState();
        const nakitIslem = nakitStore.islemler.find(i => i.islemId === id);
        if (nakitIslem) await nakitStore.geriAl(nakitIslem.id);
      },
      islemKaliciSil: async (id) => {
        set(s => ({ islemler: s.islemler.filter(x => x.id !== id) }));
        yayinla(get);
        await kaydetIslemler(get().islemler);

        // ── Bağlı nakit kaydını kalıcı sil ───────────────────────────
        const nakitStore = useNakit.getState();
        const nakitIslem = nakitStore.islemler.find(i => i.islemId === id);
        if (nakitIslem) await nakitStore.kaliciSil(nakitIslem.id);
      },
      islemSilinenler: () => get().islemler.filter(i => i.silindi === true),

      // hedefSil eski adıyla geriye uyumluluk (acil-fon/page.tsx kullanıyor)
      syncFromRemote: (data) => set({ hedefler: data.hedefler, islemler: data.islemler }),
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
