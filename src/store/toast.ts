import { create } from "zustand";

export type ToastTip = "basari" | "hata" | "uyari" | "bilgi";

export interface Toast {
  id:      string;
  tip:     ToastTip;
  mesaj:   string;
  baslik?: string;
  sure?:   number; // ms, default 3500
}

interface ToastStore {
  toastlar: Toast[];
  ekle:     (t: Omit<Toast, "id">) => void;
  sil:      (id: string) => void;
  temizle:  () => void;
}

export const useToast = create<ToastStore>((set) => ({
  toastlar: [],

  ekle: (t) => {
    const id = crypto.randomUUID();
    set((s) => ({ toastlar: [...s.toastlar, { ...t, id }] }));
    setTimeout(() => set((s) => ({ toastlar: s.toastlar.filter((x) => x.id !== id) })), t.sure ?? 3500);
  },

  sil:     (id)  => set((s) => ({ toastlar: s.toastlar.filter((x) => x.id !== id) })),
  temizle: ()    => set({ toastlar: [] }),
}));

/* Kısayol fonksiyonlar */
export const toast = {
  basari: (mesaj: string, baslik?: string) => useToast.getState().ekle({ tip: "basari", mesaj, baslik }),
  hata:   (mesaj: string, baslik?: string) => useToast.getState().ekle({ tip: "hata",   mesaj, baslik }),
  uyari:  (mesaj: string, baslik?: string) => useToast.getState().ekle({ tip: "uyari",  mesaj, baslik }),
  bilgi:  (mesaj: string, baslik?: string) => useToast.getState().ekle({ tip: "bilgi",  mesaj, baslik }),
};
