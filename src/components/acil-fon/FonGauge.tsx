"use client";

import { motion } from "framer-motion";
import { formatTL } from "@/lib/acil-fon-data";

interface Props {
  ad:           string;   // hedef adı veya "Tüm Hedefler"
  mevcut:       number;
  toplamHedef:  number;
  aylikOdeme:   number;
}

export default function FonGauge({ ad, mevcut, toplamHedef, aylikOdeme }: Props) {
  const hedef = toplamHedef > 0 ? toplamHedef : 1;
  const oran  = Math.min(mevcut / hedef, 1);
  const yuzde = Math.round(oran * 100);
  const kalan = Math.max(toplamHedef - mevcut, 0);
  const renk  = yuzde >= 75 ? "#22c55e" : yuzde >= 50 ? "#fbc024" : "#ef4444";
  const durum = yuzde >= 75 ? "İyi Durumda" : yuzde >= 50 ? "Gelişiyor" : toplamHedef === 0 ? "Hedef Yok" : "Kritik";

  const R = 78, SW = 12, CX = 100, CY = 100;
  const endAngle = 180 - 180 * oran;

  function polar(deg: number, r: number) {
    const rad = (deg * Math.PI) / 180;
    return { x: CX + r * Math.cos(rad), y: CY - r * Math.sin(rad) };
  }
  function arc(from: number, to: number, r: number) {
    const s = polar(from, r), e = polar(to, r);
    const large = Math.abs(from - to) > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
  }

  return (
    <div className="glass-card rounded-2xl p-6 flex flex-col items-center">
      <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-widest mb-1">Acil Durum Fonu</h2>
      <p className="text-xs text-white font-semibold mb-4 truncate max-w-full">{ad}</p>

      <svg viewBox="0 15 200 140" className="w-full" style={{ maxWidth: 220 }}>
        <path d={arc(180, 0, R)} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={SW} strokeLinecap="round" />
        <motion.path
          d={arc(180, endAngle, R)} fill="none"
          stroke={renk} strokeWidth={SW} strokeLinecap="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 1.4, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 6px ${renk}60)` }}
        />
        {(() => { const p = polar(90, R); return <circle cx={p.x} cy={p.y} r={4} fill="#fbc024" opacity={0.6} />; })()}
        {(() => { const p = polar(45, R); return <circle cx={p.x} cy={p.y} r={4} fill="#22c55e" opacity={0.6} />; })()}
        <motion.text x="100" y="112" textAnchor="middle" fill={renk} fontSize="30" fontWeight="900"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          %{yuzde}
        </motion.text>
        <rect x="62" y="118" width="76" height="20" rx="10" fill={`${renk}20`} />
        <text x="100" y="132" textAnchor="middle" fill={renk} fontSize="11" fontWeight="700">{durum}</text>
      </svg>

      <div className="w-full grid grid-cols-2 gap-3 mt-4">
        {[
          { label: "Mevcut Birikim", value: formatTL(mevcut),                                     color: renk         },
          { label: "Toplam Hedef",   value: toplamHedef > 0 ? formatTL(toplamHedef) : "—",         color: "#94a3b8"    },
          { label: "Kalan",          value: toplamHedef > 0 ? formatTL(kalan) : "—",               color: kalan > 0 ? "#fbc024" : "#22c55e" },
          { label: "Aylık Ödeme",    value: aylikOdeme > 0 ? formatTL(aylikOdeme) : "—",           color: "#94a3b8"    },
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
