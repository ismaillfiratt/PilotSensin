"use client";

import { useState, useEffect, useMemo } from "react";
import { useMobil } from "@/lib/mobil";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { useSatislar, type SatisKaydi } from "@/store/satislar";

const tl = (n: number) =>
  (n / 100).toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });

/** Snapshot varsa birimBrutKarKurus × adet, yoksa brutKarKurus */
function kayitKar(k: SatisKaydi): number {
  return k.birimBrutKarKurus != null ? k.birimBrutKarKurus * k.adet : k.brutKarKurus;
}

/** Net satış tutarı (KDV hariç) */
function kayitNetCiro(k: SatisKaydi): number {
  return k.birimBrutKarKurus != null
    ? k.toplamCiroKurus - (k.kdvTutariKurus ?? 0)
    : k.toplamCiroKurus;
}

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ payload: { toplamCiroKurus: number; toplamKar: number; marj: number; color: string } }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-black/8 rounded-xl p-3 text-xs space-y-1 min-w-[170px] shadow-sm">
      <p className="text-[#0F172A] font-semibold mb-1.5">{label}</p>
      <div className="flex justify-between gap-4">
        <span className="text-gray-400">Toplam ciro</span>
        <span className="text-[#0F172A] font-bold">{tl(d.toplamCiroKurus)}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-gray-400">Brüt kâr</span>
        <span className="font-bold" style={{ color: d.color }}>{tl(d.toplamKar)}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-gray-400">Brüt marj</span>
        <span className="font-bold" style={{ color: d.color }}>%{d.marj.toFixed(1)}</span>
      </div>
    </div>
  );
};

function urunMarjVerisi(kayitlar: SatisKaydi[]) {
  const map: Record<string, { name: string; toplamCiroKurus: number; toplamNetCiro: number; toplamKar: number }> = {};
  for (const k of kayitlar) {
    if (k.iadeEdildi) continue;
    const key = k.urunAd;
    if (!map[key]) map[key] = { name: key, toplamCiroKurus: 0, toplamNetCiro: 0, toplamKar: 0 };
    map[key].toplamCiroKurus += k.toplamCiroKurus;
    map[key].toplamNetCiro   += kayitNetCiro(k);
    map[key].toplamKar       += kayitKar(k);
  }
  return Object.values(map).map((u) => {
    const marj  = u.toplamNetCiro > 0 ? (u.toplamKar / u.toplamNetCiro) * 100 : 0;
    const color = marj >= 30 ? "#10B981" : marj >= 15 ? "#F59E0B" : "#EF4444";
    return { ...u, marj, color };
  }).sort((a, b) => b.marj - a.marj).slice(0, 12);
}

export default function MarjGrafik() {
  const { kayitlar }          = useSatislar();
  const mobil                 = useMobil();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const tumData = useMemo(() => urunMarjVerisi(kayitlar), [kayitlar]);
  const data    = mobil ? tumData.slice(0, 8) : tumData;

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-black/8 bg-white p-5 flex-1 flex items-center justify-center min-h-[160px]">
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Satış kaydı girildiğinde grafik oluşur</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-black/8 bg-white p-5 flex-1">
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-[#0F172A]">Ürün Bazlı Brüt Kâr Marjı</h3>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
          Direct costs dahil · {data.length} ürün
          &nbsp;·&nbsp;
          <span className="text-[#10B981]">■</span> ≥%30 &nbsp;
          <span className="text-[#F59E0B]">■</span> %15–30 &nbsp;
          <span className="text-[#EF4444]">■</span> &lt;%15
        </p>
      </div>
      {mounted ? (
        <div style={{ height: Math.max(mobil ? 180 : 200, data.length * (mobil ? 28 : 30)) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" horizontal={false} />
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
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
              <Bar dataKey="marj" radius={[0, 4, 4, 0]} maxBarSize={18}>
                {data.map((d, i) => (
                  <Cell key={i} fill={d.color} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="rounded-lg bg-gray-50 animate-pulse"
          style={{ height: Math.max(mobil ? 180 : 200, data.length * (mobil ? 28 : 30)) }} />
      )}
    </div>
  );
}
