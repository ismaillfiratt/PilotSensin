"use client";

import { useEffect }            from "react";
import { useNakit }             from "@/store/nakit";
import { useStok }              from "@/store/stok";
import { useGorevler }          from "@/store/gorevler";
import { useSirket }            from "@/store/sirket";
import { debouncedOtoKontrol }  from "@/lib/oto-kontrol-engine";

export default function OtoKontrolProvider({ children }: { children: React.ReactNode }) {
  const rolRaw = useSirket((s) => s.rol);
  const rol = (rolRaw === "copilot" ? "copilot" : "pilot") as "pilot" | "copilot";

  useEffect(() => {
    const unsub = [
      useNakit.subscribe(()    => debouncedOtoKontrol(rol)),
      useStok.subscribe(()     => debouncedOtoKontrol(rol)),
      useGorevler.subscribe(() => debouncedOtoKontrol(rol)),
      // useProsedurler subscribe etme — sonsuz döngü olur
    ];

    // İlk mount
    debouncedOtoKontrol(rol);

    // Her 5 dakikada periyodik kontrol
    const interval = setInterval(() => debouncedOtoKontrol(rol), 5 * 60_000);

    return () => {
      unsub.forEach((u) => u());
      clearInterval(interval);
    };
  }, [rol]);

  return <>{children}</>;
}
