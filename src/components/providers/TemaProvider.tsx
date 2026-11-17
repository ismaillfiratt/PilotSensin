"use client";

import { useEffect } from "react";
import { useTema }   from "@/store/tema";

function applyTema(_tema: string) {
  // "system" ve "dark" her zaman "light" olarak uygulanır — dark mod henüz aktif değil
  document.documentElement.setAttribute("data-theme", "light");
}

export default function TemaProvider({ children }: { children: React.ReactNode }) {
  // Reaktif olarak tema'yı al — state değişince component re-render olur,
  // useEffect tekrar tetiklenir ve data-theme attribute güncellenir.
  const tema = useTema((s) => s.tema);

  // Tema değiştiğinde HTML attribute'unu güncelle
  useEffect(() => {
    applyTema(tema);
  }, [tema]);

  // OS dark mod dinleyicisi devre dışı — dark mod henüz aktif değil

  return <>{children}</>;
}
