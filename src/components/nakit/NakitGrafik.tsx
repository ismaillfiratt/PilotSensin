"use client";

import { useState } from "react";
import {
  ComposedChart, AreaChart, Bar, Line, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { BarChart2, TrendingUp, CalendarRange, X } from "lucide-react";
import { saatlikOzet, haftalikOzet, aylikOzet, ozelAralikOzet, formatTL } from "@/lib/nakit-data";
import type { Kurus } from "@/lib/para";
import { useNakit } from "@/store/nakit";

type Periyot  = "gunluk" | "haftalik" | "aylik" | "ozel";
type GrafikTip = "bar" | "cizgi";

const PERIYOTLAR: { key: Periyot; label: string }[] = [
  { key: "gunluk",  label: "Günlük"   },
  { key: "haftalik", label: "Haftalık" },
  { key: "aylik",   label: "Aylık"    },
  { key: "ozel",    label: "Özel"     },
];

function bugunIso()       { return new Date().toISOString().split("T")[0]; }
function otuzGunOnceIso() { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split("T")[0]; }

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card rounded-xl p-3 text-xs space-y-1.5 min-w-40">
      <p className="text-gray-400 font-semibold mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex justify-between gap-4">
          <span style={{ color: p.fill ?? p.stroke }}>{p.name}</span>
          <span className="text-gray-800 font-bold">{formatTL(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export default function NakitGrafik() {
  const { islemler }                = useNakit();
  const [periyot,   setPeriyot]   = useState<Periyot>("haftalik");
  const [grafikTip, setGrafikTip] = useState<GrafikTip>("bar");
  const [baslangic, setBaslangic] = useState(otuzGunOnceIso());
  const [bitis,     setBitis]     = useState(bugunIso());

  const data =
    periyot === "gunluk"   ? saatlikOzet(islemler)  :
    periyot === "haftalik" ? haftalikOzet(islemler) :
    periyot === "aylik"    ? aylikOzet(islemler)    :
    ozelAralikOzet(baslangic, bitis, islemler);

  const gunSayisi     = data.length;
  const tickFontSize  = gunSayisi > 20 ? 8 : gunSayisi > 10 ? 9 : 11;
  const tickInterval  = gunSayisi > 20 ? 4 : gunSayisi > 10 ? 2 : 0;
  const maxBarSize    = gunSayisi > 20 ? 10 : gunSayisi > 10 ? 14 : 28;
  const dotR          = gunSayisi > 20 ? 1  : 3;

  const legendFormatter = (v: string) =>
    v === "gelir" ? "Gelir" : v === "gider" ? "Gider" : "Net Akış";

  return (
    <div className="card rounded-2xl p-5 flex-1">
      {/* Başlık + kontroller */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-sm font-semibold text-gray-800">Nakit Akışı</h2>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Grafik tipi */}
          <div className="flex gap-1 p-1 rounded-lg bg-gray-50 border border-gray-200">
            <button
              onClick={() => setGrafikTip("bar")}
              title="Bar Grafik"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all"
              style={{
                backgroundColor: grafikTip === "bar" ? "var(--mint)" : "transparent",
                color:           grafikTip === "bar" ? "var(--leaf)" : "#94a3b8",
                border:          grafikTip === "bar" ? "1px solid var(--forest-200, #B3E8C8)" : "1px solid transparent",
              }}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              Bar
            </button>
            <button
              onClick={() => setGrafikTip("cizgi")}
              title="Çizgi Grafik"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all"
              style={{
                backgroundColor: grafikTip === "cizgi" ? "var(--mint)" : "transparent",
                color:           grafikTip === "cizgi" ? "var(--leaf)" : "#94a3b8",
                border:          grafikTip === "cizgi" ? "1px solid var(--forest-200, #B3E8C8)" : "1px solid transparent",
              }}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Çizgi
            </button>
          </div>

          {/* Periyot */}
          <div className="flex gap-1 p-1 rounded-lg bg-gray-50 border border-gray-200">
            {PERIYOTLAR.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setPeriyot(key)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all"
                style={{
                  backgroundColor: periyot === key ? "var(--mint)" : "transparent",
                  color:           periyot === key ? "var(--leaf)" : "#94a3b8",
                  border:          periyot === key ? "1px solid var(--forest-200, #B3E8C8)" : "1px solid transparent",
                }}
              >
                {key === "ozel" && <CalendarRange className="w-3 h-3" />}
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Özel tarih aralığı */}
      {periyot === "ozel" && (
        <div className="flex flex-wrap items-center gap-3 mb-4 p-3 rounded-xl border border-[var(--forest-100, #D9F2E4)] bg-[var(--mint)]">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400 font-medium">Başlangıç</label>
            <input
              type="date" value={baslangic} max={bitis}
              onChange={(e) => setBaslangic(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs text-gray-800 border border-gray-200 bg-gray-50 focus:outline-none focus:border-[var(--leaf)] transition-colors"
            />
          </div>
          <span className="text-gray-400 text-xs">—</span>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400 font-medium">Bitiş</label>
            <input
              type="date" value={bitis} min={baslangic} max={bugunIso()}
              onChange={(e) => setBitis(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs text-gray-800 border border-gray-200 bg-gray-50 focus:outline-none focus:border-[var(--leaf)] transition-colors"
            />
          </div>
          <div className="flex gap-1.5 ml-auto">
            {[
              { label: "7G",   gun: 7  },
              { label: "30G",  gun: 30 },
              { label: "Bu Ay", gun: -1 },
            ].map(({ label, gun }) => (
              <button key={label}
                onClick={() => {
                  const bit = bugunIso();
                  const d = new Date();
                  if (gun === -1) d.setDate(1); else d.setDate(d.getDate() - gun);
                  setBaslangic(d.toISOString().split("T")[0]);
                  setBitis(bit);
                }}
                className="px-2 py-1 rounded-lg text-[11px] font-medium border border-[var(--forest-200, #B3E8C8)] text-[var(--leaf)] hover:bg-[var(--mint)] transition-colors"
              >
                {label}
              </button>
            ))}
            <button
              onClick={() => setPeriyot("haftalik")}
              className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-800 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Grafik */}
      <div className="h-[220px] md:h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        {grafikTip === "bar" ? (
          <ComposedChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="etiket" tick={{ fill: "#94a3b8", fontSize: tickFontSize }} axisLine={false} tickLine={false} interval={tickInterval} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₺${(v / 100000).toFixed(0)}K`} width={44} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
            <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8", paddingTop: 10 }} formatter={legendFormatter} />
            <Bar dataKey="gelir" name="Gelir" fill="rgba(34,197,94,0.75)"  radius={[4,4,0,0]} maxBarSize={maxBarSize} />
            <Bar dataKey="gider" name="Gider" fill="rgba(239,68,68,0.65)"  radius={[4,4,0,0]} maxBarSize={maxBarSize} />
            <Line type="monotone" dataKey="net" name="Net Akış" stroke="var(--leaf)" strokeWidth={2} dot={{ fill: "var(--leaf)", r: dotR }} activeDot={{ r: 5 }} />
          </ComposedChart>
        ) : (
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gelirGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="giderGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="var(--leaf)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="var(--leaf)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="etiket" tick={{ fill: "#94a3b8", fontSize: tickFontSize }} axisLine={false} tickLine={false} interval={tickInterval} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₺${(v / 100000).toFixed(0)}K`} width={44} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8", paddingTop: 10 }} formatter={legendFormatter} />
            <Area type="monotone" dataKey="gelir" name="Gelir" stroke="#22c55e" strokeWidth={2} fill="url(#gelirGrad)" dot={false} activeDot={{ r: 4 }} />
            <Area type="monotone" dataKey="gider" name="Gider" stroke="#ef4444" strokeWidth={2} fill="url(#giderGrad)" dot={false} activeDot={{ r: 4 }} />
            <Area type="monotone" dataKey="net"   name="Net Akış" stroke="var(--leaf)" strokeWidth={2.5} fill="url(#netGrad)" dot={false} activeDot={{ r: 5 }} />
          </AreaChart>
        )}
      </ResponsiveContainer>
      </div>
    </div>
  );
}
