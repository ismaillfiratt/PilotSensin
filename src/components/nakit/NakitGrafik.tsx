"use client";

import { useState } from "react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { saatlikOzet, haftalikOzet, aylikOzet, formatTL } from "@/lib/nakit-data";

type Periyot = "gunluk" | "haftalik" | "aylik";

const PERIYOTLAR: { key: Periyot; label: string }[] = [
  { key: "gunluk",  label: "Günlük"  },
  { key: "haftalik", label: "Haftalık" },
  { key: "aylik",   label: "Aylık"   },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card rounded-xl p-3 text-xs space-y-1.5 min-w-40">
      <p className="text-[#94a3b8] font-semibold mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex justify-between gap-4">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="text-white font-bold">{formatTL(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export default function NakitGrafik() {
  const [aktif, setAktif] = useState<Periyot>("haftalik");

  const data =
    aktif === "gunluk"  ? saatlikOzet()  :
    aktif === "haftalik" ? haftalikOzet() : aylikOzet();

  const tickFontSize  = aktif === "aylik" ? 8 : aktif === "gunluk" ? 9 : 11;
  const tickInterval  = aktif === "aylik" ? 4 : aktif === "gunluk" ? 3 : 0;
  const maxBarSize    = aktif === "aylik" ? 10 : aktif === "gunluk" ? 14 : 28;

  return (
    <div className="glass-card rounded-2xl p-5 flex-1">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-white">Nakit Akışı</h2>
        <div className="flex gap-1 p-1 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)]">
          {PERIYOTLAR.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setAktif(key)}
              className="px-3 py-1 rounded-md text-xs font-medium transition-all"
              style={{
                backgroundColor: aktif === key ? "rgba(251,192,36,0.15)" : "transparent",
                color:           aktif === key ? "#fbc024" : "#94a3b8",
                border:          aktif === key ? "1px solid rgba(251,192,36,0.3)" : "1px solid transparent",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="etiket"
            tick={{ fill: "#94a3b8", fontSize: tickFontSize }}
            axisLine={false}
            tickLine={false}
            interval={tickInterval}
          />
          <YAxis
            tick={{ fill: "#94a3b8", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `₺${(v / 1000).toFixed(0)}K`}
            width={44}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
          <Legend
            wrapperStyle={{ fontSize: 11, color: "#94a3b8", paddingTop: 12 }}
            formatter={(v) => v === "gelir" ? "Gelir" : v === "gider" ? "Gider" : "Net Akış"}
          />
          <Bar dataKey="gelir" fill="rgba(34,197,94,0.7)"  radius={[4,4,0,0]} maxBarSize={maxBarSize} />
          <Bar dataKey="gider" fill="rgba(239,68,68,0.6)"  radius={[4,4,0,0]} maxBarSize={maxBarSize} />
          <Line type="monotone" dataKey="net" stroke="#fbc024" strokeWidth={2}
            dot={{ fill: "#fbc024", r: aktif === "aylik" ? 1 : 3 }}
            activeDot={{ r: 5 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
