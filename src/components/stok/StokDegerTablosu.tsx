"use client";

import { useState, useEffect, useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip as ReTooltip, ResponsiveContainer } from "recharts";
import { useStok } from "@/store/stok";

const PIE_COLORS = [
  "#0F3D2E", "#E07A5F", "#3D5A80", "#E9C46A",
  "#C77DFF", "#F4845F", "#06D6A0", "#EF476F",
  "#118AB2", "#073B4C", "#8338EC", "#FB5607",
];

const tl = (n: number) =>
  (n / 100).toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });

function PieTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { fill: string } }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-white border border-black/8 rounded-xl px-3 py-2 text-xs shadow-sm">
      <p className="text-[#0F172A] font-semibold">{d.name}</p>
      <p style={{ color: d.payload.fill }}>{tl(d.value)}</p>
    </div>
  );
}

export default function StokDegerTablosu() {
  const { urunler }            = useStok();
  const [mounted, setMounted]  = useState(false);

  useEffect(() => setMounted(true), []);

  const { genelToplam, kategoriler } = useMemo(() => {
    const map: Record<string, { adet: number; deger: number }> = {};
    let toplam = 0;

    for (const u of urunler) {
      if (u.silindi || !u.birimMaliyetKurus) continue;
      const d = u.mevcutAdet * u.birimMaliyetKurus;
      toplam += d;
      if (!map[u.kategori]) map[u.kategori] = { adet: 0, deger: 0 };
      map[u.kategori].adet  += u.mevcutAdet;
      map[u.kategori].deger += d;
    }

    const kat = Object.entries(map)
      .map(([ad, { adet, deger }]) => ({ ad, adet, deger }))
      .sort((a, b) => b.deger - a.deger);

    return { genelToplam: toplam, kategoriler: kat };
  }, [urunler]);

  const aktif        = urunler.filter((u) => !u.silindi);
  const maliyetliUrun = aktif.filter((u) => u.birimMaliyetKurus).length;

  if (genelToplam === 0) {
    return (
      <section className="py-2">
        <h2 className="text-sm font-semibold mb-4">Stok Değeri Dağılımı</h2>
        <div className="rounded-xl border border-black/8 bg-white p-10 text-center">
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Stok değerini görmek için ürünlere birim alış fiyatı girin
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
            ({maliyetliUrun}/{aktif.length} ürünün fiyatı girildi)
          </p>
        </div>
      </section>
    );
  }

  const pieData = kategoriler.map((k) => ({ name: k.ad, value: k.deger }));

  return (
    <section className="py-2">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold">Stok Değeri Dağılımı</h2>
        <p className="font-number text-sm font-semibold text-[#0F172A]">{tl(genelToplam)}</p>
      </div>

      <div className="rounded-xl border border-black/8 bg-white p-5">
        {/* Donut chart */}
        <div className="flex justify-center">
          {mounted ? (
            <div style={{ width: 220, height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name"
                    cx="50%" cy="50%" outerRadius={95} innerRadius={55}
                    paddingAngle={2} stroke="none">
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <ReTooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="w-[220px] h-[220px] rounded-full bg-gray-100 animate-pulse" />
          )}
        </div>

        {/* Liste */}
        <div className="mt-5 space-y-3">
          {kategoriler.map((k, i) => {
            const pct  = genelToplam > 0 ? (k.deger / genelToplam) * 100 : 0;
            const renk = PIE_COLORS[i % PIE_COLORS.length];
            return (
              <div key={k.ad} className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: renk }} />
                <span className="flex-1 text-sm text-[#0F172A] truncate">{k.ad}</span>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    {k.adet} birim
                  </span>
                  <span className="font-number text-sm font-medium text-[#0F172A] w-24 text-right">
                    {tl(k.deger)}
                  </span>
                  <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: renk }} />
                  </div>
                  <span className="font-number text-xs font-medium text-gray-500 w-10 text-right">
                    %{pct.toFixed(1)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-4 text-xs border-t border-black/5 pt-3" style={{ color: "var(--text-secondary)" }}>
          {maliyetliUrun}/{aktif.length} ürünün fiyatı girildi · Toplam {tl(genelToplam)}
        </p>
      </div>
    </section>
  );
}
