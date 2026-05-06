"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, TrendingUp, BarChart3, Package, CheckSquare, ClipboardList, Shield } from "lucide-react";

const iconMap = {
  TrendingUp,
  BarChart3,
  Package,
  CheckSquare,
  ClipboardList,
  Shield,
};

interface Props {
  title: string;
  href: string;
  iconName: keyof typeof iconMap;
  score: number;
  status: "ok" | "warning" | "critical";
  metric: string;
  metricLabel: string;
  alertCount?: number;
  index: number;
}

const statusConfig = {
  ok: { color: "#22c55e", bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.2)" },
  warning: { color: "#fbc024", bg: "rgba(251,192,36,0.1)", border: "rgba(251,192,36,0.2)" },
  critical: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.2)" },
};

export default function ModuleCard({
  title, href, iconName, score, status, metric, metricLabel, alertCount = 0, index,
}: Props) {
  const cfg = statusConfig[status];
  const Icon = iconMap[iconName];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.07 }}
      whileHover={{ y: -4 }}
    >
      <Link href={href}>
        <div className="glass-card rounded-xl p-5 cursor-pointer hover:border-[rgba(251,192,36,0.4)] transition-all duration-200 h-full">
          <div className="flex items-start justify-between mb-4">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: cfg.bg, border: `1px solid ${cfg.border}` }}
            >
              <Icon className="w-5 h-5" style={{ color: cfg.color }} />
            </div>
            {alertCount > 0 && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)]">
                <AlertTriangle className="w-3 h-3 text-[#ef4444]" />
                <span className="text-xs font-bold text-[#ef4444]">{alertCount}</span>
              </div>
            )}
          </div>

          <h3 className="text-sm font-semibold text-white mb-1">{title}</h3>
          <p className="text-2xl font-bold text-white mb-0.5">{metric}</p>
          <p className="text-xs text-[#94a3b8] mb-4">{metricLabel}</p>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-xs text-[#94a3b8]">Performans Puanı</span>
              <span className="text-xs font-bold" style={{ color: cfg.color }}>
                %{score}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-[rgba(255,255,255,0.05)]">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: cfg.color }}
                initial={{ width: 0 }}
                animate={{ width: `${score}%` }}
                transition={{ duration: 0.8, delay: index * 0.07 + 0.3 }}
              />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
