"use client";

import { useMemo, useState, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer,
} from "recharts";
import { useNakit }             from "@/store/nakit";
import { useNakitAkis }         from "@/store/nakitAkis";
import { useIsletmeGiderleri }  from "@/store/isletmeGiderleri";
import { kasaBakiyesi, projeksiyon30Gun, kritikGunVarMi } from "@/lib/nakitAkis-engine";
import { formatTL } from "@/lib/para";
import { cn } from "@/lib/utils";

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value?: number; dataKey?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const bakiye = payload.find((p) => p.dataKey === "bakiye")?.value ?? 0;
  const negatif = (bakiye as number) < 0;
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 text-xs space-y-1 shadow-lg">
      <p className="font-medium" style={{ color: "var(--text-secondary)" }}>{label}</p>
      <p className={`font-number font-bold text-sm ${negatif ? "text-[#C97676]" : "text-[#0F172A]"}`}>
        {formatTL(bakiye as number)}
      </p>
    </div>
  );
}

export default function NakitProjectionGrafik() {
  const { islemler }                 = useNakit();
  const { kalemler, tekrarlayanlar } = useNakitAkis();
  const { giderler }                 = useIsletmeGiderleri();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { data, kritik, bugunBakiye, sonBakiye, enDusuk } = useMemo(() => {
    const kasa       = kasaBakiyesi(islemler);
    const aylikSabit = giderler.reduce((t, g) => t + g.tutarKurus, 0);
    const proj       = projeksiyon30Gun(kasa, kalemler, tekrarlayanlar, aylikSabit);
    const kritik     = kritikGunVarMi(proj);
    const bugun      = proj[0]?.bakiye ?? kasa;
    const son        = proj[proj.length - 1]?.bakiye ?? kasa;
    const enD        = proj.length ? proj.reduce((m, g) => g.bakiye < m.bakiye ? g : m) : null;
    return { data: proj, kritik, bugunBakiye: bugun, sonBakiye: son, enDusuk: enD };
  }, [islemler, kalemler, tekrarlayanlar, giderler]);

  const fark = sonBakiye - bugunBakiye;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
          Bugünkü kasa + planlanan + tekrarlayan
        </p>
        {kritik && (
          <span className="text-[10px] px-2.5 py-1 rounded-full font-medium bg-[#C97676]/10 text-[#C97676]">
            Kritik sıkışıklık riski
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-6">

        {/* Sol: line chart */}
        <div className="h-[220px]">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                <XAxis
                  dataKey="etiket"
                  tick={{ fontSize: 10, fill: "#94A3B8" }}
                  tickLine={false}
                  axisLine={false}
                  interval={4}
                />
                <YAxis
                  tickFormatter={(v) => `${(v / 100000).toFixed(0)}K`}
                  tick={{ fontSize: 10, fill: "#94A3B8" }}
                  tickLine={false}
                  axisLine={false}
                  width={45}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={0} stroke="#C97676" strokeDasharray="4 4" strokeWidth={1} />
                <Line
                  type="monotone"
                  dataKey="bakiye"
                  stroke={kritik ? "#C97676" : "var(--forest)"}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full rounded-lg bg-gray-50 animate-pulse" />
          )}
        </div>

        {/* Sağ: özet panel */}
        <div className="space-y-3">
          <div className="p-3 rounded-lg border border-black/8">
            <p className="label-caps mb-1">BUGÜN</p>
            <p className="font-number font-semibold text-lg text-[#0F172A]">
              {formatTL(bugunBakiye)}
            </p>
          </div>

          <div className="p-3 rounded-lg border border-black/8">
            <p className="label-caps mb-1">30 GÜN SONRA</p>
            <p className="font-number font-semibold text-lg text-[#0F172A]">
              {formatTL(sonBakiye)}
            </p>
            <p className={cn(
              "text-xs mt-1 font-number font-medium",
              fark >= 0 ? "text-emerald-600" : "text-[#C97676]"
            )}>
              {fark >= 0 ? "↑" : "↓"} {formatTL(Math.abs(fark))}
            </p>
          </div>

          {enDusuk && enDusuk.bakiye < bugunBakiye && (
            <div className="p-3 rounded-lg border border-[#C97676]/20 bg-[#C97676]/5">
              <p className="label-caps text-[#C97676] mb-1">EN DÜŞÜK GÜN</p>
              <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                {enDusuk.etiket}
              </p>
              <p className="font-number font-semibold text-sm mt-1 text-[#C97676]">
                {formatTL(enDusuk.bakiye)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
