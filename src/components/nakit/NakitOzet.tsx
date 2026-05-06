"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Wallet, ArrowUpDown } from "lucide-react";
import { formatTL } from "@/lib/nakit-data";
import { useNakit } from "@/store/nakit";

export default function NakitOzet() {
  const { islemler } = useNakit();

  const gelir = islemler.filter((i) => i.tip === "gelir").reduce((s, i) => s + i.tutar, 0);
  const gider = islemler.filter((i) => i.tip === "gider").reduce((s, i) => s + i.tutar, 0);
  const net   = gelir - gider;

  const kartlar = [
    {
      label: "Bu Dönem Gelir",
      value: formatTL(gelir),
      alt: "+%8 geçen döneme göre",
      icon: TrendingUp,
      color: "#22c55e",
      bg: "rgba(34,197,94,0.1)",
      border: "rgba(34,197,94,0.2)",
    },
    {
      label: "Bu Dönem Gider",
      value: formatTL(gider),
      alt: "+%3 geçen döneme göre",
      icon: TrendingDown,
      color: "#ef4444",
      bg: "rgba(239,68,68,0.1)",
      border: "rgba(239,68,68,0.2)",
    },
    {
      label: "Net Nakit Akışı",
      value: (net >= 0 ? "+" : "") + formatTL(net),
      alt: net >= 0 ? "Pozitif seyir" : "Dikkat: Negatif",
      icon: ArrowUpDown,
      color: net >= 0 ? "#22c55e" : "#ef4444",
      bg: net >= 0 ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
      border: net >= 0 ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)",
    },
    {
      label: "Toplam İşlem",
      value: `${islemler.length} adet`,
      alt: `${islemler.filter((i) => i.tip === "gelir").length} gelir · ${islemler.filter((i) => i.tip === "gider").length} gider`,
      icon: Wallet,
      color: "#fbc024",
      bg: "rgba(251,192,36,0.1)",
      border: "rgba(251,192,36,0.2)",
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
