"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  TrendingUp, TrendingDown, Package,
  CheckSquare, BarChart3, ClipboardList, Shield,
} from "lucide-react";

const actions = [
  { label: "Gelir Ekle",      icon: TrendingUp,     color: "#22c55e", href: "/nakit-akisi?modal=gelir",   rotate: false },
  { label: "Gider Ekle",      icon: TrendingDown,   color: "#ef4444", href: "/nakit-akisi?modal=gider",   rotate: false },
  { label: "Ürün Ekle",       icon: Package,         color: "#fbc024", href: "/stok?modal=urun-ekle",      rotate: false },
  { label: "Görev Ekle",      icon: CheckSquare,     color: "#94a3b8", href: "/gorevler?modal=ekle",       rotate: false },
  { label: "Kar-Zarar",       icon: BarChart3,       color: "#a855f7", href: "/kar-zarar",                 rotate: false },
  { label: "Prosedür Ekle",   icon: ClipboardList,   color: "#3b82f6", href: "/prosedurler",               rotate: false },
  { label: "Fon Yatır",       icon: Shield,          color: "#22c55e", href: "/acil-fon",                  rotate: false },
];

export default function QuickActions() {
  const router = useRouter();

  return (
    <div className="glass-card rounded-2xl p-5">
      <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-widest mb-4">
        Hızlı Aksiyonlar
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {actions.map(({ label, icon: Icon, color, href }, i) => (
          <motion.button
            key={label}
            onClick={() => router.push(href)}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.06 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 p-3 rounded-lg border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(251,192,36,0.08)] hover:border-[rgba(251,192,36,0.2)] transition-all text-left"
          >
            <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}20` }}>
              <Icon className="w-3.5 h-3.5" style={{ color }} />
            </div>
            <span className="text-xs text-[#94a3b8] leading-tight">{label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
