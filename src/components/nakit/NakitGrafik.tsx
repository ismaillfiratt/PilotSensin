"use client";

import { useState } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { haftalikOzet, formatTL } from "@/lib/nakit-data";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card rounded-xl p-3 text-xs space-y-1.5 min-w-[160px]">
      <p className="text-[#94a3b8] font-semibold mb-2">{label}. Hafta</p>
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
  const [aktif, setAktif] = useState<"haftalik" | "aylik">("haftalik");
  const data = haftalikOzet();

  return (
    <div className="glass-card rounded-2xl p-5 flex-1">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-white">Nakit Akışı</h2>
        <div className="flex gap-1 p-1 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)]">
          {(["haftalik", "aylik"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setAktif(v)}
              className="px-3 py-1 rounded-md text-xs font-medium transition-all"
              style={{
                backgroundColor: aktif === v ? "rgba(251,192,36,0.15)" : "transparent",
                color: aktif === v ? "#fbc024" : "#94a3b8",
                border: aktif === v ? "1px solid rgba(251,192,36,0.3)" : "1px solid transparent",
              }}
            >
              {v === "haftalik" ? "Haftalık" : "Aylık"}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="hafta"
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
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
            formatter={(v) =>
              v === "gelir" ? "Gelir" : v === "gider" ? "Gider" : "Net Akış"
            }
          />
          <Bar dataKey="gelir" fill="rgba(34,197,94,0.7)" radius={[4, 4, 0, 0]} maxBarSize={32} />
          <Bar dataKey="gider" fill="rgba(239,68,68,0.6)" radius={[4, 4, 0, 0]} maxBarSize={32} />
          <Line
            type="monotone"
            dataKey="net"
            stroke="#fbc024"
            strokeWidth={2}
            dot={{ fill: "#fbc024", r: 3 }}
            activeDot={{ r: 5 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
