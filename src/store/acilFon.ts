import { create } from "zustand";
import { mevcutBirikim, type FonHedef, type FonIslem } from "@/lib/acil-fon-data";
import { yayin } from "@/lib/realtime";
import { acilFonHedeflerDB, acilFonIslemlerDB } from "@/lib/db";
import { getKullaniciId } from "@/lib/auth";

interface AcilFonStore {
  hedefler:       FonHedef[];
  islemler:       FonIslem[];
  aktifHedefId:   string | null;

  hedefEkle:      (h: Omit<FonHedef, "id" | "olusturmaTarih">) => Promise<void>;
  hedefGuncelle:  (id: string, h: Partial<FonHedef>) => void;
  hedefSil:       (id: string) => void;
  setAktifHedef:  (id: string | null) => void;

  islemEkle:      (islem: Omit<FonIslem, "id">) => Promise<void>;
  islemGuncelle:  (id: string, islem: Omit<FonIslem, "id">) => void;
  islemSil:       (id: string) => void;

  mevcut:         (hedefId?: string) => number;

  syncFromRemote: (data: {
    hedefler: FonHedef[];
    islemler: FonIslem[];
    aktifHedefId: string | null;
  }) => void;
}

function yayinla(get: () => AcilFonStore) {
  yayin({
    tip: "acil-fon",
    veri: { hedefler: get().hedefler, islemler: get().islemler, aktifHedefId: get().aktifHedefId },
  });
}

export const useAcilFon = create<AcilFonStore>((set, get) => ({
  hedefler:     [],
  islemler:     [],
  aktifHedefId: null,

  mevcut: (hedefId) => mevcutBirikim(get().islemler, hedefId),

  hedefEkle: async (h) => {
    const yeni: FonHedef = { ...h, id: Date.now().toString(), olusturmaTarih: new Date().toISOString() };
    set(s => ({ hedefler: [yeni, ...s.hedefler] }));
    yayinla(get);
    const uid = await getKullaniciId();
    if (uid) await acilFonHedeflerDB.ekle(uid, yeni);
  },
  hedefGuncelle: (id, h) => {
    set(s => ({ hedefler: s.hedefler.map(x => x.id === id ? { ...x, ...h } : x) }));
    yayinla(get);
    acilFonHedeflerDB.guncelle(id, h);
  },
  hedefSil: (id) => {
    set(s => ({
      hedefler:     s.hedefler.filter(x => x.id !== id),
      aktifHedefId: s.aktifHedefId === id ? null : s.aktifHedefId,
    }));
    yayinla(get);
    acilFonHedeflerDB.sil(id);
  },
  setAktifHedef: (id) => set({ aktifHedefId: id }),

  islemEkle: async (islem) => {
    const yeni: FonIslem = { ...islem, id: Date.now().toString() };
    set(s => ({ islemler: [yeni, ...s.islemler] }));
    yayinla(get);
    const uid = await getKullaniciId();
    if (uid) await acilFonIslemlerDB.ekle(uid, yeni);
  },
  islemGuncelle: (id, islem) => {
    set(s => ({ islemler: s.islemler.map(x => x.id === id ? { ...islem, id } : x) }));
    yayinla(get);
    acilFonIslemlerDB.guncelle(id, islem);
  },
  islemSil: (id) => {
    set(s => ({ islemler: s.islemler.filter(x => x.id !== id) }));
    yayinla(get);
    acilFonIslemlerDB.sil(id);
  },

  syncFromRemote: (data) => set(data),
}));
