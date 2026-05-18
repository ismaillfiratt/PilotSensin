"use client";

import { useState, useEffect } from "react";

/** Ekran genişliği 768px'in altındaysa true döner. SSR-safe. */
export function useMobil(): boolean {
  const [mobil, setMobil] = useState(false);

  useEffect(() => {
    const kontrol = () => setMobil(window.innerWidth < 768);
    kontrol();
    window.addEventListener("resize", kontrol, { passive: true });
    return () => window.removeEventListener("resize", kontrol);
  }, []);

  return mobil;
}
