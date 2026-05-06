"use client";

import {
  ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { aylikGrafik, formatTL, type FonIslem, type FonAyar } from "@/lib/acil-fon-data";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card rounded-xl p-3 text-xs space-y-1.5 min-w-[160px]">
      <p className="text-[#94a3b8] font-semibold mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex justify-between gap-4">
          <span style={{ color: p.color }}>
            {p.dataKey === "yatirma" ? "Yatırma" : p.dataKey === "cekme" ? "Çekme" : "Toplam Bakiye"}
          </span>
          <span className="text-white font-bold">{formatTL(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export default function FonGrafik({ islemler, ayar }: { islemler: FonIslem[]; ayar: FonAyar }) {
  const data = aylikGrafik(islemler);

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="mb-5">
        <h2 className="text-sm font-semibold text-white">Birikim Geçmişi</h2>
        <p className="text-xs text-[#94a3b8] mt-0.5">Son 6 aylık hareket ve toplam bakiye</p>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="ay" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false}
            tickFormatter={(v) => `₺${(v / 1000).toFixed(0)}K`} width={44} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
          <ReferenceLine
            y={ayar.aylikHedef}
            stroke="rgba(251,192,36,0.4)"
            strokeDasharray="4 4"
            label={{ value: "Aylık hedef", fill: "#fbc024", fontSize: 10, position: "right" }}
          />
          <Bar dataKey="yatirma" fill="rgba(34,197,94,0.7)"  radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Bar dataKey="cekme"   fill="rgba(239,68,68,0.6)"  radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Line type="monotone" dataKey="bakiye" stroke="#fbc024" strokeWidth={2}
            dot={{ fill: "#fbc024", r: 3 }} activeDot={{ r: 5 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
