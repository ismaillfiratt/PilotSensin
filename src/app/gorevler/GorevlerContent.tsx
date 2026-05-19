"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useGorevler } from "@/store/gorevler";
import { trGunBaslangici } from "@/lib/tarih";
import GorevOzet from "@/components/gorevler/GorevOzet";

const KanbanBoard        = dynamic(() => import("@/components/gorevler/KanbanBoard"),        { ssr: false, loading: () => <div className="h-64 card rounded-2xl animate-pulse" /> });
const GorevTarihselPanel = dynamic(() => import("@/components/gorevler/GorevTarihselPanel"), { ssr: false });

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

  return (
    <div className="max-w-6xl mx-auto px-2">
      {/* Hero */}
      <section className="space-y-2 py-6">
        <p className="label-caps">GÖREVLER</p>
        <div className="flex items-baseline gap-3">
          <span className="hero-number">{acik}</span>
          <span className="text-lg text-gray-400">açık görev</span>
        </div>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {tamamlandi} tamamlandı
          {gecik > 0 && (
            <> · <span className="font-medium" style={{ color: "var(--color-danger)" }}>
              {gecik} gecikmiş
            </span></>
          )}
        </p>
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
