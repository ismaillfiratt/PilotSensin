import { create } from "zustand";

export interface GeriAlAksiyon {
  id:        string;
  mesaj:     string;
  geriAlFn:  () => Promise<void>;
  sureMs:    number;
  olusturma: number;
}

interface GeriAlStore {
  aksiyonlar: GeriAlAksiyon[];
  goster:     (a: Omit<GeriAlAksiyon, "id" | "olusturma">) => void;
  kapat:      (id: string) => void;
  tetikle:    (id: string) => Promise<void>;
}

export const useGeriAl = create<GeriAlStore>()((set, get) => ({
  aksiyonlar: [],

  goster: (a) => {
    const id = crypto.randomUUID();
    const aksiyon: GeriAlAksiyon = { ...a, id, olusturma: Date.now() };

    set((s) => ({
      aksiyonlar: [...s.aksiyonlar.slice(-2), aksiyon], // max 3
    }));

    setTimeout(() => {
      set((s) => ({ aksiyonlar: s.aksiyonlar.filter((x) => x.id !== id) }));
    }, a.sureMs);
  },

  kapat: (id) => {
    set((s) => ({ aksiyonlar: s.aksiyonlar.filter((x) => x.id !== id) }));
  },

  tetikle: async (id) => {
    const aksiyon = get().aksiyonlar.find((x) => x.id === id);
    if (!aksiyon) return;
    set((s) => ({ aksiyonlar: s.aksiyonlar.filter((x) => x.id !== id) }));
    await aksiyon.geriAlFn();
  },
}));
