"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, DollarSign, Percent } from "lucide-react";
import { plOzeti, formatTL, type Urun } from "@/lib/kar-zarar-data";

export default function KarZararOzet({ urunler }: { urunler: Urun[] }) {
  const { toplamGelir, toplamSMM, brutKar, brutMarj, netKar, netMarj } = plOzeti(urunler);

  const kartlar = [
    {
      label: "Aylık Ciro",
      value: formatTL(toplamGelir),
      alt: "Toplam satış geliri",
      icon: TrendingUp,
      color: "#22c55e",
      bg: "rgba(34,197,94,0.1)",
      border: "rgba(34,197,94,0.2)",
    },
    {
      label: "Satılan Mal Maliyeti",
      value: formatTL(toplamSMM),
      alt: `Ciroya oranı %${((toplamSMM / toplamGelir) * 100).toFixed(0)}`,
      icon: TrendingDown,
      color: "#ef4444",
      bg: "rgba(239,68,68,0.1)",
      border: "rgba(239,68,68,0.2)",
    },
    {
      label: "Brüt Kar",
      value: formatTL(brutKar),
      alt: `Brüt marj %${brutMarj.toFixed(1)}`,
      icon: DollarSign,
      color: brutMarj >= 25 ? "#22c55e" : brutMarj >= 15 ? "#fbc024" : "#ef4444",
      bg: brutMarj >= 25 ? "rgba(34,197,94,0.1)" : brutMarj >= 15 ? "rgba(251,192,36,0.1)" : "rgba(239,68,68,0.1)",
      border: brutMarj >= 25 ? "rgba(34,197,94,0.2)" : brutMarj >= 15 ? "rgba(251,192,36,0.2)" : "rgba(239,68,68,0.2)",
    },
    {
      label: "Net Kar",
      value: (netKar < 0 ? "-" : "") + formatTL(netKar),
      alt: `Net marj %${netMarj.toFixed(1)}`,
      icon: Percent,
      color: netKar >= 0 ? "#22c55e" : "#ef4444",
      bg: netKar >= 0 ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
      border: netKar >= 0 ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {kartlar.map(({ label, value, alt, icon: Icon, color, bg, border }, i) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07 }}
          className="glass-card rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-[#94a3b8] font-medium">{label}</span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: bg, border: `1px solid ${border}` }}>
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
          </div>
          <p className="text-xl font-bold text-white">{value}</p>
          <p className="text-xs mt-1" style={{ color }}>{alt}</p>
        </motion.div>
      ))}
    </div>
  );
}
