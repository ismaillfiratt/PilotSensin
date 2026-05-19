"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, TrendingUp, BarChart3, Package, CheckSquare, ClipboardList, Shield } from "lucide-react";

const iconMap = { TrendingUp, BarChart3, Package, CheckSquare, ClipboardList, Shield };

interface Props {
  title:       string;
  href:        string;
  iconName:    keyof typeof iconMap;
  score:       number;
  status:      "ok" | "warning" | "critical";
  metric:      string;
  metricLabel: string;
  alertCount?: number;
  index:       number;
}

const statusConfig = {
  ok:       { color: "#10B981", bg: "#F0FDF4", border: "#BBF7D0" },
  warning:  { color: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A" },
  critical: { color: "#EF4444", bg: "#FEF2F2", border: "#FECACA" },
};

export default function ModuleCard({
  title, href, iconName, score, status, metric, metricLabel, alertCount = 0, index,
}: Props) {
  const effectiveStatus = score === 0 ? "critical" : status;
  const cfg  = statusConfig[effectiveStatus];
  const Icon = iconMap[iconName];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      whileHover={{ y: -3 }}
    >
      <Link href={href}>
        <div className="card p-3.5 md:p-5 cursor-pointer hover:border-gray-300 hover:shadow-sm active:shadow-none transition-all duration-200 h-full">
          <div className="flex items-start justify-between mb-3 md:mb-4">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: cfg.bg, border: `1px solid ${cfg.border}` }}>
              <Icon className="w-4 h-4 md:w-5 md:h-5" style={{ color: cfg.color }} />
            </div>
            {alertCount > 0 && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 border border-red-100">
                <AlertTriangle className="w-3 h-3 text-red-500" />
                <span className="text-xs font-bold text-red-500">{alertCount}</span>
              </div>
            )}
          </div>

          <h3 className="text-xs md:text-sm font-semibold text-gray-700 mb-1">{title}</h3>
          <p className="text-xl md:text-2xl font-bold text-gray-800 mb-0.5 font-number">{metric}</p>
          <p className="text-[10px] md:text-xs text-gray-400 mb-3 md:mb-4">{metricLabel}</p>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">Performans</span>
              <span className="text-xs font-bold font-number" style={{ color: cfg.color }}>%{score}</span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-100">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: cfg.color }}
                initial={{ width: 0 }}
                animate={{ width: `${score}%` }}
                transition={{ duration: 0.8, delay: index * 0.06 + 0.3 }}
              />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
