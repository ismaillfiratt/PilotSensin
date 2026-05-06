"use client";

import { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { kategoriDagilimi, formatTL, type IslemTipi } from "@/lib/nakit-data";

const RENKLER_GELIR = ["#22c55e", "#4ade80", "#86efac", "#bbf7d0", "#dcfce7"];
const RENKLER_GIDER = ["#ef4444", "#f87171", "#fca5a5", "#fecaca", "#fee2e2", "#fbc024", "#fbbf24"];

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="glass-card rounded-xl p-3 text-xs">
      <p className="text-white font-semibold">{d.name}</p>
      <p style={{ color: d.payload.fill }} className="font-bold mt-0.5">{formatTL(d.value)}</p>
    </div>
  );
};

export default function KategoriGrafik() {
  const [tip, setTip] = useState<IslemTipi>("gider");
  const data = kategoriDagilimi(tip);
  const renkler = tip === "gelir" ? RENKLER_GELIR : RENKLER_GIDER;
  const toplam = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="glass-card rounded-2xl p-5 w-full lg:w-72 shrink-0">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-white">Kategoriler</h2>
        <div className="flex gap-1 p-1 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)]">
          {(["gelir", "gider"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setTip(v)}
              className="px-2.5 py-1 rounded-md text-xs font-medium transition-all"
              style={{
                backgroundColor: tip === v ? (v === "gelir" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)") : "transparent",
                color: tip === v ? (v === "gelir" ? "#22c55e" : "#ef4444") : "#94a3b8",
                border: tip === v ? `1px solid ${v === "gelir" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}` : "1px solid transparent",
              }}
            >
              {v === "gelir" ? "Gelir" : "Gider"}
            </button>
          ))}
        </div>
      </div>

      {/* Pasta grafik */}
      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={45}
            outerRadius={72}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={renkler[i % renkler.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Kategori listesi */}
      <div className="space-y-2 mt-2">
        {data.slice(0, 5).map(({ name, value }, i) => (
          <div key={name} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: renkler[i % renkler.length] }} />
            <span className="text-xs text-[#94a3b8] flex-1 truncate">{name}</span>
            <span className="text-xs text-white font-medium">{Math.round((value / toplam) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
