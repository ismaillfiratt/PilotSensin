"use client";

import { motion } from "framer-motion";
import { formatTL, type FonAyar } from "@/lib/acil-fon-data";

interface Props {
  mevcut: number;
  ayar: FonAyar;
}

export default function FonGauge({ mevcut, ayar }: Props) {
  const oran      = Math.min(mevcut / ayar.hedef, 1);
  const yuzde     = Math.round(oran * 100);
  const kalan     = Math.max(ayar.hedef - mevcut, 0);
  const renk      = yuzde >= 75 ? "#22c55e" : yuzde >= 50 ? "#fbc024" : "#ef4444";
  const durum     = yuzde >= 75 ? "İyi Durumda" : yuzde >= 50 ? "Gelişiyor" : "Kritik";

  // SVG arc hesabı (yarım daire: -180° → 0°)
  const radius = 80;
  const stroke = 12;
  const cx = 100;
  const cy = 100;
  const totalAngle = 180; // yarım daire
  const startAngle = 180;
  const endAngle   = 180 - totalAngle * oran;

  function polar(angle: number, r: number) {
    const rad = (angle * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
  }

  function arcPath(from: number, to: number, r: number) {
    const s = polar(from, r);
    const e = polar(to, r);
    const large = Math.abs(from - to) > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
  }

  return (
    <div className="glass-card rounded-2xl p-6 flex flex-col items-center">
      <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-widest mb-4">
        Acil Durum Fonu
      </h2>

      {/* Yarım daire gauge */}
      <div className="relative w-52 h-28 mb-2">
        <svg viewBox="0 40 200 110" className="w-full h-full overflow-visible">
          {/* Track */}
          <path
            d={arcPath(180, 0, radius)}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          {/* Fill */}
          <motion.path
            d={arcPath(180, endAngle, radius)}
            fill="none"
            stroke={renk}
            strokeWidth={stroke}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.4, ease: "easeOut" }}
            style={{ filter: `drop-shadow(0 0 6px ${renk}60)` }}
          />
          {/* Eşik çizgisi %50 */}
          {(() => {
            const p = polar(90, radius);
            return <circle cx={p.x} cy={p.y} r={4} fill="#fbc024" opacity={0.6} />;
          })()}
          {/* Eşik çizgisi %75 */}
          {(() => {
            const p = polar(45, radius);
            return <circle cx={p.x} cy={p.y} r={4} fill="#22c55e" opacity={0.6} />;
          })()}
        </svg>

        {/* Merkez sayı */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <motion.span
            className="text-4xl font-black"
            style={{ color: renk }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            %{yuzde}
          </motion.span>
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full mt-1"
            style={{ color: renk, backgroundColor: `${renk}18` }}
          >
            {durum}
          </span>
        </div>
      </div>

      {/* Sayılar */}
      <div className="w-full grid grid-cols-2 gap-3 mt-4">
        {[
          { label: "Mevcut Birikim",  value: formatTL(mevcut),       color: renk       },
          { label: "Hedef",           value: formatTL(ayar.hedef),    color: "#94a3b8"  },
          { label: "Kalan",           value: formatTL(kalan),         color: kalan > 0 ? "#fbc024" : "#22c55e" },
          { label: "Aylık Hedef",     value: formatTL(ayar.aylikHedef), color: "#94a3b8" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-[rgba(255,255,255,0.04)] rounded-xl p-3">
            <p className="text-[10px] text-[#94a3b8] mb-1">{label}</p>
            <p className="text-base font-bold" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
