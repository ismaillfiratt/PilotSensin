"use client";

import { motion } from "framer-motion";
import { Package, AlertTriangle, TrendingDown, Skull } from "lucide-react";
import { stokDurumu } from "@/lib/stok-data";
import { useStok } from "@/store/stok";

export default function StokOzet() {
  const { urunler } = useStok();
  const kritikler = urunler.filter((u) => stokDurumu(u) === "kritik");
  const uyarilar  = urunler.filter((u) => stokDurumu(u) === "uyari");
  const oluStok   = urunler.filter((u) => stokDurumu(u) === "olu");

  const stats = [
    { label: "Toplam Ürün",     value: urunler.length,   icon: Package,       color: "#64748B", bg: "#F1F5F9" },
    { label: "Kritik Stok",     value: kritikler.length, icon: AlertTriangle, color: "#EF4444", bg: "#FEF2F2" },
    { label: "Uyarı Seviyesi",  value: uyarilar.length,  icon: TrendingDown,  color: "#F59E0B", bg: "#FFFBEB" },
    { label: "Ölü Stok (90g+)", value: oluStok.length,   icon: Skull,         color: "#94A3B8", bg: "#F8FAFC" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(({ label, value, icon: Icon, color, bg }, i) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07 }}
          className="card p-4 flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: bg }}>
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800 font-number">{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
