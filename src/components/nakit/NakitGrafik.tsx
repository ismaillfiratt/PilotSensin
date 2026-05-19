"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ComposedChart, AreaChart, Bar, Line, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { BarChart2, TrendingUp, CalendarRange, X } from "lucide-react";
import { saatlikOzet, haftalikOzet, aylikOzet, ozelAralikOzet } from "@/lib/nakit-data";
import { formatTL } from "@/lib/para";
import { useNakit } from "@/store/nakit";

type Periyot   = "gunluk" | "haftalik" | "aylik" | "ozel";
type GrafikTip = "bar" | "cizgi";

const PERIYOTLAR: { key: Periyot; label: string }[] = [
  { key: "gunluk",  label: "Günlük"   },
  { key: "haftalik", label: "Haftalık" },
  { key: "aylik",   label: "Aylık"    },
  { key: "ozel",    label: "Özel"     },
];

function bugunIso()       { return new Date().toISOString().split("T")[0]; }
function otuzGunOnceIso() { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split("T")[0]; }

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; fill?: string; stroke?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 text-xs space-y-1.5 shadow-lg min-w-40">
      <p className="font-medium mb-2" style={{ color: "var(--text-secondary)" }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex justify-between gap-4">
          <span style={{ color: p.fill ?? p.stroke }}>{p.name}</span>
          <span className="font-number font-bold text-[#0F172A]">
            {typeof p.value === "number" ? formatTL(p.value) : "—"}
          </span>
        </div>
      ))}
    </div>
  );
}

const chipStyle = (aktif: boolean) => ({
  backgroundColor: aktif ? "#0F3D2E" : "transparent",
  color:           aktif ? "#FFFFFF" : "#94a3b8",
  border:          aktif ? "1px solid #0F3D2E" : "1px solid transparent",
});

