"use client";

import { useState, useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Calendar } from "lucide-react";
import { aylikGrafikAralik, formatTL } from "@/lib/acil-fon-data";
import { useAcilFon } from "@/store/acilFon";

type Aralik = "1" | "3" | "6" | "ozel";

function ayStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function strToDate(s: string) {
  const [y, m] = s.split("-").map(Number);
  return new Date(y, m - 1, 1);
}
function hesaplaAralik(aralik: Aralik, ozelBas: string, ozelBit: string) {
  if (aralik === "ozel") {
    const bas = strToDate(ozelBas);
    const bit = strToDate(ozelBit);
    const diff = (bit.getFullYear() - bas.getFullYear()) * 12 + (bit.getMonth() - bas.getMonth()) + 1;
    return { baslangic: bas, aySayisi: Math.max(diff, 1) };
  }
  const n = parseInt(aralik, 10);
  const bas = new Date(); bas.setMonth(bas.getMonth() - n + 1); bas.setDate(1);
  return { baslangic: bas, aySayisi: n };
}

const ARALIK_BUTONLAR: { label: string; value: Aralik }[] = [
  { label: "Son 1 Ay", value: "1" },
  { label: "Son 3 Ay", value: "3" },
  { label: "Son 6 Ay", value: "6" },
  { label: "Özel",     value: "ozel" },
];

function RangeSelector({
  aralik, setAralik, ozelBas, setOzelBas, ozelBit, setOzelBit,
}: {
  aralik: Aralik; setAralik: (v: Aralik) => void;
  ozelBas: string; setOzelBas: (v: string) => void;
  ozelBit: string; setOzelBit: (v: string) => void;
}) {
  return (
    <div className="mb-4">
      <div className="flex gap-1.5 flex-wrap">
        {ARALIK_BUTONLAR.map(({ label, value }) => (
          <button key={value} onClick={() => setAralik(value)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all border"
            style={{
              borderColor:     aralik === value ? "#fbc024" : "rgba(255,255,255,0.08)",
              backgroundColor: aralik === value ? "rgba(251,192,36,0.15)" : "transparent",
              color:           aralik === value ? "#fbc024" : "#94a3b8",
            }}>
            {label}
          </button>
        ))}
      </div>
      {aralik === "ozel" && (
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <Calendar className="w-4 h-4 text-[#94a3b8] shrink-0" />
          <input type="month" value={ozelBas} onChange={(e) => setOzelBas(e.target.value)}
            className="px-2 py-1 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white text-xs focus:outline-none focus:border-[rgba(251,192,36,0.4)] scheme-dark" />
          <span className="text-[#94a3b8] text-xs">—</span>
          <input type="month" value={ozelBit} onChange={(e) => setOzelBit(e.target.value)}
            className="px-2 py-1 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white text-xs focus:outline-none focus:border-[rgba(251,192,36,0.4)] scheme-dark" />
        </div>
      )}
    </div>
  );
}

const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card rounded-xl p-3 text-xs space-y-1">
      <p className="text-white font-bold">{payload[0].name}</p>
      <p style={{ color: payload[0].payload.color }}>{formatTL(payload[0].value)}</p>
    </div>
  );
};

