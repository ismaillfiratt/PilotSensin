"use client";

import { useState, useMemo } from "react";
import { motion }             from "framer-motion";
import { Search, ArrowUpDown, TrendingUp, TrendingDown } from "lucide-react";
import { useSatislar, type SatisKaydi } from "@/store/satislar";

type Siralama = "marj" | "kar" | "ciro";

const tl = (n: number) =>
  (n / 100).toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });

const marjRenk = (m: number) => m >= 30 ? "#22c55e" : m >= 15 ? "#fbc024" : "#ef4444";

/** Gerçek satış kayıtlarından ürün bazlı marj özeti */
function urunMarjlari(kayitlar: SatisKaydi[]) {
  const map: Record<string, {
    urunId: string; urunAd: string; kategori: string;
    toplamCiroKurus: number; toplamKar: number; toplamSMM: number; toplamAdet: number;
  }> = {};

  for (const k of kayitlar) {
    if (k.iadeEdildi) continue;
    const key = k.urunId ?? k.urunAd;
    if (!map[key]) {
      map[key] = { urunId: key, urunAd: k.urunAd, kategori: k.kategori,
                   toplamCiroKurus: 0, toplamKar: 0, toplamSMM: 0, toplamAdet: 0 };
    }
    map[key].toplamCiroKurus += k.toplamCiroKurus;
    map[key].toplamKar  += k.brutKarKurus;
    map[key].toplamSMM  += k.birimAlisFiyatiKurus * k.adet;
    map[key].toplamAdet += k.adet;
  }

  return Object.values(map).map((u) => ({
    ...u,
    marjYuzde: u.toplamCiroKurus > 0 ? (u.toplamKar / u.toplamCiroKurus) * 100 : 0,
  }));
}

export default function UrunMarjTablosu() {
  const { kayitlar }         = useSatislar();
  const [arama, setArama]    = useState("");
  const [siralama, setSiralama] = useState<Siralama>("marj");

  const veri = useMemo(() => urunMarjlari(kayitlar), [kayitlar]);

  const sirali = useMemo(() =>
    veri
      .filter((u) =>
        arama === "" ||
        u.urunAd.toLowerCase().includes(arama.toLowerCase()) ||
        u.kategori.toLowerCase().includes(arama.toLowerCase())
      )
      .sort((a, b) =>
        siralama === "marj" ? b.marjYuzde  - a.marjYuzde :
        siralama === "kar"  ? b.toplamKar  - a.toplamKar  :
                              b.toplamCiroKurus - a.toplamCiroKurus
      ),
    [veri, arama, siralama]
  );

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
          <input
            value={arama} onChange={(e) => setArama(e.target.value)}
            placeholder="Ürün veya kategori ara..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#94a3b8] text-sm focus:outline-none focus:border-[rgba(251,192,36,0.4)] transition-colors"
          />
        </div>
        <div className="flex gap-1 p-1 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)]">
          {([
            { v: "marj", label: "Marj" },
            { v: "kar",  label: "Kar"  },
            { v: "ciro", label: "Ciro" },
          ] as const).map(({ v, label }) => (
            <button key={v} onClick={() => setSiralama(v)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                backgroundColor: siralama === v ? "rgba(251,192,36,0.15)" : "transparent",
                color:  siralama === v ? "#fbc024" : "#94a3b8",
                border: siralama === v ? "1px solid rgba(251,192,36,0.3)" : "1px solid transparent",
              }}>
              <ArrowUpDown className="w-3 h-3" />{label}
            </button>
          ))}
        </div>
      </div>

      {/* Tablo / Kartlar */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {/* Desktop başlık */}
        <div className="hidden md:grid md:grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-5 py-3 border-b border-[rgba(255,255,255,0.06)] text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">
          <span>Ürün</span><span>Kar Marjı</span><span>Toplam Ciro</span><span>Brüt Kâr</span>
        </div>

        <div className="divide-y divide-[rgba(255,255,255,0.04)]">
          {sirali.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-[#64748b]">
                {veri.length === 0 ? "Henüz satış kaydı yok" : "Ürün bulunamadı"}
              </p>
            </div>
          ) : sirali.map((u, i) => {
            const renk = marjRenk(u.marjYuzde);
            return (
              <motion.div key={u.urunId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                {/* Mobile kart */}
                <div className="md:hidden px-4 py-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{u.urunAd}</p>
                      <p className="text-xs text-[#94a3b8]">{u.kategori} · {u.toplamAdet} adet</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold" style={{ color: renk }}>%{u.marjYuzde.toFixed(1)}</p>
                      <div className="mt-1 h-1.5 rounded-full bg-[rgba(255,255,255,0.06)] w-16 ml-auto">
                        <div className="h-full rounded-full" style={{ width: `${Math.min(u.marjYuzde, 60) / 60 * 100}%`, backgroundColor: renk }} />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-[#64748b] uppercase tracking-wide">Ciro</p>
                      <p className="text-sm text-white font-medium">{tl(u.toplamCiroKurus)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-[#64748b] uppercase tracking-wide">Brüt Kâr</p>
                      <div className="flex items-center gap-1 justify-end">
                        {u.toplamKar >= 0 ? <TrendingUp className="w-3.5 h-3.5 text-[#22c55e]" /> : <TrendingDown className="w-3.5 h-3.5 text-[#ef4444]" />}
                        <p className="text-sm font-bold" style={{ color: renk }}>{u.toplamKar >= 0 ? "+" : ""}{tl(u.toplamKar)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Desktop satır */}
                <div className="hidden md:grid md:grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-5 py-4 items-center hover:bg-[rgba(251,192,36,0.03)] transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-white">{u.urunAd}</p>
                    <p className="text-xs text-[#94a3b8] mt-0.5">{u.kategori} · {u.toplamAdet} adet</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: renk }}>%{u.marjYuzde.toFixed(1)}</p>
                    <div className="mt-1 h-1.5 rounded-full bg-[rgba(255,255,255,0.06)] w-16">
                      <div className="h-full rounded-full" style={{ width: `${Math.min(u.marjYuzde, 60) / 60 * 100}%`, backgroundColor: renk }} />
                    </div>
                  </div>
                  <p className="text-sm text-white font-medium">{tl(u.toplamCiroKurus)}</p>
                  <div className="flex items-center gap-1.5">
                    {u.toplamKar >= 0 ? <TrendingUp className="w-3.5 h-3.5 text-[#22c55e]" /> : <TrendingDown className="w-3.5 h-3.5 text-[#ef4444]" />}
                    <p className="text-sm font-bold" style={{ color: renk }}>{u.toplamKar >= 0 ? "+" : ""}{tl(u.toplamKar)}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="px-5 py-3 border-t border-[rgba(255,255,255,0.06)] text-xs text-[#94a3b8]">
          {sirali.length} / {veri.length} ürün gösteriliyor · Gerçek satış verisine göre
        </div>
      </div>
    </div>
  );
}
