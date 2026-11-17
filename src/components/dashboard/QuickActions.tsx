"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  TrendingUp, TrendingDown, Package,
  CheckSquare, ClipboardList, Shield,
} from "lucide-react";

const actions = [
  { label: "Gelir Ekle",    icon: TrendingUp,   color: "#e5e5e5", href: "/nakit-akisi?modal=gelir" },
  { label: "Gider Ekle",    icon: TrendingDown, color: "#EF4444", href: "/nakit-akisi?modal=gider" },
  { label: "Ürün Ekle",     icon: Package,      color: "#3B82F6", href: "/stok?modal=urun-ekle"   },
  { label: "Görev Ekle",    icon: CheckSquare,  color: "#8B5CF6", href: "/gorevler?modal=ekle"    },
  { label: "Prosedür Ekle", icon: ClipboardList, color: "#d4a373", href: "/prosedurler"            },
  { label: "Fon Yatır",     icon: Shield,        color: "#e5e5e5", href: "/acil-fon"               },
];

export default function QuickActions() {
  const router = useRouter();

  return (
    <div className="card p-4 md:p-5 h-full flex flex-col">
      <p className="section-label mb-3">Hızlı Aksiyonlar</p>

      {/* Mobile: yatay scroll chip'ler */}
      <div className="md:hidden overflow-x-auto -mx-1 px-1" style={{ scrollbarWidth: "none" }}>
        <div className="flex gap-2.5 pb-1 w-max">
          {actions.map(({ label, icon: Icon, color, href }, i) => (
            <motion.button
              key={label}
              onClick={() => router.push(href)}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex flex-col items-center gap-1.5 p-3 min-w-18 min-h-18 rounded-xl border border-gray-200 bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${color}18` }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <span className="text-[10px] text-gray-500 text-center leading-tight whitespace-nowrap">{label}</span>
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
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.06 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2.5 p-3 min-h-11 rounded-lg border border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300 hover:shadow-sm transition-all text-left"
          >
            <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${color}18` }}>
              <Icon className="w-3.5 h-3.5" style={{ color }} />
            </div>
            <span className="text-xs text-gray-600 leading-tight font-medium">{label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
