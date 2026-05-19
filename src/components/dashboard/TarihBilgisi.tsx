"use client";

import { useTRSaat, trSaatiStr, trTarihiUzun } from "@/lib/tarih";

export default function TarihBilgisi() {
  const simdi = useTRSaat();

  return (
    <p className="text-xs md:text-sm text-gray-400 mt-1 tabular-nums">
      {trTarihiUzun(simdi)}
      <span className="ml-2 text-gray-300 text-xs">{trSaatiStr(simdi)}</span>
    </p>
  );
}
