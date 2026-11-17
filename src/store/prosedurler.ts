import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  isDue,
  VARSAYILAN_KATEGORILER, VARSAYILAN_SORUMLULAR,
  type Prosedur, type ChecklistItem, type ChecklistSikligi,
  type ChecklistSablon, type SopBelgeSablon,
} from "@/lib/prosedur-data";
import { yayin } from "@/lib/realtime";
import { userStoreDB } from "@/lib/db";
import { getKullaniciId } from "@/lib/auth";
import { aktiviteKaydet } from "@/lib/aktiviteLog";

export interface OzelSablonMaddesi extends ChecklistSablon {
  id: string;
  grupId: string;
}

export interface OzelSopSablonMaddesi extends SopBelgeSablon {
  id: string;
  grupId: string;
}

export interface OzelGrubu {
  id: string;
  baslik: string;
  aciklama: string;
  riskSeviyesi: "yuksek" | "kritik";
}

interface SilinenSablon { grupId: string; baslik: string; }

interface ProsedurStore {
  prosedurler:                Prosedur[];
  checklist:                  ChecklistItem[];
  ozelKategoriler:            string[];
  ozelSorumlular:             string[];
  gizliVarsayilanKategoriler: string[];
  gizliVarsayilanSorumlular:  string[];
  // Checklist şablon yönetimi
  silinenSablonMaddeleri:     SilinenSablon[];
  ozelSablonMaddeleri:        OzelSablonMaddesi[];
  ozelGrupAdlari:             Record<string, string>;
  ozelSablonGruplari:         OzelGrubu[];
  // SOP belge şablon yönetimi
  silinenSopSablonMaddeleri:  SilinenSablon[];
  ozelSopSablonMaddeleri:     OzelSopSablonMaddesi[];
  ozelSopGrupAdlari:          Record<string, string>;
  ozelSopSablonGruplari:      OzelGrubu[];
  // Gizlenen grup id'leri (varsayılan gruplar için)
  gizliSopGrupIdleri:         string[];
  gizliChecklistGrupIdleri:   string[];

  // SOP CRUD
  prosedurEkle:     (p: Omit<Prosedur, "id" | "sonGuncelleme">) => void;
  prosedurGuncelle: (id: string, p: Partial<Prosedur>) => void;
  prosedurSil:      (id: string) => void;
  prosedurGeriAl:   (id: string) => void;
  prosedurKaliciSil:(id: string) => void;
  prosedurSilinenler:() => Prosedur[];

  // Checklist CRUD
  checklistEkle:    (item: Omit<ChecklistItem, "id">) => void;
  checklistToggle:  (id: string) => void;
  checklistSifirla: (sikligi: ChecklistSikligi) => void;
  checklistSil:     (id: string) => void;
  checklistGeriAl:  (id: string) => void;
  checklistKaliciSil:(id: string) => void;
  checklistSilinenler:() => ChecklistItem[];

  // Özel kategoriler & sorumlular
  ozelKategoriEkle: (k: string) => void;
  ozelKategoriSil:  (k: string) => void;
  ozelSorumluEkle:  (s: string) => void;
  ozelSorumluSil:   (s: string) => void;

  // Checklist şablon yönetimi
  sablonMaddeSil:              (grupId: string, baslik: string) => void;
  sablonMaddeEkle:             (madde: OzelSablonMaddesi) => void;
  ozelSablonMaddeSil:          (id: string) => void;
  ozelSablonMaddesiniGuncelle: (id: string, madde: Partial<OzelSablonMaddesi>) => void;
  grupAdGuncelle:     (grupId: string, yeniAd: string) => void;
  ozelGrupEkle:       (g: Omit<OzelGrubu, "id">) => void;
  ozelGrupSil:        (id: string) => void;

  // SOP belge şablon yönetimi
  sopSablonMaddeSil:           (grupId: string, baslik: string) => void;
  sopSablonMaddeEkle:          (madde: OzelSopSablonMaddesi) => void;
  ozelSopSablonMaddeSil:       (id: string) => void;
  ozelSopSablonMaddesiniGuncelle: (id: string, madde: Partial<OzelSopSablonMaddesi>) => void;
  sopGrupAdGuncelle:     (grupId: string, yeniAd: string) => void;
  ozelSopGrupEkle:       (g: Omit<OzelGrubu, "id">) => void;
  ozelSopGrupSil:        (id: string) => void;
  sopGrupGizle:          (id: string) => void;
  sopGrupGoster:         (id: string) => void;
  checklistGrupGizle:    (id: string) => void;
  checklistGrupGoster:   (id: string) => void;

