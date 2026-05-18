"use client";

import { useMemo } from "react";
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer, Legend,
} from "recharts";
import { useNakit }             from "@/store/nakit";
import { useNakitAkis }         from "@/store/nakitAkis";
import { useIsletmeGiderleri }  from "@/store/isletmeGiderleri";
import { kasaBakiyesi, projeksiyon30Gun, kritikGunVarMi } from "@/lib/nakitAkis-engine";

const tl = (n: number) =>
  (n / 100).toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value?: number; dataKey?: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  const bakiye = payload.find((p) => p.dataKey === "bakiye")?.value ?? 0;
  const giren  = payload.find((p) => p.dataKey === "giren")?.value ?? 0;
  const cikan  = payload.find((p) => p.dataKey === "cikan")?.value ?? 0;
  const negatif = (bakiye as number) < 0;

  return (
    <div className="bg-[#0e172a] border border-[rgba(255,255,255,0.1)] rounded-xl p-3 text-xs space-y-1 shadow-xl">
      <p className="font-semibold text-[#94a3b8]">{label}</p>
      <p className={`font-bold text-sm ${negatif ? "text-[#ef4444]" : "text-white"}`}>
        Bakiye: {tl(bakiye as number)}
      </p>
      {(giren as number) > 0 && <p className="text-[#22c55e]">+{tl(giren as number)} Gelir</p>}
      {(cikan as number) > 0 && <p className="text-[#ef4444]">-{tl(cikan as number)} Gider</p>}
    </div>
  );
}

export default function NakitProjectionGrafik() {
  const { islemler }                 = useNakit();
  const { kalemler, tekrarlayanlar } = useNakitAkis();
  const { giderler }                 = useIsletmeGiderleri();

  const { data, kritik } = useMemo(() => {
    const kasa          = kasaBakiyesi(islemler);
    const aylikSabit    = giderler.reduce((t, g) => t + g.tutarKurus, 0);
    const proj          = projeksiyon30Gun(kasa, kalemler, tekrarlayanlar, aylikSabit);
    const kritik        = kritikGunVarMi(proj);
    return { data: proj, kritik };
  }, [islemler, kalemler, tekrarlayanlar, giderler]);

  const lineColor = kritik ? "#ef4444" : "#22c55e";

  const yMin = Math.min(...data.map((d) => d.bakiye));
  const yMax = Math.max(...data.map((d) => d.bakiye));
  const padding = Math.abs(yMax - yMin) * 0.15 || 1000;

  return (
    <div className="glass-card rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white">30 Günlük Nakit Projeksiyonu</h2>
          <p className="text-xs text-[#64748b] mt-0.5">Planlanan gelir ve giderler dahil tahmini bakiye</p>
        </div>
        {kritik && (
          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[rgba(239,68,68,0.12)] text-[#ef4444] border border-[rgba(239,68,68,0.25)] flex items-center gap-1.5">
            ⚠ Kritik Sıkışıklık Riski
          </span>
        )}
      </div>

      <div className="h-[220px] md:h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
          <defs>
            <linearGradient id="gradPos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="gradNeg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.05} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.35} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="etiket"
            tick={{ fontSize: 10, fill: "#64748b" }}
            tickLine={false}
            axisLine={false}
            interval={4}
          />
          <YAxis
            tickFormatter={(v) => `₺${(v / 100000).toFixed(0)}K`}
            tick={{ fontSize: 10, fill: "#64748b" }}
            tickLine={false}
            axisLine={false}
            domain={[yMin - padding, yMax + padding]}
            width={55}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Sıfır çizgisi */}
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 4" strokeWidth={1.5} />

          {/* Pozitif bakiye alanı (yeşil) */}
          <Area
            type="monotone"
            dataKey="bakiyePos"
            fill="url(#gradPos)"
            stroke="transparent"
            baseValue={0}
            isAnimationActive={false}
          />
          {/* Negatif bakiye alanı (kırmızı) */}
          <Area
            type="monotone"
            dataKey="bakiyeNeg"
            fill="url(#gradNeg)"
            stroke="transparent"
            baseValue={0}
            isAnimationActive={false}
          />
          {/* Bakiye çizgisi */}
          <Line
            type="monotone"
            dataKey="bakiye"
            stroke={lineColor}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, fill: lineColor, stroke: "#0e172a", strokeWidth: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
      </div>

      {/* Gün açıklaması */}
      <div className="flex items-center gap-4 text-xs text-[#475569]">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 rounded bg-[#22c55e]" />
          Pozitif bakiye
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 rounded bg-[#ef4444]" />
          Negatif bakiye
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 rounded bg-[rgba(255,255,255,0.2)]" style={{ border: "1px dashed rgba(255,255,255,0.2)" }} />
          Sıfır seviyesi
        </span>
      </div>
    </div>
  );
}