export default function BirikimPanel() {
  const { islemler, aktifHedefId } = useAcilFon();

  // Tablo için bağımsız state
  const [tAralik, setTAralik] = useState<Aralik>("3");
  const [tOzelBas, setTOzelBas] = useState(() => { const d = new Date(); d.setMonth(d.getMonth() - 2); return ayStr(d); });
  const [tOzelBit, setTOzelBit] = useState(() => ayStr(new Date()));

  // Grafiksel için bağımsız state
  const [gAralik, setGAralik] = useState<Aralik>("3");
  const [gOzelBas, setGOzelBas] = useState(() => { const d = new Date(); d.setMonth(d.getMonth() - 2); return ayStr(d); });
  const [gOzelBit, setGOzelBit] = useState(() => ayStr(new Date()));

  const { baslangic: tBas, aySayisi: tSayisi } = useMemo(() => hesaplaAralik(tAralik, tOzelBas, tOzelBit), [tAralik, tOzelBas, tOzelBit]);
  const { baslangic: gBas, aySayisi: gSayisi } = useMemo(() => hesaplaAralik(gAralik, gOzelBas, gOzelBit), [gAralik, gOzelBas, gOzelBit]);

  const filtreId = aktifHedefId ?? undefined;

  const tabloData = useMemo(() => aylikGrafikAralik(islemler, tBas, tSayisi, filtreId), [islemler, tBas, tSayisi, filtreId]);

  const grafikIslemler = useMemo(() => {
    const rangeStart = new Date(gBas.getFullYear(), gBas.getMonth(), 1);
    const rangeEnd   = new Date(gBas.getFullYear(), gBas.getMonth() + gSayisi, 0, 23, 59, 59);
    return islemler.filter(i => {
      if (filtreId && i.hedefId !== filtreId) return false;
      const t = new Date(i.tarih);
      return t >= rangeStart && t <= rangeEnd;
    });
  }, [islemler, gBas, gSayisi, filtreId]);

  const totalYatirma = grafikIslemler.filter(i => i.tip === "yatirma").reduce((s, i) => s + i.tutar, 0);
  const totalCekme   = grafikIslemler.filter(i => i.tip === "cekme").reduce((s, i) => s + i.tutar, 0);
  const pieData = [
    { name: "Yatırılan", value: totalYatirma, color: "#22c55e" },
    { name: "Çekilen",   value: totalCekme,   color: "#ef4444" },
  ].filter(d => d.value > 0);

  const tabloToplam = tabloData.reduce((acc, r) => ({ yatirma: acc.yatirma + r.yatirma, cekme: acc.cekme + r.cekme }), { yatirma: 0, cekme: 0 });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* SOL — Birikim Geçmişi - Tablo (bağımsız date range) */}
      <div className="glass-card rounded-2xl p-5 flex flex-col">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-white">Birikim Geçmişi — Tablo</h2>
          <p className="text-xs text-[#94a3b8] mt-0.5">Aylık özet — seçili dönem</p>
        </div>
        <RangeSelector aralik={tAralik} setAralik={setTAralik} ozelBas={tOzelBas} setOzelBas={setTOzelBas} ozelBit={tOzelBit} setOzelBit={setTOzelBit} />

        {islemler.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-[#94a3b8] text-sm">Henüz işlem eklenmedi.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.06)]">
                  {["Dönem", "Yatırılan", "Çekilen", "Net", "Bakiye"].map(h => (
                    <th key={h} className="text-[#94a3b8] font-semibold uppercase tracking-wide text-left py-2 pr-3 last:pr-0">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
                {tabloData.map(({ ay, yatirma, cekme, bakiye }) => {
                  const net = yatirma - cekme;
                  return (
                    <tr key={ay} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                      <td className="py-2.5 pr-3 text-white font-medium whitespace-nowrap">{ay}</td>
                      <td className="py-2.5 pr-3 text-[#22c55e] font-semibold">{yatirma > 0 ? formatTL(yatirma) : "—"}</td>
                      <td className="py-2.5 pr-3 text-[#ef4444] font-semibold">{cekme > 0 ? formatTL(cekme) : "—"}</td>
                      <td className="py-2.5 pr-3 font-bold" style={{ color: net >= 0 ? "#22c55e" : "#ef4444" }}>
                        {net !== 0 ? `${net > 0 ? "+" : ""}${formatTL(Math.abs(net))}` : "—"}
                      </td>
                      <td className="py-2.5 text-[#fbc024] font-bold">{bakiye > 0 ? formatTL(bakiye) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
              {tabloData.length > 1 && (
                <tfoot>
                  <tr className="border-t border-[rgba(255,255,255,0.1)]">
                    <td className="py-2.5 pr-3 text-[#94a3b8] font-semibold uppercase text-[10px]">Toplam</td>
                    <td className="py-2.5 pr-3 text-[#22c55e] font-bold">{formatTL(tabloToplam.yatirma)}</td>
                    <td className="py-2.5 pr-3 text-[#ef4444] font-bold">{formatTL(tabloToplam.cekme)}</td>
                    <td className="py-2.5 pr-3 font-bold" style={{ color: tabloToplam.yatirma - tabloToplam.cekme >= 0 ? "#22c55e" : "#ef4444" }}>
                      {tabloToplam.yatirma - tabloToplam.cekme > 0 ? "+" : ""}{formatTL(Math.abs(tabloToplam.yatirma - tabloToplam.cekme))}
                    </td>
                    <td className="py-2.5 text-[#fbc024] font-bold">
                      {tabloData.length > 0 ? formatTL(tabloData[tabloData.length - 1].bakiye) : "—"}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>

      {/* SAĞ — Birikim Geçmişi - Grafiksel (bağımsız date range, dairesel) */}
      <div className="glass-card rounded-2xl p-5 flex flex-col">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-white">Birikim Geçmişi — Grafiksel</h2>
          <p className="text-xs text-[#94a3b8] mt-0.5">Seçili dönem için dağılım</p>
        </div>
        <RangeSelector aralik={gAralik} setAralik={setGAralik} ozelBas={gOzelBas} setOzelBas={setGOzelBas} ozelBit={gOzelBit} setOzelBit={setGOzelBit} />

        {pieData.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-[#94a3b8] text-sm">Seçili dönemde işlem yok.</div>
        ) : (
          <>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={52} outerRadius={80} paddingAngle={3} dataKey="value" strokeWidth={0}>
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} style={{ filter: `drop-shadow(0 0 6px ${entry.color}60)` }} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend formatter={(v) => <span style={{ color: "#94a3b8", fontSize: 12 }}>{v}</span>} iconType="circle" iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-[rgba(34,197,94,0.08)] border border-[rgba(34,197,94,0.2)] rounded-xl p-3">
                <p className="text-[10px] text-[#94a3b8] mb-1">Toplam Yatırılan</p>
                <p className="text-sm font-bold text-[#22c55e]">{formatTL(totalYatirma)}</p>
              </div>
              <div className="bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] rounded-xl p-3">
                <p className="text-[10px] text-[#94a3b8] mb-1">Toplam Çekilen</p>
                <p className="text-sm font-bold text-[#ef4444]">{formatTL(totalCekme)}</p>
              </div>
              <div className="bg-[rgba(251,192,36,0.08)] border border-[rgba(251,192,36,0.2)] rounded-xl p-3 col-span-2">
                <p className="text-[10px] text-[#94a3b8] mb-1">Net Dönem Birikimi</p>
                <p className="text-sm font-bold" style={{ color: totalYatirma - totalCekme >= 0 ? "#22c55e" : "#ef4444" }}>
                  {totalYatirma - totalCekme > 0 ? "+" : ""}{formatTL(Math.abs(totalYatirma - totalCekme))}
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
