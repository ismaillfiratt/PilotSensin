"use client";

import { motion } from "framer-motion";
import { Package, AlertTriangle, TrendingDown, Skull } from "lucide-react";
import { stokDurumu } from "@/lib/stok-data";
import { useStok } from "@/store/stok";

export default function StokOzet() {
  const { urunler } = useStok();
  const kritikler = urunler.filter((u) => stokDurumu(u) === "kritik");
  const uyarilar = urunler.filter((u) => stokDurumu(u) === "uyari");
  const oluStok = urunler.filter((u) => stokDurumu(u) === "olu");

  const stats = [
    {
      label: "Toplam Ürün",
      value: urunler.length,
      icon: Package,
      color: "#94a3b8",
      bg: "rgba(148,163,184,0.1)",
    },
    {
      label: "Kritik Stok",
      value: kritikler.length,
      icon: AlertTriangle,
      color: "#ef4444",
      bg: "rgba(239,68,68,0.1)",
    },
    {
      label: "Uyarı Seviyesi",
      value: uyarilar.length,
      icon: TrendingDown,
      color: "#fbc024",
      bg: "rgba(251,192,36,0.1)",
    },
    {
      label: "Ölü Stok (90g+)",
      value: oluStok.length,
      icon: Skull,
      color: "#94a3b8",
      bg: "rgba(148,163,184,0.08)",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(({ label, value, icon: Icon, color, bg }, i) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07 }}
          className="glass-card rounded-xl p-4 flex items-center gap-4"
        >
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: bg }}
          >
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-[#94a3b8] mt-0.5">{label}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
