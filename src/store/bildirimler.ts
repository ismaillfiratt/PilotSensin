import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { yayin } from "@/lib/realtime";

export type BildirimTip = "kritik" | "uyari" | "bilgi";
export type BildirimModul =
  | "stok" | "nakit-akisi" | "kar-zarar"
  | "gorevler" | "prosedurler" | "acil-fon" | "sistem";

export interface Bildirim {
  id: string;
  baslik: string;
  mesaj: string;
  tip: BildirimTip;
  modul: BildirimModul;
  tarih: string;
  okundu: boolean;
}

interface BildirimStore {
  bildirimler:    Bildirim[];
  okunduYap:      (id: string) => void;
  okunduToggle:   (id: string) => void;
  tumunuOkunduYap: () => void;
  sil:            (id: string) => void;
  tumunuSil:      () => void;
  syncFromRemote: (bildirimler: Bildirim[]) => void;
}

function tarih(dakikaGeri: number) {
  return new Date(Date.now() - dakikaGeri * 60000).toISOString();
}

const BASLANGIC: Bildirim[] = [
  { id: "b1",  baslik: "Kritik Stok",          mesaj: "Süt 1L kritik seviyenin altına düştü (8 adet kaldı).",            tip: "kritik", modul: "stok",         tarih: tarih(5),    okundu: false },
  { id: "b2",  baslik: "Görev Gecikmesi",       mesaj: "SGK primlerini öde görevi 1 gün gecikti.",                        tip: "kritik", modul: "gorevler",     tarih: tarih(12),   okundu: false },
  { id: "b3",  baslik: "Nakit Düşüşü",          mesaj: "Nakit akışı bu hafta %12 geriledi. İncelemeniz önerilir.",       tip: "uyari",  modul: "nakit-akisi",  tarih: tarih(35),   okundu: false },
  { id: "b4",  baslik: "Düşük Brüt Marj",       mesaj: "Zeytinyağı 1L ürününün brüt marjı %18'e düştü.",                tip: "uyari",  modul: "kar-zarar",    tarih: tarih(60),   okundu: false },
  { id: "b5",  baslik: "SOP Tamamlanmadı",      mesaj: "Haftalık kapanış prosedürü bugün tamamlanmadı.",                 tip: "uyari",  modul: "prosedurler",  tarih: tarih(120),  okundu: false },
  { id: "b6",  baslik: "Acil Fon Uyarısı",      mesaj: "Acil durum fonu hedefin %40'ında. Birikim önerilir.",           tip: "uyari",  modul: "acil-fon",     tarih: tarih(180),  okundu: true  },
  { id: "b7",  baslik: "Ölü Stok Tespiti",      mesaj: "Şeker 1kg 90+ gündür hareket görmüyor. Aksiyon alın.",          tip: "bilgi",  modul: "stok",         tarih: tarih(360),  okundu: true  },
  { id: "b8",  baslik: "Prosedür Güncelleme",   mesaj: "Yeni Personel Oryantasyonu prosedürü 60 gündür güncellenmedi.", tip: "bilgi",  modul: "prosedurler",  tarih: tarih(720),  okundu: true  },
  { id: "b9",  baslik: "3 Hafta Negatif Akış",  mesaj: "Son 3 haftadır net nakit akışı negatif seyrediyor.",            tip: "kritik", modul: "nakit-akisi",  tarih: tarih(1440), okundu: true  },
  { id: "b10", baslik: "Kahve 250g Kritik",      mesaj: "Kahve 250g kritik stok seviyesine ulaştı (4 paket).",          tip: "kritik", modul: "stok",         tarih: tarih(2880), okundu: true  },
];

export const useBildirimler = create<BildirimStore>()(
  persist(
    (set, get) => ({
      bildirimler: BASLANGIC,

      okunduYap: (id) => {
        set((s) => ({ bildirimler: s.bildirimler.map((b) => b.id === id ? { ...b, okundu: true } : b) }));
        yayin({ tip: "bildirimler", veri: get().bildirimler });
      },
      okunduToggle: (id) => {
        set((s) => ({ bildirimler: s.bildirimler.map((b) => b.id === id ? { ...b, okundu: !b.okundu } : b) }));
        yayin({ tip: "bildirimler", veri: get().bildirimler });
      },
      tumunuOkunduYap: () => {
        set((s) => ({ bildirimler: s.bildirimler.map((b) => ({ ...b, okundu: true })) }));
        yayin({ tip: "bildirimler", veri: get().bildirimler });
      },
      sil: (id) => {
        set((s) => ({ bildirimler: s.bildirimler.filter((b) => b.id !== id) }));
        yayin({ tip: "bildirimler", veri: get().bildirimler });
      },
      tumunuSil: () => {
        set({ bildirimler: [] });
        yayin({ tip: "bildirimler", veri: [] });
      },
      syncFromRemote: (bildirimler) => set({ bildirimler }),
    }),
    {
      name: "pilotsensin-bildirimler",
      storage: createJSONStorage(() => localStorage),
      // Sadece okundu durumunu ve silinen bildirimleri sakla
      partialize: (state) => ({
        bildirimler: state.bildirimler.map(({ id, okundu }) => ({ id, okundu })),
      }),
      // Hydrate: başlangıç verisini localStorage'daki okundu durumuyla birleştir
      merge: (persisted: any, current) => {
        if (!persisted?.bildirimler) return current;

        const okunanlar = new Map<string, boolean>(
          persisted.bildirimler.map((b: { id: string; okundu: boolean }) => [b.id, b.okundu])
        );

        // Silinen bildirimlerin ID'leri
        const persistedIds = new Set(persisted.bildirimler.map((b: { id: string }) => b.id));
        const silinenler = new Set(
          BASLANGIC.map((b) => b.id).filter((id) => !persistedIds.has(id) && okunanlar.size > 0)
        );

        return {
          ...current,
          bildirimler: current.bildirimler
            .filter((b) => !silinenler.has(b.id))
            .map((b) => ({
              ...b,
              okundu: okunanlar.has(b.id) ? okunanlar.get(b.id)! : b.okundu,
            })),
        };
      },
    }
  )
);
