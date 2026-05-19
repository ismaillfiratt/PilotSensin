"use client";

import { useMemo } from "react";
import { useProsedurler } from "@/store/prosedurler";
import ProsedurOzet    from "@/components/prosedurler/ProsedurOzet";
import SopSablonPanel  from "@/components/prosedurler/SopSablonPanel";
import ProsedurListesi from "@/components/prosedurler/ProsedurListesi";
import SabloPanel      from "@/components/prosedurler/SabloPanel";
import ChecklistPanel  from "@/components/prosedurler/ChecklistPanel";

export default function ProsedurlerPage() {
  const { prosedurler, checklist } = useProsedurler();

  const aktifPros = useMemo(() => prosedurler.filter((p) => !p.silindi).length, [prosedurler]);
  const tamamlananCL = useMemo(
    () => checklist.filter((c) => !c.silindi && c.tamamlandi).length,
    [checklist]
  );
  const toplamCL = useMemo(() => checklist.filter((c) => !c.silindi).length, [checklist]);

  return (
    <div className="max-w-6xl mx-auto px-2">
      {/* Hero */}
      <section className="space-y-2 py-6">
        <p className="label-caps">PROSEDÜRLER · SOP</p>
        <div className="flex items-baseline gap-3">
          <span className="hero-number">{aktifPros}</span>
          <span className="text-lg text-gray-400">prosedür</span>
        </div>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Kontrol listesi: {tamamlananCL}/{toplamCL} tamamlandı
        </p>
      </section>

      <hr className="section-rule" />
      <ProsedurOzet prosedurler={prosedurler} checklist={checklist} />
      <hr className="section-rule" />

      <section className="space-y-3 py-2">
        <h2 className="text-sm font-semibold">SOP belge şablonları</h2>
        <SopSablonPanel />
      </section>

      <hr className="section-rule" />

      <section className="space-y-3 py-2">
        <h2 className="text-sm font-semibold">SOP belgeleri</h2>
        <ProsedurListesi />
      </section>

      <hr className="section-rule" />

      <section className="space-y-3 py-2">
        <h2 className="text-sm font-semibold">Kontrol listesi şablonları</h2>
        <SabloPanel />
      </section>

      <hr className="section-rule" />

      <section className="space-y-3 py-2">
        <h2 className="text-sm font-semibold">Kontrol listesi</h2>
        <ChecklistPanel />
      </section>
    </div>
  );
}
