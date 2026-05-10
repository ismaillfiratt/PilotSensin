"use client";

import { useProsedurler } from "@/store/prosedurler";
import ProsedurOzet    from "@/components/prosedurler/ProsedurOzet";
import SopSablonPanel  from "@/components/prosedurler/SopSablonPanel";
import ProsedurListesi from "@/components/prosedurler/ProsedurListesi";
import SabloPanel      from "@/components/prosedurler/SabloPanel";
import ChecklistPanel  from "@/components/prosedurler/ChecklistPanel";

export default function ProsedurlerPage() {
  const { prosedurler, checklist } = useProsedurler();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Standart Operasyon Prosedürleri</h1>
        <p className="text-sm text-[#94a3b8] mt-1">
          SOP belgeleri · kontrol listeleri · hazır şablonlar
        </p>
      </div>

      {/* Özet kartlar */}
      <ProsedurOzet prosedurler={prosedurler} checklist={checklist} />

      {/* SOP Belge Şablonları */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold text-[#94a3b8] uppercase tracking-widest">
          SOP Belge Şablonları
        </h2>
        <SopSablonPanel />
      </div>

      {/* SOP Belgeleri — tam genişlik */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold text-[#94a3b8] uppercase tracking-widest">
          SOP Belgeleri
        </h2>
        <ProsedurListesi />
      </div>

      {/* Kontrol Listesi Şablonları */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold text-[#94a3b8] uppercase tracking-widest">
          Kontrol Listesi Şablonları
        </h2>
        <SabloPanel />
      </div>

      {/* Kontrol Listesi — tam genişlik */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold text-[#94a3b8] uppercase tracking-widest">
          Kontrol Listesi
        </h2>
        <ChecklistPanel />
      </div>
    </div>
  );
}
