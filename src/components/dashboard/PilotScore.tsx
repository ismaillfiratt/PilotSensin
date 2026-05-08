"use client";

import { motion } from "framer-motion";

interface ZayifModul { title: string; score: number; }

interface Props {
  score: number;
  enZayif?: ZayifModul[];
}

export default function PilotScore({ score, enZayif }: Props) {
  const radius       = 54;
  const circumference = 2 * Math.PI * radius;
  const dashOffset   = circumference - (score / 100) * circumference;

  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#fbc024" : "#ef4444";
  const label = score >= 80 ? "Mükemmel"  : score >= 60 ? "Dikkat"   : "Kritik";

  const zayiflar = enZayif ?? [
    { title: "Acil Durum Fonu", score: 35 },
    { title: "Nakit Akışı",     score: 52 },
    { title: "Stok Yönetimi",   score: 61 },
  ];

  return (
    <div className="glass-card rounded-2xl p-6 flex flex-col items-center gap-4 h-full">
      <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-widest">
        Pilot Skoru
      </h2>

      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
          <motion.circle
            cx="60" cy="60" r={radius} fill="none"
            stroke={color} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-3xl font-bold"
            style={{ color }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            %{score}
          </motion.span>
        </div>
      </div>

      <div className="px-3 py-1 rounded-full text-xs font-bold border" style={{ color, borderColor: color, backgroundColor: `${color}15` }}>
        {label}
      </div>

      <div className="w-full space-y-2 mt-2">
        <p className="text-xs text-[#94a3b8] text-center font-medium">En zayıf alanlar</p>
        {zayiflar.map(({ title, score: s }) => (
          <div key={title} className="flex items-center gap-2">
            <span className="text-xs text-[#94a3b8] w-32 truncate">{title}</span>
            <div className="flex-1 h-1.5 rounded-full bg-[rgba(255,255,255,0.05)]">
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${s}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                style={{ backgroundColor: s >= 80 ? "#22c55e" : s >= 60 ? "#fbc024" : "#ef4444" }}
              />
            </div>
            <span className="text-xs text-[#94a3b8] w-8 text-right">%{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
