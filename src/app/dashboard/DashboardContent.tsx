"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import PilotScore   from "@/components/dashboard/PilotScore";
import ModuleCard   from "@/components/dashboard/ModuleCard";
import QuickActions from "@/components/dashboard/QuickActions";
import { useNakit }           from "@/store/nakit";
import { useGorevler }        from "@/store/gorevler";
import { useStok }            from "@/store/stok";
import { useProsedurler }     from "@/store/prosedurler";
import { useAcilFon }         from "@/store/acilFon";
import { useIsletmeGiderleri } from "@/store/isletmeGiderleri";
import {
  nakitSkoru, gorevSkoru, stokSkoru,
  prosedurSkoru, acilFonSkoru, pilotSkoru,
} from "@/lib/pilot-score";
import { formatTL } from "@/lib/nakit-data";
import { stokDurumu } from "@/lib/stok-data";

export default function DashboardContent() {
  const { islemler }   = useNakit();
  const { gorevler }   = useGorevler();
  const { urunler }    = useStok();
  const { prosedurler, checklist } = useProsedurler();
  const { islemler: fonIslemler, ayar } = useAcilFon();
  const { giderler }   = useIsletmeGiderleri();

  /* ── Modül skorları ── */
  const mNakit   = useMemo(() => nakitSkoru(islemler),                   [islemler]);
  const mGorev   = useMemo(() => gorevSkoru(gorevler),                   [gorevler]);
  const mStok    = useMemo(() => stokSkoru(urunler),                     [urunler]);
  const mPros    = useMemo(() => prosedurSkoru(prosedurler, checklist),  [prosedurler, checklist]);
  const mAcil    = useMemo(() => acilFonSkoru(fonIslemler, ayar),        [fonIslemler, ayar]);

  const genelSkor = useMemo(
    () => pilotSkoru([mNakit, mGorev, mStok, mPros, mAcil]),
    [mNakit, mGorev, mStok, mPros, mAcil]
  );

  /* ── Nakit özet ── */
  const gelir = useMemo(() => islemler.filter((i) => i.tip === "gelir").reduce((s, i) => s + i.tutar, 0), [islemler]);
  const gider = useMemo(() => islemler.filter((i) => i.tip === "gider").reduce((s, i) => s + i.tutar, 0), [islemler]);
  const toplamGider = gider + giderler.reduce((s, g) => s + g.tutar, 0);
  const net   = gelir - toplamGider;

  /* ── Görev özet ── */
  const acikGorev  = useMemo(() => gorevler.filter((g) => g.durum !== "tamamlandi").length, [gorevler]);
  const gecikGorev = useMemo(() => gorevler.filter((g) => g.durum !== "tamamlandi" && new Date(g.sonTarih) < new Date()).length, [gorevler]);
  const tamGorev   = useMemo(() => gorevler.filter((g) => g.durum === "tamamlandi").length, [gorevler]);
  const kritikStok = useMemo(() => urunler.filter((u) => stokDurumu(u) === "kritik").length, [urunler]);

  /* ── Modül kartları ── */
  const modules = useMemo(() => [
    { title: mNakit.baslik,  href: "/nakit-akisi", iconName: "TrendingUp"    as const, score: mNakit.skor, status: mNakit.durum,  metric: mNakit.metrik,  metricLabel: mNakit.metrikLabel, alertCount: mNakit.uyariSayisi  },
    { title: "Kar-Zarar",    href: "/kar-zarar",   iconName: "BarChart3"     as const, score: 0,            status: "ok"           as const, metric: "—",   metricLabel: "Veri girilmedi",   alertCount: 0 },
    { title: mStok.baslik,   href: "/stok",         iconName: "Package"      as const, score: mStok.skor,  status: mStok.durum,   metric: mStok.metrik,   metricLabel: mStok.metrikLabel,  alertCount: mStok.uyariSayisi  },
    { title: mGorev.baslik,  href: "/gorevler",     iconName: "CheckSquare"  as const, score: mGorev.skor, status: mGorev.durum,  metric: String(acikGorev), metricLabel: gecikGorev > 0 ? `${gecikGorev} gecikmiş` : "Açık görev", alertCount: gecikGorev },
    { title: mPros.baslik,   href: "/prosedurler",  iconName: "ClipboardList" as const, score: mPros.skor, status: mPros.durum,   metric: mPros.metrik,   metricLabel: mPros.metrikLabel,  alertCount: mPros.uyariSayisi  },
    { title: mAcil.baslik,   href: "/acil-fon",     iconName: "Shield"       as const, score: mAcil.skor,  status: mAcil.durum,   metric: mAcil.metrik,   metricLabel: mAcil.metrikLabel,  alertCount: mAcil.uyariSayisi  },
  ], [mNakit, mStok, mGorev, mPros, mAcil, acikGorev, gecikGorev]);

  const enZayif = useMemo(() => [...modules].sort((a, b) => a.score - b.score).slice(0, 3), [modules]);

  const summaryStats = [
    { label: "Toplam Gelir",    value: islemler.length > 0 ? formatTL(gelir)       : "—", change: islemler.length > 0 ? (gelir >= toplamGider ? "Pozitif" : "Negatif") : "Henüz veri yok", up: gelir >= toplamGider },
    { label: "Toplam Gider",    value: toplamGider > 0 ? formatTL(toplamGider)     : "—", change: toplamGider > 0 ? `${islemler.filter((i) => i.tip === "gider").length} işlem` : "Henüz veri yok", up: false },
    { label: "Net Nakit Akışı", value: islemler.length > 0 ? (net >= 0 ? "+" : "") + formatTL(net) : "—", change: islemler.length > 0 ? (net >= 0 ? "Kârlı dönem" : "Dikkat!") : "Henüz veri yok", up: net >= 0 },
  ];

  const quickStats = [
    { label: "Açık Görev",       value: acikGorev,         alt: gecikGorev > 0 ? `${gecikGorev} gecikmiş` : (gorevler.length === 0 ? "Görev eklenmedi" : "Takipte"), color: gecikGorev > 0 ? "#ef4444" : (gorevler.length === 0 ? "#64748b" : "#22c55e"), href: "/gorevler"    },
    { label: "Kritik Stok",      value: kritikStok,        alt: kritikStok > 0 ? "Acil sipariş gerekiyor" : (urunler.length === 0 ? "Ürün eklenmedi" : "Stok tamam"), color: kritikStok > 0 ? "#ef4444" : (urunler.length === 0 ? "#64748b" : "#22c55e"), href: "/stok"        },
    { label: "Toplam İşlem",     value: islemler.length,   alt: islemler.length > 0 ? `${islemler.filter((i) => i.tip === "gelir").length} G · ${islemler.filter((i) => i.tip === "gider").length} Gi` : "İşlem eklenmedi", color: islemler.length > 0 ? "#fbc024" : "#64748b", href: "/nakit-akisi" },
    { label: "Tamamlanan Görev", value: tamGorev,          alt: gorevler.length > 0 ? `/ ${gorevler.length} toplam` : "Görev eklenmedi",                          color: tamGorev > 0 ? "#22c55e" : "#64748b",                               href: "/gorevler"    },
  ];

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <PilotScore score={genelSkor} enZayif={enZayif} />
        </div>
        <div className="lg:col-span-2 flex flex-col gap-6">
          <QuickActions />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {summaryStats.map(({ label, value, change, up }, i) => (
              <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="glass-card rounded-xl p-4">
                <p className="text-xs text-[#94a3b8] mb-1">{label}</p>
                <p className="text-lg font-bold text-white">{value}</p>
                <span className={`text-xs font-medium ${value === "—" ? "text-[#64748b]" : up ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                  {value !== "—" && (up ? "▲" : "▼")} {change}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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

      <div>
        <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-widest mb-4">Modüller</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((mod, i) => <ModuleCard key={mod.href} {...mod} index={i} />)}
        </div>
      </div>
    </>
  );
}
