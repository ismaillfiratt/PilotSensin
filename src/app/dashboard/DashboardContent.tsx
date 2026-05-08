"use client";

import { useMemo } from "react";
import PilotScore        from "@/components/dashboard/PilotScore";
import ModuleCard        from "@/components/dashboard/ModuleCard";
import QuickActions      from "@/components/dashboard/QuickActions";
import BugunYapilacaklar from "@/components/dashboard/BugunYapilacaklar";
import { useNakit }        from "@/store/nakit";
import { useGorevler }     from "@/store/gorevler";
import { useStok }         from "@/store/stok";
import { useProsedurler }  from "@/store/prosedurler";
import { useAcilFon }      from "@/store/acilFon";
import {
  nakitSkoru, gorevSkoru, stokSkoru,
  prosedurSkoru, acilFonSkoru, pilotSkoru,
} from "@/lib/pilot-score";

export default function DashboardContent() {
  const { islemler }                    = useNakit();
  const { gorevler }                    = useGorevler();
  const { urunler }                     = useStok();
  const { prosedurler, checklist }      = useProsedurler();
  const { islemler: fonIslemler, ayar } = useAcilFon();

  const mNakit = useMemo(() => nakitSkoru(islemler),                   [islemler]);
  const mGorev = useMemo(() => gorevSkoru(gorevler),                   [gorevler]);
  const mStok  = useMemo(() => stokSkoru(urunler),                     [urunler]);
  const mPros  = useMemo(() => prosedurSkoru(prosedurler, checklist),  [prosedurler, checklist]);
  const mAcil  = useMemo(() => acilFonSkoru(fonIslemler, ayar),        [fonIslemler, ayar]);

  const genelSkor = useMemo(
    () => pilotSkoru([mNakit, mGorev, mStok, mPros, mAcil]),
    [mNakit, mGorev, mStok, mPros, mAcil]
  );

  const acikGorev  = useMemo(() => gorevler.filter((g) => g.durum !== "tamamlandi").length, [gorevler]);
  const gecikGorev = useMemo(() => gorevler.filter((g) => g.durum !== "tamamlandi" && new Date(g.sonTarih) < new Date()).length, [gorevler]);

  const modules = useMemo(() => [
    { title: mNakit.baslik, href: "/nakit-akisi", iconName: "TrendingUp"    as const, score: mNakit.skor, status: mNakit.durum, metric: mNakit.metrik, metricLabel: mNakit.metrikLabel, alertCount: mNakit.uyariSayisi },
    { title: "Kar-Zarar",   href: "/kar-zarar",   iconName: "BarChart3"     as const, score: 100,          status: "ok"         as const, metric: "—",  metricLabel: "Veri girilmedi",   alertCount: 0 },
    { title: mStok.baslik,  href: "/stok",         iconName: "Package"      as const, score: mStok.skor,  status: mStok.durum,  metric: mStok.metrik,  metricLabel: mStok.metrikLabel,  alertCount: mStok.uyariSayisi  },
    { title: mGorev.baslik, href: "/gorevler",     iconName: "CheckSquare"  as const, score: mGorev.skor, status: mGorev.durum, metric: String(acikGorev), metricLabel: gecikGorev > 0 ? `${gecikGorev} gecikmiş` : "Açık görev", alertCount: gecikGorev },
    { title: mPros.baslik,  href: "/prosedurler",  iconName: "ClipboardList" as const, score: mPros.skor, status: mPros.durum,  metric: mPros.metrik,  metricLabel: mPros.metrikLabel,  alertCount: mPros.uyariSayisi  },
    { title: mAcil.baslik,  href: "/acil-fon",     iconName: "Shield"       as const, score: mAcil.skor,  status: mAcil.durum,  metric: mAcil.metrik,  metricLabel: mAcil.metrikLabel,  alertCount: mAcil.uyariSayisi  },
  ], [mNakit, mStok, mGorev, mPros, mAcil, acikGorev, gecikGorev]);

  const enZayif = useMemo(() => [...modules].sort((a, b) => a.score - b.score).slice(0, 3), [modules]);

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <PilotScore score={genelSkor} enZayif={enZayif} />
        <QuickActions />
        <BugunYapilacaklar />
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
