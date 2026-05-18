"use client";

import { useMemo } from "react";
import { useMobil } from "@/lib/mobil";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { useSatislar, type SatisKaydi } from "@/store/satislar";

const tl = (n: number) =>
  (n / 100).toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ payload: { toplamCiroKurus: number; toplamKar: number; marj: number; color: string } }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="glass-card rounded-xl p-3 text-xs space-y-1 min-w-[170px]">
      <p className="text-white font-semibold mb-1.5">{label}</p>
      <div className="flex justify-between gap-4"><span className="text-[#94a3b8]">Toplam ciro</span><span className="text-white font-bold">{tl(d.toplamCiroKurus)}</span></div>
      <div className="flex justify-between gap-4"><span className="text-[#94a3b8]">Brüt kâr</span><span className="font-bold" style={{ color: d.color }}>{tl(d.toplamKar)}</span></div>
      <div className="flex justify-between gap-4"><span className="text-[#94a3b8]">Marj</span><span className="font-bold" style={{ color: d.color }}>%{d.marj.toFixed(1)}</span></div>
    </div>
  );
};

function urunMarjVerisi(kayitlar: SatisKaydi[]) {
  const map: Record<string, { name: string; toplamCiroKurus: number; toplamKar: number }> = {};
  for (const k of kayitlar) {
    if (k.iadeEdildi) continue;
    const key = k.urunAd;
    if (!map[key]) map[key] = { name: key, toplamCiroKurus: 0, toplamKar: 0 };
    map[key].toplamCiroKurus += k.toplamCiroKurus;
    map[key].toplamKar  += k.brutKarKurus;
  }
  return Object.values(map).map((u) => {
    const marj  = u.toplamCiroKurus > 0 ? (u.toplamKar / u.toplamCiroKurus) * 100 : 0;
    const color = marj >= 30 ? "#22c55e" : marj >= 15 ? "#fbc024" : "#ef4444";
    return { ...u, marj, color };
  }).sort((a, b) => b.marj - a.marj).slice(0, 12);
}

export default function MarjGrafik() {
  const { kayitlar } = useSatislar();
  const mobil = useMobil();
  const tumData = useMemo(() => urunMarjVerisi(kayitlar), [kayitlar]);
  const data = mobil ? tumData.slice(0, 8) : tumData;

  if (data.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-5 flex-1 flex items-center justify-center">
        <p className="text-sm text-[#64748b]">Satış kaydı girildiğinde grafik oluşur</p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-5 flex-1">
      <div className="mb-5">
        <h2 className="text-sm font-semibold text-white">Ürün Bazlı Kâr Marjı</h2>
        <p className="text-xs text-[#94a3b8] mt-0.5">
          Gerçek satış verisi · {data.length} ürün
          &nbsp;·&nbsp;
          <span className="text-[#22c55e]">■</span> ≥%30 &nbsp;
          <span className="text-[#fbc024]">■</span> %15–30 &nbsp;
          <span className="text-[#ef4444]">■</span> &lt;%15
        </p>
      </div>
      <div style={{ height: Math.max(mobil ? 180 : 200, data.length * (mobil ? 28 : 30)) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: "#94a3b8", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `%${v.toFixed(0)}`}
            domain={[0, 60]}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: "#94a3b8", fontSize: mobil ? 10 : 11 }}
            axisLine={false}
            tickLine={false}
            width={mobil ? 72 : 90}
            tickFormatter={(v: string) => mobil && v.length > 10 ? v.slice(0, 10) + "…" : v}
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
    </div>
  );
}
