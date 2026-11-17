"use client";

import { motion } from "framer-motion";
import { formatTL } from "@/lib/acil-fon-data";

interface Props {
  ad:               string;
  mevcut:           number;
  toplamHedefKurus: number;
  aylikOdemeKurus:  number;
}

export default function FonGauge({ ad, mevcut, toplamHedefKurus, aylikOdemeKurus }: Props) {
  const hedef  = toplamHedefKurus > 0 ? toplamHedefKurus : 1;
  const oran   = Math.min(mevcut / hedef, 1);
  const yuzde  = Math.round(oran * 100);
  const kalan  = Math.max(toplamHedefKurus - mevcut, 0);
  const renk   = yuzde >= 75 ? "#22c55e" : yuzde >= 50 ? "#F59E0B" : "#ef4444";
  const durum  = yuzde >= 75 ? "İyi Durumda" : yuzde >= 50 ? "Gelişiyor" : toplamHedefKurus === 0 ? "Hedef Yok" : "Kritik";

  const R    = 42;
  const circ = 2 * Math.PI * R;
  const off  = circ - oran * circ;

  const stats = [
    { label: "Mevcut Birikim", value: formatTL(mevcut),                                    color: renk      },
    { label: "Toplam Hedef",   value: toplamHedefKurus > 0 ? formatTL(toplamHedefKurus) : "—", color: "#94a3b8" },
    { label: "Kalan",          value: toplamHedefKurus > 0 ? formatTL(kalan) : "—",           color: kalan > 0 ? "#64748b" : "#22c55e" },
    { label: "Aylık Ödeme",    value: aylikOdemeKurus > 0 ? formatTL(aylikOdemeKurus) : "—",  color: "#94a3b8" },
  ];

  return (
    <div className="card rounded-2xl p-6 flex flex-col items-center" style={{ border: "0.5px solid rgba(0,0,0,0.08)" }}>
      {/* Başlık */}
      <p className="label-caps mb-0.5">ACİL DURUM FONU</p>
      <p className="text-sm font-medium text-gray-700 mb-4 truncate max-w-full text-center">{ad}</p>

      {/* Tam daire ring */}
      <div className="relative w-28 h-28 mb-3">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={R} fill="none" stroke="#F3F4F6" strokeWidth="6" />
          <motion.circle
            cx="50" cy="50" r={R} fill="none"
            stroke={renk} strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: off }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-number font-semibold text-xl" style={{ color: renk }}>%{yuzde}</span>
        </div>
      </div>

      {/* Durum rozeti */}
      <span className="text-[11px] font-medium px-2.5 py-1 rounded-full mb-5"
        style={{ color: renk, backgroundColor: `${renk}15`, border: `1px solid ${renk}25` }}>
        {durum}
      </span>

      {/* 4 stat — dikey yığın */}
      <div className="w-full divide-y divide-gray-100">
        {stats.map(({ label, value, color }) => (
          <div key={label} className="flex items-center justify-between py-2.5">
            <span className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">{label}</span>
            <span className="font-number font-semibold tabular-nums text-sm" style={{ color }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
