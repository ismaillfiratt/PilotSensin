"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { karHesapla, formatTL, type Urun } from "@/lib/kar-zarar-data";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="glass-card rounded-xl p-3 text-xs space-y-1 min-w-[170px]">
      <p className="text-white font-semibold mb-1.5">{label}</p>
      <div className="flex justify-between gap-4"><span className="text-[#94a3b8]">Aylık ciro</span><span className="text-white font-bold">{formatTL(d.toplamGelir)}</span></div>
      <div className="flex justify-between gap-4"><span className="text-[#94a3b8]">Aylık kar</span><span className="font-bold" style={{ color: d.color }}>{formatTL(d.toplamKar)}</span></div>
      <div className="flex justify-between gap-4"><span className="text-[#94a3b8]">Marj</span><span className="font-bold" style={{ color: d.color }}>%{d.marj.toFixed(1)}</span></div>
    </div>
  );
};

export default function MarjGrafik({ urunler }: { urunler: Urun[] }) {
  const data = urunler
    .map((u) => {
      const { toplamGelir, toplamKar, marjYuzde } = karHesapla(u);
      const color = marjYuzde >= 30 ? "#22c55e" : marjYuzde >= 15 ? "#fbc024" : "#ef4444";
      return { name: u.ad, toplamGelir, toplamKar, marj: marjYuzde, color };
    })
    .sort((a, b) => b.marj - a.marj);

  return (
    <div className="glass-card rounded-2xl p-5 flex-1">
      <div className="mb-5">
        <h2 className="text-sm font-semibold text-white">Ürün Bazlı Kar Marjı</h2>
        <p className="text-xs text-[#94a3b8] mt-0.5">
          <span className="text-[#22c55e]">■</span> ≥%30 &nbsp;
          <span className="text-[#fbc024]">■</span> %15–30 &nbsp;
          <span className="text-[#ef4444]">■</span> &lt;%15
        </p>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 24, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: "#94a3b8", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `%${v.toFixed(0)}`}
            domain={[0, 60]}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={80}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
          <Bar dataKey="marj" radius={[0, 4, 4, 0]} maxBarSize={18}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.color} fillOpacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
