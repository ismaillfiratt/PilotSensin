"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useProsedurler } from "@/store/prosedurler";
import { prosedurSkoru }  from "@/lib/pilot-score";
import ProsedurOzet    from "@/components/prosedurler/ProsedurOzet";
import SopSablonPanel  from "@/components/prosedurler/SopSablonPanel";
import ProsedurListesi from "@/components/prosedurler/ProsedurListesi";
import SabloPanel      from "@/components/prosedurler/SabloPanel";
import ChecklistPanel  from "@/components/prosedurler/ChecklistPanel";

function ProsedurSkorBadge({ skor, durum }: { skor: number; durum: "ok" | "warning" | "critical" }) {
  const renk   = durum === "ok" ? "#10B981" : durum === "warning" ? "#F59E0B" : "#EF4444";
  const etiket = durum === "ok" ? "İyi"     : durum === "warning" ? "Dikkat"  : "Kritik";
  const radius = 30;
  const circ   = 2 * Math.PI * radius;
  const offset = circ - (skor / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1.5 shrink-0">
      <div className="relative w-20 h-20">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 70 70">
          <circle cx="35" cy="35" r={radius} fill="none" stroke="#F3F4F6" strokeWidth="6" />
          <motion.circle
            cx="35" cy="35" r={radius} fill="none"
            stroke={renk} strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-number font-bold text-base" style={{ color: renk }}>%{skor}</span>
        </div>
      </div>
      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
        style={{ color: renk, background: `${renk}15`, border: `1px solid ${renk}30` }}>
        {etiket}
      </span>
    </div>
  );
}

export default function ProsedurlerPage() {
  const { prosedurler, checklist } = useProsedurler();

  const aktifPros = useMemo(() => prosedurler.filter((p) => !p.silindi).length, [prosedurler]);
  const tamamlananCL = useMemo(
    () => checklist.filter((c) => !c.silindi && c.tamamlandi).length,
    [checklist]
  );
  const toplamCL = useMemo(() => checklist.filter((c) => !c.silindi).length, [checklist]);
  const skor     = useMemo(() => prosedurSkoru(prosedurler, checklist), [prosedurler, checklist]);

  return (
    <div className="max-w-6xl mx-auto px-2">
      {/* Hero */}
      <section className="py-6">
        <div className="flex items-start justify-between gap-6">
          <div className="space-y-2">
            <p className="label-caps">PROSEDÜRLER · SOP</p>
            <div className="flex items-baseline gap-3">
              <span className="hero-number">{aktifPros}</span>
              <span className="text-lg text-gray-400">prosedür</span>
            </div>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Kontrol listesi: {tamamlananCL}/{toplamCL} tamamlandı
            </p>
          </div>
          <ProsedurSkorBadge skor={skor.skor} durum={skor.durum} />
        </div>
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
