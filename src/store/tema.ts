import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type Tema = "dark" | "light" | "system";

interface TemaStore {
  tema: Tema;
  setTema: (t: Tema) => void;
}

export const useTema = create<TemaStore>()(
  persist(
    (set) => ({
      tema: "light",
      setTema: (tema) => { if (tema === "dark") return; set({ tema }); },
    }),
    {
      name: "pilotsensin-tema-v2",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
