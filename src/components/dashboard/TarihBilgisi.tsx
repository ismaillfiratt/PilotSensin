"use client";

import { useTRSaat, trSaatiStr, trTarihiUzun } from "@/lib/tarih";

export default function TarihBilgisi() {
  const simdi = useTRSaat(); // her saniye güncellenir, TR timezone, cleanup otomatik

  return (
    <p className="text-xs md:text-sm text-[#94a3b8] mt-1 tabular-nums">
      {trTarihiUzun(simdi)}
      <span className="ml-2 text-[#475569] text-xs">{trSaatiStr(simdi)}</span>
    </p>
  );
}
