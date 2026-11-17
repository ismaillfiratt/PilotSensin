"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, DollarSign, Percent } from "lucide-react";
import { formatTL } from "@/lib/kar-zarar-data";
import type { Kurus } from "@/lib/para";
import { useIsletmeGiderleri } from "@/store/isletmeGiderleri";
import { useSatislar } from "@/store/satislar";

export default function KarZararOzet() {
  const { kayitlar } = useSatislar();
  const { giderler } = useIsletmeGiderleri();

  const { toplamCiroKurus, toplamSMM, brutKarKurus, brutMarj, toplamOpGider, netKar, netMarj } = useMemo(() => {
    const simdi   = new Date();
    const ayBasi  = new Date(simdi.getFullYear(), simdi.getMonth(), 1);
    const buAylar = kayitlar.filter((k) => new Date(k.tarih) >= ayBasi);

    const toplamCiroKurus  = buAylar.reduce((t, k) => t + k.toplamCiroKurus, 0);
    const toplamSMM   = buAylar.reduce((t, k) => t + k.birimAlisFiyatiKurus * k.adet, 0);
    const brutKarKurus     = buAylar.reduce((t, k) => t + k.brutKarKurus, 0);
    const brutMarj    = toplamCiroKurus > 0 ? (brutKarKurus / toplamCiroKurus) * 100 : 0;
    const toplamOpGider = giderler.reduce((s, g) => s + g.tutarKurus, 0);
    const netKar      = brutKarKurus - toplamOpGider;
    const netMarj     = toplamCiroKurus > 0 ? (netKar / toplamCiroKurus) * 100 : 0;
    return { toplamCiroKurus, toplamSMM, brutKarKurus, brutMarj, toplamOpGider, netKar, netMarj };
  }, [kayitlar, giderler]);

  const kartlar = [
    {
      label: "Bu Ay Ciro",
      value: formatTL(toplamCiroKurus),
      alt:   "KDV hariç toplam satış",
      icon:  TrendingUp,
      color: "#22c55e",
      bg:    "rgba(34,197,94,0.1)",
      border:"rgba(34,197,94,0.2)",
    },
    {
      label: "Satılan Mal Maliyeti",
      value: formatTL(toplamSMM),
      alt:   toplamCiroKurus > 0 ? `Ciroya oranı %${((toplamSMM / toplamCiroKurus) * 100).toFixed(0)}` : "—",
      icon:  TrendingDown,
      color: "#ef4444",
      bg:    "rgba(239,68,68,0.1)",
      border:"rgba(239,68,68,0.2)",
    },
    {
      label: "Brüt Kâr",
      value: formatTL(brutKarKurus),
      alt:   `Brüt marj %${brutMarj.toFixed(1)}`,
      icon:  DollarSign,
      color: brutMarj >= 25 ? "#22c55e" : brutMarj >= 15 ? "#F59E0B" : "#ef4444",
      bg:    brutMarj >= 25 ? "rgba(34,197,94,0.1)"  : brutMarj >= 15 ? "rgba(245,158,11,0.1)"  : "rgba(239,68,68,0.1)",
      border:brutMarj >= 25 ? "rgba(34,197,94,0.2)"  : brutMarj >= 15 ? "rgba(245,158,11,0.2)"  : "rgba(239,68,68,0.2)",
    },
    {
      label: "Net Kâr",
      value: (netKar < 0 ? "-" : "") + formatTL(Math.abs(netKar)),
      alt:   `Net marj %${netMarj.toFixed(1)} · Op.Gider ${formatTL(toplamOpGider)}`,
      icon:  Percent,
      color: netKar >= 0 ? "#22c55e" : "#ef4444",
      bg:    netKar >= 0 ? "rgba(34,197,94,0.1)"  : "rgba(239,68,68,0.1)",
      border:netKar >= 0 ? "rgba(34,197,94,0.2)"  : "rgba(239,68,68,0.2)",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {kartlar.map(({ label, value, alt, icon: Icon, color, bg, border }, i) => (
        <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07 }} className="card rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-400 font-medium">{label}</span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: bg, border: `1px solid ${border}` }}>
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
          </div>
          <p className="text-xl font-bold text-gray-800">{value}</p>
          <p className="text-xs mt-1 truncate" style={{ color }}>{alt}</p>
        </motion.div>
      ))}
    </div>
  );
}
