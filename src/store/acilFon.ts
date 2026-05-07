import { create } from "zustand";
import { mevcutBirikim, type FonIslem, type FonAyar } from "@/lib/acil-fon-data";
import { yayin } from "@/lib/realtime";

interface AcilFonStore {
  islemler:       FonIslem[];
  ayar:           FonAyar;
  mevcut:         () => number;
  islemEkle:      (islem: Omit<FonIslem, "id">) => void;
  ayarGuncelle:   (ayar: FonAyar) => void;
  syncFromRemote: (data: { islemler: FonIslem[]; ayar: FonAyar }) => void;
}

const VARSAYILAN_AYAR: FonAyar = { hedef: 30000, aylikHedef: 3000, aylarSayisi: 3 };

export const useAcilFon = create<AcilFonStore>((set, get) => ({
  islemler: [],
  ayar:     VARSAYILAN_AYAR,

  mevcut: () => mevcutBirikim(get().islemler),

  islemEkle: (islem) => {
    set((s) => ({ islemler: [{ ...islem, id: Date.now().toString() }, ...s.islemler] }));
    yayin({ tip: "acil-fon", veri: { islemler: get().islemler, ayar: get().ayar } });
  },
  ayarGuncelle: (ayar) => {
    set({ ayar });
    yayin({ tip: "acil-fon", veri: { islemler: get().islemler, ayar } });
  },
  syncFromRemote: (data) => set(data),
}));
