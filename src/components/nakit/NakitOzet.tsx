"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Wallet, ArrowUpDown } from "lucide-react";
import { formatTL } from "@/lib/nakit-data";
import type { Kurus } from "@/lib/para";
import { useNakit } from "@/store/nakit";

function ayAralik(yilOffset: number, ayOffset: number) {
  const simdi = new Date();
  const bas   = new Date(simdi.getFullYear(), simdi.getMonth() + ayOffset,     1);
  const bit   = new Date(simdi.getFullYear(), simdi.getMonth() + ayOffset + 1, 0, 23, 59, 59, 999);
  return { bas, bit };
}

function yuzde(buAy: number, gecenAy: number): { deger: number; pozitif: boolean; etiket: string } {
  if (gecenAy === 0) {
    if (buAy === 0) return { deger: 0,   pozitif: true,  etiket: "Geçen ayda veri yok" };
    return                { deger: 100, pozitif: true,  etiket: "+%100 geçen aya göre" };
  }
  const d = Math.round(((buAy - gecenAy) / gecenAy) * 100);
  return {
    deger:   Math.abs(d),
    pozitif: d >= 0,
    etiket:  `${d >= 0 ? "+" : ""}%${Math.abs(d)} geçen aya göre`,
  };
}

export default function NakitOzet() {
  const { islemler } = useNakit();

  const { buAy, gecenAy } = useMemo(() => {
    const { bas: buBas,    bit: buBit    } = ayAralik(0, 0);
    const { bas: gecenBas, bit: gecenBit } = ayAralik(0, -1);

    const buAyIslem    = islemler.filter((i) => { const t = new Date(i.tarih); return t >= buBas    && t <= buBit;    });
    const gecenAyIslem = islemler.filter((i) => { const t = new Date(i.tarih); return t >= gecenBas && t <= gecenBit; });

    const sum = (arr: typeof islemler, tip: "gelir" | "gider") =>
      arr.filter((i) => i.tip === tip).reduce((s, i) => s + i.tutarKurus, 0);

    return {
      buAy:    { gelirKurus: sum(buAyIslem,    "gelir"), giderKurus: sum(buAyIslem,    "gider"), sayi: buAyIslem.length    },
      gecenAy: { gelirKurus: sum(gecenAyIslem, "gelir"), giderKurus: sum(gecenAyIslem, "gider"), sayi: gecenAyIslem.length },
    };
  }, [islemler]);

  const netBuAy    = buAy.gelirKurus - buAy.giderKurus;
  const netGecenAy = gecenAy.gelirKurus - gecenAy.giderKurus;

  const gelirYz = yuzde(buAy.gelirKurus,  gecenAy.gelirKurus);
  const giderYz = yuzde(buAy.giderKurus,  gecenAy.giderKurus);
  const netYz   = yuzde(netBuAy > 0 ? netBuAy : 0, netGecenAy > 0 ? netGecenAy : 0);

  const kartlar = [
    {
      label:  "Bu Ay Gelir",
      value:  formatTL(buAy.gelirKurus),
      alt:    gelirYz.etiket,
      icon:   TrendingUp,
      color:  "#22c55e",
      bg:     "rgba(34,197,94,0.1)",
      border: "rgba(34,197,94,0.2)",
      altColor: gelirYz.pozitif ? "#22c55e" : "#ef4444",
    },
    {
      label:  "Bu Ay Gider",
      value:  formatTL(buAy.giderKurus),
      alt:    giderYz.etiket,
      icon:   TrendingDown,
      color:  "#ef4444",
      bg:     "rgba(239,68,68,0.1)",
      border: "rgba(239,68,68,0.2)",
      // Gider artışı kötü (kırmızı), azalış iyi (yeşil)
      altColor: giderYz.pozitif ? "#ef4444" : "#22c55e",
    },
    {
      label:  "Net Nakit Akışı",
      value:  (netBuAy >= 0 ? "+" : "") + formatTL(netBuAy),
      alt:    netBuAy >= 0 ? netYz.etiket : "Dikkat: Negatif akış",
      icon:   ArrowUpDown,
      color:  netBuAy >= 0 ? "#22c55e" : "#ef4444",
      bg:     netBuAy >= 0 ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
      border: netBuAy >= 0 ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)",
      altColor: netBuAy >= 0 ? "#22c55e" : "#ef4444",
    },
    {
      label:  "Bu Ay İşlem",
      value:  `${buAy.sayi} adet`,
      alt:    `${islemler.filter((i) => i.tip === "gelir").length} gelir · ${islemler.filter((i) => i.tip === "gider").length} gider (toplam)`,
      icon:   Wallet,
      color:  "#fbc024",
      bg:     "rgba(251,192,36,0.1)",
      border: "rgba(251,192,36,0.2)",
      altColor: "#fbc024",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {kartlar.map(({ label, value, alt, icon: Icon, color, bg, border, altColor }, i) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07 }}
          className="glass-card rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-[#94a3b8] font-medium">{label}</span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: bg, border: `1px solid ${border}` }}>
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
          </div>
          <p className="text-xl font-bold text-white">{value}</p>
          <p className="text-xs mt-1 truncate" style={{ color: altColor }}>{alt}</p>
        </motion.div>
      ))}
    </div>
  );
}
