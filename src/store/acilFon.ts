import { create } from "zustand";
import { mevcutBirikim, type FonHedef, type FonIslem } from "@/lib/acil-fon-data";
import { yayin } from "@/lib/realtime";
import { userStoreDB } from "@/lib/db";
import { getKullaniciId } from "@/lib/auth";

interface AcilFonStore {
  hedefler:       FonHedef[];
  islemler:       FonIslem[];
  aktifHedefId:   string | null;

  hedefEkle:      (h: Omit<FonHedef, "id" | "olusturmaTarih">) => Promise<void>;
  hedefGuncelle:  (id: string, h: Partial<FonHedef>) => Promise<void>;
  hedefSil:       (id: string) => Promise<void>;
  setAktifHedef:  (id: string | null) => void;

  islemEkle:      (islem: Omit<FonIslem, "id">) => Promise<void>;
  islemGuncelle:  (id: string, islem: Omit<FonIslem, "id">) => Promise<void>;
  islemSil:       (id: string) => Promise<void>;

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

async function kaydetHedefler(hedefler: FonHedef[]) {
  const uid = await getKullaniciId();
  if (uid) await userStoreDB.kaydet(uid, "acil_fon_hedefler", hedefler);
}

async function kaydetIslemler(islemler: FonIslem[]) {
  const uid = await getKullaniciId();
  if (uid) await userStoreDB.kaydet(uid, "acil_fon_islemler", islemler);
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
    await kaydetHedefler(get().hedefler);
  },

  hedefGuncelle: async (id, h) => {
    set(s => ({ hedefler: s.hedefler.map(x => x.id === id ? { ...x, ...h } : x) }));
    yayinla(get);
    await kaydetHedefler(get().hedefler);
  },

  hedefSil: async (id) => {
    set(s => ({
      hedefler:     s.hedefler.filter(x => x.id !== id),
      aktifHedefId: s.aktifHedefId === id ? null : s.aktifHedefId,
    }));
    yayinla(get);
    await kaydetHedefler(get().hedefler);
  },

  setAktifHedef: (id) => set({ aktifHedefId: id }),

  islemEkle: async (islem) => {
    const yeni: FonIslem = { ...islem, id: Date.now().toString() };
    set(s => ({ islemler: [yeni, ...s.islemler] }));
    yayinla(get);
    await kaydetIslemler(get().islemler);
  },

  islemGuncelle: async (id, islem) => {
    set(s => ({ islemler: s.islemler.map(x => x.id === id ? { ...islem, id } : x) }));
    yayinla(get);
    await kaydetIslemler(get().islemler);
  },

  islemSil: async (id) => {
    set(s => ({ islemler: s.islemler.filter(x => x.id !== id) }));
    yayinla(get);
    await kaydetIslemler(get().islemler);
  },

  syncFromRemote: (data) => set(data),
}));
