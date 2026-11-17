"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useGorevler } from "@/store/gorevler";
import { trGunBaslangici } from "@/lib/tarih";
import { gorevSkoru } from "@/lib/pilot-score";
import GorevOzet from "@/components/gorevler/GorevOzet";

const KanbanBoard        = dynamic(() => import("@/components/gorevler/KanbanBoard"),        { ssr: false, loading: () => <div className="h-64 card rounded-2xl animate-pulse" /> });
const GorevTarihselPanel = dynamic(() => import("@/components/gorevler/GorevTarihselPanel"), { ssr: false });

function GorevSkorBadge({ skor, durum }: { skor: number; durum: "ok" | "warning" | "critical" }) {
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

export default function GorevlerContent() {
  const { gorevler } = useGorevler();
  const params       = useSearchParams();
  const modalParam   = params.get("modal");

  const aktif = useMemo(() => gorevler.filter((g) => !g.silindi), [gorevler]);
  const acik  = useMemo(() => aktif.filter((g) => g.durum !== "tamamlandi").length, [aktif]);
  const gecik = useMemo(() => {
    const gunBasi = trGunBaslangici();
    return aktif.filter((g) => g.durum !== "tamamlandi" && new Date(g.sonTarih) < gunBasi).length;
  }, [aktif]);
  const tamamlandi = useMemo(() => aktif.filter((g) => g.durum === "tamamlandi").length, [aktif]);
  const skor       = useMemo(() => gorevSkoru(aktif), [aktif]);

  return (
    <div className="max-w-6xl mx-auto px-2">
      {/* Hero */}
      <section className="py-6">
        <div className="flex items-start justify-between gap-6">
          <div className="space-y-2">
            <p className="label-caps">GÖREVLER</p>
            <div className="flex items-baseline gap-3">
              <span className="hero-number">{acik}</span>
              <span className="text-lg text-gray-400">açık görev</span>
            </div>
            {gecik > 0 && (
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                <span className="font-medium" style={{ color: "var(--color-danger)" }}>
                  {gecik} gecikmiş
                </span>
              </p>
            )}
          </div>
          <GorevSkorBadge skor={skor.skor} durum={skor.durum} />
        </div>
      </section>

      <hr className="section-rule" />
      <GorevOzet gorevler={gorevler} />
      <hr className="section-rule" />

      <section className="space-y-4 py-2">
        <h2 className="text-sm font-semibold">Kanban tablosu</h2>
        <KanbanBoard otomatikAcilModal={modalParam === "ekle"} />
      </section>

      <hr className="section-rule" />

      <section className="space-y-4 py-2">
        <h2 className="text-sm font-semibold">Tarihsel analiz</h2>
        <GorevTarihselPanel />
      </section>
    </div>
  );
}