export default function NakitGrafik() {
  const { islemler }              = useNakit();
  const [periyot,   setPeriyot]   = useState<Periyot>("haftalik");
  const [grafikTip, setGrafikTip] = useState<GrafikTip>("bar");
  const [baslangic, setBaslangic] = useState(otuzGunOnceIso());
  const [bitis,     setBitis]     = useState(bugunIso());
  const [mounted,   setMounted]   = useState(false);

  useEffect(() => setMounted(true), []);

  /* Veriyi hesapla — OzetSatir'dan grafik-uyumlu shape'e dönüştür */
  const data = useMemo(() => {
    const ozet =
      periyot === "gunluk"   ? saatlikOzet(islemler) :
      periyot === "haftalik" ? haftalikOzet(islemler) :
      periyot === "aylik"    ? aylikOzet(islemler) :
      ozelAralikOzet(baslangic, bitis, islemler);

    return ozet.map((s) => ({
      etiket: s.etiket,
      gelir:  s.gelirKurus,   // kuruş — formatTL ile gösterilecek
      gider:  s.giderKurus,
      net:    s.netKurus,
    }));
  }, [islemler, periyot, baslangic, bitis]);

  const gunSayisi    = data.length;
  const tickFont     = gunSayisi > 20 ? 8 : gunSayisi > 10 ? 9 : 11;
  const tickInterval = gunSayisi > 20 ? 4 : gunSayisi > 10 ? 2 : 0;
  const maxBarSize   = gunSayisi > 20 ? 10 : gunSayisi > 10 ? 14 : 28;
  const dotR         = gunSayisi > 20 ? 1  : 3;

  const legendFmt = (v: string) =>
    v === "gelir" ? "Gelir" : v === "gider" ? "Gider" : "Net Akış";

  const grid = <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />;
  const xAxis = <XAxis dataKey="etiket" tick={{ fill: "#94a3b8", fontSize: tickFont }} axisLine={false} tickLine={false} interval={tickInterval} />;
  const yAxis = <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 100000).toFixed(0)}K`} width={44} />;
  const tooltip = <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.02)" }} />;
  const legend = <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8", paddingTop: 10 }} formatter={legendFmt} />;

  return (
    <div className="card rounded-2xl p-5 flex-1">
      {/* Başlık + kontroller */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-sm font-semibold">Nakit Akışı</h2>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Grafik tipi */}
          <div className="flex gap-1 p-1 rounded-lg bg-gray-50 border border-gray-200">
            <button onClick={() => setGrafikTip("bar")} title="Bar"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all"
              style={chipStyle(grafikTip === "bar")}>
              <BarChart2 className="w-3.5 h-3.5" />Bar
            </button>
            <button onClick={() => setGrafikTip("cizgi")} title="Çizgi"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all"
              style={chipStyle(grafikTip === "cizgi")}>
              <TrendingUp className="w-3.5 h-3.5" />Çizgi
            </button>
          </div>

          {/* Periyot */}
          <div className="flex gap-1 p-1 rounded-lg bg-gray-50 border border-gray-200">
            {PERIYOTLAR.map(({ key, label }) => (
              <button key={key} onClick={() => setPeriyot(key)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all"
                style={chipStyle(periyot === key)}>
                {key === "ozel" && <CalendarRange className="w-3 h-3" />}
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Özel tarih aralığı */}
      {periyot === "ozel" && (
        <div className="flex flex-wrap items-center gap-3 mb-4 p-3 rounded-xl border border-black/8 bg-gray-50">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Başlangıç</label>
            <input type="date" value={baslangic} max={bitis}
              onChange={(e) => setBaslangic(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs text-gray-800 border border-gray-200 bg-white focus:outline-none" />
          </div>
          <span style={{ color: "var(--text-secondary)" }}>—</span>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Bitiş</label>
            <input type="date" value={bitis} min={baslangic} max={bugunIso()}
              onChange={(e) => setBitis(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs text-gray-800 border border-gray-200 bg-white focus:outline-none" />
          </div>
          <div className="flex gap-1.5 ml-auto">
            {[
              { label: "7G",    fn: () => { const d = new Date(); d.setDate(d.getDate() - 7);  setBaslangic(d.toISOString().split("T")[0]); setBitis(bugunIso()); } },
              { label: "30G",   fn: () => { const d = new Date(); d.setDate(d.getDate() - 30); setBaslangic(d.toISOString().split("T")[0]); setBitis(bugunIso()); } },
              { label: "Bu Ay", fn: () => { const d = new Date(); d.setDate(1);                setBaslangic(d.toISOString().split("T")[0]); setBitis(bugunIso()); } },
            ].map(({ label, fn }) => (
              <button key={label} onClick={fn}
                className="px-2 py-1 rounded-lg text-[11px] font-medium border border-black/10 hover:bg-[#F3F4F6] transition-colors"
                style={{ color: "var(--text-secondary)" }}>
                {label}
              </button>
            ))}
            <button onClick={() => setPeriyot("haftalik")}
              className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-400 hover:bg-[#F3F4F6] transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Grafik */}
      <div className="h-[220px] md:h-[300px]">
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            {grafikTip === "bar" ? (
              <ComposedChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                {grid}{xAxis}{yAxis}{tooltip}{legend}
                <Bar dataKey="gelir" name="Gelir"    fill="rgba(45,154,92,0.70)"  radius={[4,4,0,0]} maxBarSize={maxBarSize} />
                <Bar dataKey="gider" name="Gider"    fill="rgba(201,118,118,0.70)" radius={[4,4,0,0]} maxBarSize={maxBarSize} />
                <Line type="monotone" dataKey="net" name="Net Akış"
                  stroke="var(--forest)" strokeWidth={2}
                  dot={{ fill: "var(--forest)", r: dotR }}
                  activeDot={{ r: 5 }} />
              </ComposedChart>
            ) : (
              <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gelirGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#2D9A5C" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2D9A5C" stopOpacity={0}   />
                  </linearGradient>
                  <linearGradient id="giderGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#C97676" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#C97676" stopOpacity={0}   />
                  </linearGradient>
                  <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="var(--forest)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="var(--forest)" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                {grid}{xAxis}{yAxis}{tooltip}{legend}
                <Area type="monotone" dataKey="gelir" name="Gelir"    stroke="#2D9A5C" strokeWidth={2} fill="url(#gelirGrad)" dot={false} activeDot={{ r: 4 }} />
                <Area type="monotone" dataKey="gider" name="Gider"    stroke="#C97676" strokeWidth={2} fill="url(#giderGrad)" dot={false} activeDot={{ r: 4 }} />
                <Area type="monotone" dataKey="net"   name="Net Akış" stroke="var(--forest)" strokeWidth={2.5} fill="url(#netGrad)" dot={false} activeDot={{ r: 5 }} />
              </AreaChart>
            )}
          </ResponsiveContainer>
        ) : (
          <div className="h-full rounded-lg bg-gray-50 animate-pulse" />
        )}
      </div>
    </div>
  );
}
