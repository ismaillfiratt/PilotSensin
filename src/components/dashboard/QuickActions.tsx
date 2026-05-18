"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  TrendingUp, TrendingDown, Package,
  CheckSquare, ClipboardList, Shield,
} from "lucide-react";

const actions = [
  { label: "Gelir Ekle",    icon: TrendingUp,   color: "#22c55e", href: "/nakit-akisi?modal=gelir" },
  { label: "Gider Ekle",    icon: TrendingDown, color: "#ef4444", href: "/nakit-akisi?modal=gider" },
  { label: "Ürün Ekle",     icon: Package,       color: "#fbc024", href: "/stok?modal=urun-ekle"   },
  { label: "Görev Ekle",    icon: CheckSquare,   color: "#94a3b8", href: "/gorevler?modal=ekle"    },
  { label: "Prosedür Ekle", icon: ClipboardList, color: "#3b82f6", href: "/prosedurler"             },
  { label: "Fon Yatır",     icon: Shield,        color: "#22c55e", href: "/acil-fon"                },
];

export default function QuickActions() {
  const router = useRouter();

  return (
    <div className="glass-card rounded-2xl p-4 md:p-5 h-full flex flex-col">
      <h2 className="text-xs font-semibold text-[#94a3b8] uppercase tracking-widest mb-3">
        Hızlı Aksiyonlar
      </h2>

      {/* Mobile: yatay scroll chip'ler */}
      <div className="md:hidden overflow-x-auto scrollbar-none -mx-1 px-1">
        <div className="flex gap-2.5 pb-1 w-max">
          {actions.map(({ label, icon: Icon, color, href }, i) => (
            <motion.button
              key={label}
              onClick={() => router.push(href)}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex flex-col items-center gap-1.5 p-3 min-w-[72px] min-h-[72px] rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] active:bg-[rgba(251,192,36,0.08)] active:border-[rgba(251,192,36,0.2)] transition-colors"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${color}20` }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <span className="text-[10px] text-[#94a3b8] text-center leading-tight whitespace-nowrap">{label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Desktop: 2 kolon grid */}
      <div className="hidden md:grid md:grid-cols-2 gap-2 flex-1 content-start">
        {actions.map(({ label, icon: Icon, color, href }, i) => (
          <motion.button
            key={label}
            onClick={() => router.push(href)}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.06 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 p-3 min-h-11 rounded-lg border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(251,192,36,0.08)] hover:border-[rgba(251,192,36,0.2)] transition-all text-left"
          >
            <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${color}20` }}>
              <Icon className="w-3.5 h-3.5" style={{ color }} />
            </div>
            <span className="text-xs text-[#94a3b8] leading-tight">{label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
