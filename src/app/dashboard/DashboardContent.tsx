"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import PilotScore  from "@/components/dashboard/PilotScore";
import ModuleCard  from "@/components/dashboard/ModuleCard";
import QuickActions from "@/components/dashboard/QuickActions";
import { useNakit }    from "@/store/nakit";
import { useGorevler } from "@/store/gorevler";
import { useStok }     from "@/store/stok";
import { nakitSkoru, gorevSkoru, stokSkoru, pilotSkoru } from "@/lib/pilot-score";
import { formatTL } from "@/lib/nakit-data";
import { stokDurumu } from "@/lib/stok-data";

export default function DashboardContent() {
  const { islemler } = useNakit();
  const { gorevler } = useGorevler();
  const { urunler  } = useStok();

  /* ── Modül skorları ── */
  const mNakit = useMemo(() => nakitSkoru(islemler), [islemler]);
  const mGorev = useMemo(() => gorevSkoru(gorevler), [gorevler]);
  const mStok  = useMemo(() => stokSkoru(urunler),   [urunler]);

  const genelSkor = useMemo(
    () => pilotSkoru([mNakit, mGorev, mStok]),
    [mNakit, mGorev, mStok]
  );

  /* ── Nakit özet ── */
  const gelir = useMemo(() => islemler.filter((i) => i.tip === "gelir").reduce((s, i) => s + i.tutar, 0), [islemler]);
  const gider = useMemo(() => islemler.filter((i) => i.tip === "gider").reduce((s, i) => s + i.tutar, 0), [islemler]);
  const net   = gelir - gider;

  /* ── Görev & Stok özet ── */
  const acikGorev    = useMemo(() => gorevler.filter((g) => g.durum !== "tamamlandi").length, [gorevler]);
  const gecikGorev   = useMemo(() => gorevler.filter((g) => g.durum !== "tamamlandi" && new Date(g.sonTarih) < new Date()).length, [gorevler]);
  const tamGorev     = useMemo(() => gorevler.filter((g) => g.durum === "tamamlandi").length, [gorevler]);
  const kritikStok   = useMemo(() => urunler.filter((u) => stokDurumu(u) === "kritik").length, [urunler]);

  /* ── Modül kart listesi ── */
  const modules = useMemo(() => [
    { title: mNakit.baslik, href: "/nakit-akisi", iconName: "TrendingUp" as const,    score: mNakit.skor, status: mNakit.durum, metric: mNakit.metrik, metricLabel: mNakit.metrikLabel, alertCount: mNakit.uyariSayisi },
    { title: "Kar-Zarar",  href: "/kar-zarar",   iconName: "BarChart3"  as const,    score: 68,          status: "warning" as const, metric: "%18",    metricLabel: "Brüt marj",         alertCount: 1 },
    { title: mStok.baslik,  href: "/stok",         iconName: "Package"    as const,    score: mStok.skor,  status: mStok.durum, metric: mStok.metrik,   metricLabel: mStok.metrikLabel,   alertCount: mStok.uyariSayisi },
    { title: mGorev.baslik, href: "/gorevler",     iconName: "CheckSquare" as const,   score: mGorev.skor, status: mGorev.durum, metric: String(acikGorev), metricLabel: gecikGorev > 0 ? `${gecikGorev} gecikmiş` : "Açık görev", alertCount: gecikGorev },
    { title: "Prosedürler", href: "/prosedurler",  iconName: "ClipboardList" as const, score: 80,          status: "ok" as const,      metric: "%85",    metricLabel: "Tamamlanma oranı",  alertCount: 0 },
    { title: "Acil Durum Fonu", href: "/acil-fon", iconName: "Shield"    as const,    score: 35,          status: "critical" as const, metric: "₺12.000", metricLabel: "Mevcut / ₺30.000 hedef", alertCount: 1 },
  ], [mNakit, mStok, mGorev, acikGorev, gecikGorev]);

  const enZayif = useMemo(() => [...modules].sort((a, b) => a.score - b.score).slice(0, 3), [modules]);

  const summaryStats = [
    { label: "Toplam Gelir",    value: formatTL(gelir), change: gelir >= gider ? "Pozitif seyir" : "Negatif seyir", up: gelir >= gider },
    { label: "Toplam Gider",    value: formatTL(gider), change: `${islemler.filter((i) => i.tip === "gider").length} işlem`, up: false },
    { label: "Net Nakit Akışı", value: (net >= 0 ? "+" : "") + formatTL(net), change: net >= 0 ? "Kârlı dönem" : "Dikkat!", up: net >= 0 },
  ];

  const quickStats = [
    { label: "Açık Görev",       value: acikGorev,          alt: gecikGorev > 0 ? `${gecikGorev} gecikmiş` : "Takipte",         color: gecikGorev > 0 ? "#ef4444" : "#22c55e", href: "/gorevler"   },
    { label: "Kritik Stok",      value: kritikStok,         alt: kritikStok > 0 ? "Acil sipariş gerekiyor" : "Stok tamam",      color: kritikStok > 0 ? "#ef4444" : "#22c55e", href: "/stok"       },
    { label: "Toplam İşlem",     value: islemler.length,    alt: `${islemler.filter((i) => i.tip === "gelir").length} G · ${islemler.filter((i) => i.tip === "gider").length} Gi`, color: "#fbc024",  href: "/nakit-akisi" },
    { label: "Tamamlanan Görev", value: tamGorev,           alt: `/ ${gorevler.length} toplam`,                                color: "#22c55e",                              href: "/gorevler"   },
  ];

  return (
    <>
      {/* Skor + Hızlı Aksiyonlar + Özet */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <PilotScore score={genelSkor} enZayif={enZayif} />
        </div>
        <div className="lg:col-span-2 flex flex-col gap-6">
          <QuickActions />
          <div className="grid grid-cols-3 gap-3">
            {summaryStats.map(({ label, value, change, up }, i) => (
              <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="glass-card rounded-xl p-4">
                <p className="text-xs text-[#94a3b8] mb-1">{label}</p>
                <p className="text-lg font-bold text-white">{value}</p>
                <span className={`text-xs font-medium ${up ? "text-[#22c55e]" : "text-[#ef4444]"}`}>{up ? "▲" : "▼"} {change}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Anlık özet kartlar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map(({ label, value, alt, color, href }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Link href={href} className="glass-card rounded-xl p-4 block hover:border-[rgba(251,192,36,0.3)] transition-colors">
              <p className="text-xs text-[#94a3b8] mb-2">{label}</p>
              <p className="text-2xl font-bold" style={{ color }}>{value}</p>
              <p className="text-xs mt-1" style={{ color }}>{alt}</p>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Modüller */}
      <div>
        <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-widest mb-4">Modüller</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((mod, i) => <ModuleCard key={mod.href} {...mod} index={i} />)}
        </div>
      </div>
    </>
  );
}
