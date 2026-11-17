"use client";

import { useEffect }           from "react";
import { useNakit }            from "@/store/nakit";
import { useStok }             from "@/store/stok";
import { useGorevler }         from "@/store/gorevler";
import { useAcilFon }          from "@/store/acilFon";
import { useProsedurler }      from "@/store/prosedurler";
import { useBildirimAyarlari } from "@/store/bildirimAyarlari";
import { useSirket }           from "@/store/sirket";
import { debouncedSenkronizeEt } from "@/lib/uyari-motoru";

export default function UyariMotorProvider({ children }: { children: React.ReactNode }) {
  const rolRaw = useSirket((s) => s.rol);
  const rol = (rolRaw === "copilot" ? "copilot" : "pilot") as "pilot" | "copilot";

  useEffect(() => {
    const unsub = [
      useNakit.subscribe(()            => debouncedSenkronizeEt(rol)),
      useStok.subscribe(()             => debouncedSenkronizeEt(rol)),
      useGorevler.subscribe(()         => debouncedSenkronizeEt(rol)),
      useAcilFon.subscribe(()          => debouncedSenkronizeEt(rol)),
      useProsedurler.subscribe(()      => debouncedSenkronizeEt(rol)),
      useBildirimAyarlari.subscribe(() => debouncedSenkronizeEt(rol)),
    ];

    debouncedSenkronizeEt(rol);

    return () => unsub.forEach((u) => u());
  }, [rol]);

  return <>{children}</>;
}
