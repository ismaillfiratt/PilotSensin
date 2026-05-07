"use client";

import { useState } from "react";
import { type Prosedur, type ChecklistItem } from "@/lib/prosedur-data";
import ProsedurOzet from "@/components/prosedurler/ProsedurOzet";
import ProsedurListesi from "@/components/prosedurler/ProsedurListesi";
import ChecklistPanel from "@/components/prosedurler/ChecklistPanel";

export default function ProsedurlerPage() {
  const [prosedurler, setProsedurler] = useState<Prosedur[]>([]);
  const [checklist, setChecklist]     = useState<ChecklistItem[]>([]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Başlık */}
      <div>
        <h1 className="text-2xl font-bold text-white">Prosedürler</h1>
        <p className="text-sm text-[#94a3b8] mt-1">
          Standart operasyon prosedürleri ve günlük kontrol listeleri
        </p>
      </div>

      {/* Özet */}
      <ProsedurOzet prosedurler={prosedurler} checklist={checklist} />

      {/* Ana içerik: Prosedür listesi + Checklist yan yana */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-widest">
            SOP Belgeleri
          </h2>
          <ProsedurListesi prosedurler={prosedurler} setProsedurler={setProsedurler} />
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-widest">
            Kontrol Listesi
          </h2>
          <ChecklistPanel items={checklist} setItems={setChecklist} />
        </div>
      </div>
    </div>
  );
}
