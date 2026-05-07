import { create } from "zustand";

interface LayoutStore {
  mobileSidebarAcik: boolean;
  mobileSidebarAc:   () => void;
  mobileSidebarKapat: () => void;
  mobileSidebarToggle: () => void;
}

export const useLayout = create<LayoutStore>((set) => ({
  mobileSidebarAcik:   false,
  mobileSidebarAc:     () => set({ mobileSidebarAcik: true  }),
  mobileSidebarKapat:  () => set({ mobileSidebarAcik: false }),
  mobileSidebarToggle: () => set((s) => ({ mobileSidebarAcik: !s.mobileSidebarAcik })),
}));