  syncFromRemote: (data: { prosedurler: Prosedur[]; checklist: ChecklistItem[] }) => void;
}

const DOKSAN_GUN = 90 * 86400000;
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

function yayinla(get: () => ProsedurStore) {
  yayin({ tip: "prosedurler", veri: { prosedurler: get().prosedurler, checklist: get().checklist } });
}

export const useProsedurler = create<ProsedurStore>()(
  persist(
    (set, get) => ({
      prosedurler:                [],
      checklist:                  [],
      ozelKategoriler:            [],
      ozelSorumlular:             [],
      gizliVarsayilanKategoriler: [],
      gizliVarsayilanSorumlular:  [],
      silinenSablonMaddeleri:     [],
      ozelSablonMaddeleri:        [],
      ozelGrupAdlari:             {},
      ozelSablonGruplari:         [],
      silinenSopSablonMaddeleri:  [],
      ozelSopSablonMaddeleri:     [],
      ozelSopGrupAdlari:          {},
      ozelSopSablonGruplari:      [],
      gizliSopGrupIdleri:         [],
      gizliChecklistGrupIdleri:   [],

      prosedurEkle: async (p) => {
        const yeni = { ...p, id: uid(), sonGuncelleme: new Date().toISOString() };
        set(s => ({ prosedurler: [yeni, ...s.prosedurler] }));
        yayinla(get);
        const kulId = await getKullaniciId();
        if (kulId) await userStoreDB.kaydet(kulId, "prosedurler", get().prosedurler);
        void aktiviteKaydet({ modul: "prosedur", eylem: "ekle", ozet: `"${p.baslik}" SOP eklendi`, meta: { prosedurId: yeni.id, kategori: p.kategori } });
      },
      prosedurGuncelle: async (id, p) => {
        const onceki = get().prosedurler.find(x => x.id === id);
        set(s => ({ prosedurler: s.prosedurler.map(x => x.id === id ? { ...x, ...p, sonGuncelleme: new Date().toISOString() } : x) }));
        yayinla(get);
        const kulId = await getKullaniciId();
        if (kulId) await userStoreDB.kaydet(kulId, "prosedurler", get().prosedurler);
        void aktiviteKaydet({ modul: "prosedur", eylem: "guncelle", ozet: `"${onceki?.baslik ?? id}" SOP güncellendi`, meta: { prosedurId: id } });
      },
      prosedurSil: async (id) => {
        const prosedur = get().prosedurler.find(x => x.id === id);
        const { softDeletePatch } = await import("@/lib/softDelete");
        const patch = await softDeletePatch();
        set(s => ({ prosedurler: s.prosedurler.map(x => x.id === id ? { ...x, ...patch } : x) }));
        yayinla(get);
        const kulId = await getKullaniciId();
        if (kulId) await userStoreDB.kaydet(kulId, "prosedurler", get().prosedurler);
        void aktiviteKaydet({ modul: "prosedur", eylem: "sil", ozet: `"${prosedur?.baslik ?? id}" SOP silindi`, meta: { prosedurId: id } });
      },
      prosedurGeriAl: async (id) => {
        const { softDeleteTemizle } = await import("@/lib/softDelete");
        set(s => ({ prosedurler: s.prosedurler.map(x => x.id === id ? { ...x, ...softDeleteTemizle() } : x) }));
        yayinla(get);
        const kulId = await getKullaniciId();
        if (kulId) await userStoreDB.kaydet(kulId, "prosedurler", get().prosedurler);
      },
      prosedurKaliciSil: async (id) => {
        set(s => ({ prosedurler: s.prosedurler.filter(x => x.id !== id) }));
        yayinla(get);
        const kulId = await getKullaniciId();
        if (kulId) await userStoreDB.kaydet(kulId, "prosedurler", get().prosedurler);
      },
      prosedurSilinenler: () => get().prosedurler.filter(p => p.silindi === true),

      checklistEkle: async (item) => {
        const yeni = { ...item, id: uid(), tamamlanmaGecmisi: [] };
        set(s => ({ checklist: [yeni, ...s.checklist] }));
        yayinla(get);
        const kulId = await getKullaniciId();
        if (kulId) await userStoreDB.kaydet(kulId, "checklist_items", get().checklist);
        void aktiviteKaydet({ modul: "prosedur", eylem: "checklist-ekle", ozet: `"${item.baslik}" kontrol maddesi eklendi`, meta: { itemId: yeni.id } });
      },
      checklistToggle: async (id) => {
        const item = get().checklist.find(x => x.id === id);
        const tamamlanacak = item ? isDue(item) : false;
        set(s => ({
          checklist: s.checklist.map(x => {
            if (x.id !== id) return x;
            if (isDue(x)) {
              const now = new Date().toISOString();
              const gecmis = [...(x.tamamlanmaGecmisi ?? []).filter(d => new Date(d).getTime() > Date.now() - DOKSAN_GUN), now];
              return { ...x, tamamlandi: true, sonTamamlanma: now, tamamlanmaGecmisi: gecmis };
            } else {
              const gecmis = (x.tamamlanmaGecmisi ?? []).slice(0, -1);
              const lastSon = gecmis.length > 0 ? gecmis[gecmis.length - 1] : undefined;
              return { ...x, tamamlandi: false, sonTamamlanma: lastSon, tamamlanmaGecmisi: gecmis };
            }
          }),
        }));
        yayinla(get);
        const kulId = await getKullaniciId();
        if (kulId) await userStoreDB.kaydet(kulId, "checklist_items", get().checklist);
        if (item) void aktiviteKaydet({ modul: "prosedur", eylem: tamamlanacak ? "checklist-tamamla" : "checklist-geri-al", ozet: `"${item.baslik}" kontrol maddesi ${tamamlanacak ? "tamamlandı" : "geri alındı"}`, meta: { itemId: id } });
      },
      checklistSifirla: async (sikligi) => {
        set(s => ({ checklist: s.checklist.map(x => x.sikligi === sikligi ? { ...x, tamamlandi: false } : x) }));
        yayinla(get);
        const kulId = await getKullaniciId();
        if (kulId) await userStoreDB.kaydet(kulId, "checklist_items", get().checklist);
      },
      checklistSil: async (id) => {
        const item = get().checklist.find(x => x.id === id);
        const { softDeletePatch } = await import("@/lib/softDelete");
        const patch = await softDeletePatch();
        set(s => ({ checklist: s.checklist.map(x => x.id === id ? { ...x, ...patch } : x) }));
        yayinla(get);
        const kulId = await getKullaniciId();
        if (kulId) await userStoreDB.kaydet(kulId, "checklist_items", get().checklist);
        void aktiviteKaydet({ modul: "prosedur", eylem: "checklist-sil", ozet: `"${item?.baslik ?? id}" kontrol maddesi silindi`, meta: { itemId: id } });
      },
      checklistGeriAl: async (id) => {
        const { softDeleteTemizle } = await import("@/lib/softDelete");
        set(s => ({ checklist: s.checklist.map(x => x.id === id ? { ...x, ...softDeleteTemizle() } : x) }));
        yayinla(get);
        const kulId = await getKullaniciId();
        if (kulId) await userStoreDB.kaydet(kulId, "checklist_items", get().checklist);
      },
      checklistKaliciSil: async (id) => {
        set(s => ({ checklist: s.checklist.filter(x => x.id !== id) }));
        yayinla(get);
        const kulId = await getKullaniciId();
        if (kulId) await userStoreDB.kaydet(kulId, "checklist_items", get().checklist);
      },
      checklistSilinenler: () => get().checklist.filter(c => c.silindi === true),

      ozelKategoriEkle: (k) => {
        const k2 = k.trim();
        if (!k2 || [...VARSAYILAN_KATEGORILER, ...get().ozelKategoriler].includes(k2)) return;
        set(s => ({ ozelKategoriler: [...s.ozelKategoriler, k2] }));
      },
      ozelKategoriSil: (k) => {
        if (VARSAYILAN_KATEGORILER.includes(k)) {
          set(s => ({ gizliVarsayilanKategoriler: [...s.gizliVarsayilanKategoriler.filter(x => x !== k), k] }));
        } else {
          set(s => ({ ozelKategoriler: s.ozelKategoriler.filter(x => x !== k) }));
        }
      },

      ozelSorumluEkle: (s) => {
        const s2 = s.trim();
        if (!s2 || [...VARSAYILAN_SORUMLULAR, ...get().ozelSorumlular].includes(s2)) return;
        set(st => ({ ozelSorumlular: [...st.ozelSorumlular, s2] }));
      },
      ozelSorumluSil: (s) => {
        if (VARSAYILAN_SORUMLULAR.includes(s)) {
          set(st => ({ gizliVarsayilanSorumlular: [...st.gizliVarsayilanSorumlular.filter(x => x !== s), s] }));
        } else {
          set(st => ({ ozelSorumlular: st.ozelSorumlular.filter(x => x !== s) }));
        }
      },

      // Checklist şablon
      sablonMaddeSil: (grupId, baslik) => {
        set(s => ({
          silinenSablonMaddeleri: [
            ...s.silinenSablonMaddeleri.filter(x => !(x.grupId === grupId && x.baslik === baslik)),
            { grupId, baslik },
          ],
        }));
      },
      sablonMaddeEkle: (madde) => set(s => ({ ozelSablonMaddeleri: [...s.ozelSablonMaddeleri, madde] })),
      ozelSablonMaddeSil: (id) => set(s => ({ ozelSablonMaddeleri: s.ozelSablonMaddeleri.filter(x => x.id !== id) })),
      ozelSablonMaddesiniGuncelle: (id, madde) => set(s => ({
        ozelSablonMaddeleri: s.ozelSablonMaddeleri.map(x => x.id === id ? { ...x, ...madde } : x),
      })),
      grupAdGuncelle: (grupId, yeniAd) => {
        set(s => ({ ozelGrupAdlari: { ...s.ozelGrupAdlari, [grupId]: yeniAd.trim() } }));
      },
      ozelGrupEkle: (g) => {
        set(s => ({ ozelSablonGruplari: [...s.ozelSablonGruplari, { ...g, id: `ozel-${uid()}` }] }));
      },
      ozelGrupSil: (id) => {
        set(s => ({
          ozelSablonGruplari:  s.ozelSablonGruplari.filter(x => x.id !== id),
          ozelSablonMaddeleri: s.ozelSablonMaddeleri.filter(x => x.grupId !== id),
        }));
      },

      // SOP belge şablon
      sopSablonMaddeSil: (grupId, baslik) => {
        set(s => ({
          silinenSopSablonMaddeleri: [
            ...s.silinenSopSablonMaddeleri.filter(x => !(x.grupId === grupId && x.baslik === baslik)),
            { grupId, baslik },
          ],
        }));
      },
      sopSablonMaddeEkle: (madde) => set(s => ({ ozelSopSablonMaddeleri: [...s.ozelSopSablonMaddeleri, madde] })),
      ozelSopSablonMaddeSil: (id) => set(s => ({ ozelSopSablonMaddeleri: s.ozelSopSablonMaddeleri.filter(x => x.id !== id) })),
      ozelSopSablonMaddesiniGuncelle: (id, madde) => set(s => ({
        ozelSopSablonMaddeleri: s.ozelSopSablonMaddeleri.map(x => x.id === id ? { ...x, ...madde } : x),
      })),
      sopGrupAdGuncelle: (grupId, yeniAd) => {
        set(s => ({ ozelSopGrupAdlari: { ...s.ozelSopGrupAdlari, [grupId]: yeniAd.trim() } }));
      },
      ozelSopGrupEkle: (g) => {
        set(s => ({ ozelSopSablonGruplari: [...s.ozelSopSablonGruplari, { ...g, id: `sopozel-${uid()}` }] }));
      },
      ozelSopGrupSil: (id) => {
        set(s => ({
          ozelSopSablonGruplari:  s.ozelSopSablonGruplari.filter(x => x.id !== id),
          ozelSopSablonMaddeleri: s.ozelSopSablonMaddeleri.filter(x => x.grupId !== id),
        }));
      },

      sopGrupGizle:  (id) => set(s => ({ gizliSopGrupIdleri: [...s.gizliSopGrupIdleri.filter(x => x !== id), id] })),
      sopGrupGoster: (id) => set(s => ({ gizliSopGrupIdleri: s.gizliSopGrupIdleri.filter(x => x !== id) })),

      checklistGrupGizle:  (id) => set(s => ({ gizliChecklistGrupIdleri: [...s.gizliChecklistGrupIdleri.filter(x => x !== id), id] })),
      checklistGrupGoster: (id) => set(s => ({ gizliChecklistGrupIdleri: s.gizliChecklistGrupIdleri.filter(x => x !== id) })),

      syncFromRemote: (data) => set((s) => ({
        ...s,
        prosedurler: data.prosedurler,
        checklist:   data.checklist,
      })),
    }),
    { name: "pilot-prosedurler" }
  )
);

export function tumKategoriler(ozelKategoriler: string[], gizliVarsayilanlar: string[] = []): string[] {
  return [
    ...VARSAYILAN_KATEGORILER.filter(k => !gizliVarsayilanlar.includes(k)),
    ...ozelKategoriler.filter(k => !VARSAYILAN_KATEGORILER.includes(k)),
  ];
}
export function tumSorumlular(ozelSorumlular: string[], gizliVarsayilanlar: string[] = []): string[] {
  return [
    ...VARSAYILAN_SORUMLULAR.filter(s => !gizliVarsayilanlar.includes(s)),
    ...ozelSorumlular.filter(s => !VARSAYILAN_SORUMLULAR.includes(s)),
  ];
}
