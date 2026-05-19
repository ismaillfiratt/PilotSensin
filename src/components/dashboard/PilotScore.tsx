"use client";

import { motion } from "framer-motion";

interface ZayifModul { title: string; score: number; }

interface Props {
  score:     number;
  enZayif?: ZayifModul[];
}

function skorRengi(s: number) {
  if (s >= 80) return "#10B981";
  if (s >= 60) return "#F59E0B";
  return "#EF4444";
}

function skorEtiketi(s: number) {
  if (s >= 80) return "Mükemmel";
  if (s >= 60) return "Dikkat";
  return "Kritik";
}

export default function PilotScore({ score, enZayif }: Props) {
  const radius       = 54;
  const circumference = 2 * Math.PI * radius;
  const dashOffset   = circumference - (score / 100) * circumference;

  const color = skorRengi(score);
  const label = skorEtiketi(score);

  const zayiflar = enZayif ?? [
    { title: "Acil Durum Fonu", score: 35 },
    { title: "Nakit Akışı",     score: 52 },
    { title: "Stok Yönetimi",   score: 61 },
  ];

  return (
    <div className="card p-6 flex flex-col items-center gap-4 h-full">
      <p className="section-label">Pilot Skoru</p>

      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="#F1F5F9" strokeWidth="8" />
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
            className="text-3xl font-bold font-number"
            style={{ color }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            %{score}
          </motion.span>
        </div>
      </div>

      <div className="px-3 py-1 rounded-full text-xs font-semibold border"
        style={{ color, borderColor: `${color}50`, backgroundColor: `${color}12` }}>
        {label}
      </div>

      <div className="w-full space-y-2 mt-1">
        <p className="text-xs text-gray-400 text-center font-medium">En zayıf alanlar</p>
        {zayiflar.map(({ title, score: s }) => (
          <div key={title} className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-32 truncate">{title}</span>
            <div className="flex-1 h-1.5 rounded-full bg-gray-100">
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${s}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                style={{ backgroundColor: skorRengi(s) }}
              />
            </div>
            <span className="text-xs text-gray-400 w-8 text-right font-number">%{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
