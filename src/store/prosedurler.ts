import { create } from "zustand";
import { type Prosedur, type ChecklistItem } from "@/lib/prosedur-data";
import { yayin } from "@/lib/realtime";

interface ProsedurStore {
  prosedurler:    Prosedur[];
  checklist:      ChecklistItem[];
  prosedurEkle:   (p: Omit<Prosedur, "id" | "sonGuncelleme">) => void;
  prosedurGuncelle:(id: string, p: Partial<Prosedur>) => void;
  prosedurSil:    (id: string) => void;
  checklistEkle:  (item: Omit<ChecklistItem, "id">) => void;
  checklistToggle:(id: string) => void;
  checklistSil:   (id: string) => void;
  syncFromRemote: (data: { prosedurler: Prosedur[]; checklist: ChecklistItem[] }) => void;
}

export const useProsedurler = create<ProsedurStore>((set, get) => ({
  prosedurler: [],
  checklist:   [],

  prosedurEkle: (p) => {
    set((s) => ({ prosedurler: [{ ...p, id: Date.now().toString(), sonGuncelleme: new Date().toISOString() }, ...s.prosedurler] }));
    yayin({ tip: "prosedurler", veri: { prosedurler: get().prosedurler, checklist: get().checklist } });
  },
  prosedurGuncelle: (id, p) => {
    set((s) => ({ prosedurler: s.prosedurler.map((x) => x.id === id ? { ...x, ...p, sonGuncelleme: new Date().toISOString() } : x) }));
    yayin({ tip: "prosedurler", veri: { prosedurler: get().prosedurler, checklist: get().checklist } });
  },
  prosedurSil: (id) => {
    set((s) => ({ prosedurler: s.prosedurler.filter((x) => x.id !== id) }));
    yayin({ tip: "prosedurler", veri: { prosedurler: get().prosedurler, checklist: get().checklist } });
  },
  checklistEkle: (item) => {
    set((s) => ({ checklist: [{ ...item, id: Date.now().toString() }, ...s.checklist] }));
    yayin({ tip: "prosedurler", veri: { prosedurler: get().prosedurler, checklist: get().checklist } });
  },
  checklistToggle: (id) => {
    set((s) => ({ checklist: s.checklist.map((x) => x.id === id ? { ...x, tamamlandi: !x.tamamlandi } : x) }));
    yayin({ tip: "prosedurler", veri: { prosedurler: get().prosedurler, checklist: get().checklist } });
  },
  checklistSil: (id) => {
    set((s) => ({ checklist: s.checklist.filter((x) => x.id !== id) }));
    yayin({ tip: "prosedurler", veri: { prosedurler: get().prosedurler, checklist: get().checklist } });
  },
  syncFromRemote: (data) => set(data),
}));
