"use client";

import { useEffect } from "react";
import { useTema } from "@/store/tema";

export default function TemaProvider({ children }: { children: React.ReactNode }) {
  const { tema } = useTema();

  useEffect(() => {
    const html = document.documentElement;

    const guncelle = (isDark: boolean) => {
      html.setAttribute("data-theme", isDark ? "dark" : "light");
    };

    if (tema === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      guncelle(mq.matches);
      const listener = (e: MediaQueryListEvent) => guncelle(e.matches);
      mq.addEventListener("change", listener);
      return () => mq.removeEventListener("change", listener);
    } else {
      guncelle(tema === "dark");
    }
  }, [tema]);

  return <>{children}</>;
}
