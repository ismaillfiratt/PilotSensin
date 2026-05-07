"use client";

import { useProsedurler } from "@/store/prosedurler";
import ProsedurOzet   from "@/components/prosedurler/ProsedurOzet";
import ProsedurListesi from "@/components/prosedurler/ProsedurListesi";
import ChecklistPanel  from "@/components/prosedurler/ChecklistPanel";

export default function ProsedurlerPage() {
  const {
    prosedurler, checklist,
    prosedurGuncelle, prosedurSil,
    checklistToggle, checklistSil,
  } = useProsedurler();

  // Adapters for child components expecting setState-like setters
  const setProsedurler = (fn: any) => {
    const yeni = typeof fn === "function" ? fn(prosedurler) : fn;
    yeni.forEach((p: any) => {
      if (!prosedurler.find((x) => x.id === p.id)) return;
      prosedurGuncelle(p.id, p);
    });
    prosedurler.filter((p) => !yeni.find((x: any) => x.id === p.id))
      .forEach((p) => prosedurSil(p.id));
  };

  const setChecklist = (fn: any) => {
    const yeni = typeof fn === "function" ? fn(checklist) : fn;
    yeni.forEach((item: any) => {
      const mevcut = checklist.find((x) => x.id === item.id);
      if (mevcut && mevcut.tamamlandi !== item.tamamlandi) checklistToggle(item.id);
    });
    checklist.filter((c) => !yeni.find((x: any) => x.id === c.id))
      .forEach((c) => checklistSil(c.id));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Prosedürler</h1>
        <p className="text-sm text-[#94a3b8] mt-1">
          Standart operasyon prosedürleri ve günlük kontrol listeleri
        </p>
      </div>

      <ProsedurOzet prosedurler={prosedurler} checklist={checklist} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-widest">SOP Belgeleri</h2>
          <ProsedurListesi prosedurler={prosedurler} setProsedurler={setProsedurler} />
        </div>
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-widest">Kontrol Listesi</h2>
          <ChecklistPanel items={checklist} setItems={setChecklist} />
        </div>
      </div>
    </div>
  );
}
