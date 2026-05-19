"use client";

import { useMemo } from "react";
import PilotScore        from "@/components/dashboard/PilotScore";
import ModuleCard        from "@/components/dashboard/ModuleCard";
import QuickActions      from "@/components/dashboard/QuickActions";
import BugunYapilacaklar from "@/components/dashboard/BugunYapilacaklar";
import { useNakit }            from "@/store/nakit";
import { useGorevler }         from "@/store/gorevler";
import { useStok }             from "@/store/stok";
import { useSirket }           from "@/store/sirket";
import { useProsedurler }      from "@/store/prosedurler";
import { useAcilFon }          from "@/store/acilFon";
import { useSatislar }         from "@/store/satislar";
import { useIsletmeGiderleri } from "@/store/isletmeGiderleri";
import {
  nakitSkoru, gorevSkoru, stokSkoru,
  prosedurSkoru, acilFonSkoru, karZararSkoru, pilotSkoru,
} from "@/lib/pilot-score";
import { trGunBaslangici } from "@/lib/tarih";

export default function DashboardContent() {
  const { islemler }                                     = useNakit();
  const { gorevler }                                     = useGorevler();
  const { urunler }                                      = useStok();
  const { prosedurler, checklist }                       = useProsedurler();
  const { } = useSirket();
  const { islemler: fonIslemler, hedefler: fonHedefler } = useAcilFon();
  const { kayitlar: satisKayitlari }                     = useSatislar();
  const { giderler }                                     = useIsletmeGiderleri();

  const mNakit = useMemo(() => nakitSkoru(islemler),                    [islemler]);
  const mGorev = useMemo(() => gorevSkoru(gorevler),                    [gorevler]);
  const mStok  = useMemo(() => stokSkoru(urunler),                      [urunler]);
  const mPros  = useMemo(() => prosedurSkoru(prosedurler, checklist),   [prosedurler, checklist]);
  const mAcil  = useMemo(() => acilFonSkoru(fonIslemler, fonHedefler),  [fonIslemler, fonHedefler]);
  const mKZ    = useMemo(() => karZararSkoru(satisKayitlari, giderler), [satisKayitlari, giderler]);

  const genelSkor = useMemo(
    () => pilotSkoru([mNakit, mKZ, mGorev, mStok, mPros, mAcil]),
    [mNakit, mKZ, mGorev, mStok, mPros, mAcil]
  );

  const acikGorev  = useMemo(() => gorevler.filter((g) => g.durum !== "tamamlandi").length, [gorevler]);
  const gecikGorev = useMemo(() => {
    const gunBasi = trGunBaslangici();
    return gorevler.filter((g) => g.durum !== "tamamlandi" && new Date(g.sonTarih) < gunBasi).length;
  }, [gorevler]);

  const modules = useMemo(() => [
    { title: mNakit.baslik, href: "/nakit-akisi", iconName: "TrendingUp"   as const, score: mNakit.skor, status: mNakit.durum, metric: mNakit.metrik,      metricLabel: mNakit.metrikLabel,    alertCount: mNakit.uyariSayisi },
    { title: mKZ.baslik,    href: "/kar-zarar",   iconName: "BarChart3"    as const, score: mKZ.skor,    status: mKZ.durum,    metric: mKZ.metrik,          metricLabel: mKZ.metrikLabel,       alertCount: mKZ.uyariSayisi    },
    { title: mStok.baslik,  href: "/stok",        iconName: "Package"      as const, score: mStok.skor,  status: mStok.durum,  metric: mStok.metrik,        metricLabel: mStok.metrikLabel,     alertCount: mStok.uyariSayisi  },
    { title: mGorev.baslik, href: "/gorevler",    iconName: "CheckSquare"  as const, score: mGorev.skor, status: mGorev.durum, metric: String(acikGorev),   metricLabel: gecikGorev > 0 ? `${gecikGorev} gecikmiş` : "Açık görev", alertCount: gecikGorev },
    { title: mPros.baslik,  href: "/prosedurler", iconName: "ClipboardList" as const, score: mPros.skor, status: mPros.durum,  metric: mPros.metrik,        metricLabel: mPros.metrikLabel,     alertCount: mPros.uyariSayisi  },
    { title: mAcil.baslik,  href: "/acil-fon",    iconName: "Shield"       as const, score: mAcil.skor,  status: mAcil.durum,  metric: mAcil.metrik,        metricLabel: mAcil.metrikLabel,     alertCount: mAcil.uyariSayisi  },
  ], [mNakit, mKZ, mStok, mGorev, mPros, mAcil, acikGorev, gecikGorev]);

  const enZayif = useMemo(() => [...modules].sort((a, b) => a.score - b.score).slice(0, 3), [modules]);

  return (
    <>
      {/* Üst panel: skor + hızlı aksiyon + bugün */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 items-stretch">
        <PilotScore score={genelSkor} enZayif={enZayif} />
        <QuickActions />
        <BugunYapilacaklar />
      </div>

      {/* Modül kartları */}
      <div>
        <p className="section-label mb-3 lg:mb-4">Modüller</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 lg:gap-4">
          {modules.map((mod, i) => <ModuleCard key={mod.href} {...mod} index={i} />)}
        </div>
      </div>
    </>
  );
}
