"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { useStok } from "@/store/stok";

const RENKLER = [
  "#fbc024", "#22c55e", "#3b82f6", "#a855f7",
  "#ef4444", "#f97316", "#06b6d4", "#ec4899",
];

const tl = (n: number) =>
  (n / 100).toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });

export default function StokDegerTablosu() {
  const { urunler } = useStok();

  const { genelToplam, kategoriler } = useMemo(() => {
    const map: Record<string, { adet: number; deger: number }> = {};
    let toplam = 0;

    for (const u of urunler) {
      if (!u.birimMaliyetKurus) continue;
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

  const urunSayisi        = urunler.length;
  const maliyetliUrun     = urunler.filter((u) => u.birimMaliyetKurus).length;

  if (genelToplam === 0) {
    return (
      <div className="glass-card rounded-2xl p-5 space-y-3">
        <h2 className="text-base font-bold text-white">Stok Değeri Dağılımı</h2>
        <p className="text-sm text-[#64748b] text-center py-6">
          Stok değerini görmek için ürünlere birim alış fiyatı girin
          <br />
          <span className="text-xs">({maliyetliUrun}/{urunSayisi} ürünün fiyatı girildi)</span>
        </p>
      </div>
    );
  }

  const pieData = kategoriler.map((k) => ({ name: k.ad, value: k.deger }));

  return (
    <div className="glass-card rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-white">Stok Değeri Dağılımı</h2>
        <div className="text-right">
          <p className="text-xs text-[#94a3b8]">Toplam Stok Serveti</p>
          <p className="text-lg font-black text-[#fbc024]">{tl(genelToplam)}</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-center">
        {/* Sol — Tablo */}
        <div className="flex-1 w-full min-w-0">
          <div className="space-y-2">
            {kategoriler.map((k, i) => {
              const yuzde = genelToplam > 0 ? (k.deger / genelToplam) * 100 : 0;
              const renk  = RENKLER[i % RENKLER.length];
              return (
                <div key={k.ad} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: renk }} />
                      <span className="text-white font-medium truncate">{k.ad}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 text-right">
                      <span className="text-xs text-[#64748b]">{k.adet} birim</span>
                      <span className="text-sm font-semibold text-white w-20 text-right">{tl(k.deger)}</span>
                      <span className="text-xs font-bold w-10 text-right" style={{ color: renk }}>
                        %{yuzde.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${yuzde}%`, backgroundColor: renk }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 pt-3 border-t border-[rgba(255,255,255,0.06)] flex justify-between text-xs text-[#64748b]">
            <span>{maliyetliUrun}/{urunSayisi} ürünün fiyatı girildi</span>
            <span className="text-[#94a3b8] font-medium">Toplam: {tl(genelToplam)}</span>
          </div>
        </div>

        {/* Sağ — Pasta grafik */}
        <div className="w-full lg:w-56 h-56 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={RENKLER[i % RENKLER.length]} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => [tl(Number(v)), "Değer"]}
                contentStyle={{ background: "#0e172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }}
                labelStyle={{ color: "#94a3b8" }}
                itemStyle={{ color: "#fbc024" }}
              />
            </PieChart>
          </ResponsiveContainer>
          <p className="text-center text-xs text-[#64748b] -mt-2">Kategori Dağılımı</p>
        </div>
      </div>
    </div>
  );
}
