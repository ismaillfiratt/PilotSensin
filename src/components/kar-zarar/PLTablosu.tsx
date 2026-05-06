"use client";

import { motion } from "framer-motion";
import { ISLETME_GIDERLERI, plOzeti, formatTL, type Urun } from "@/lib/kar-zarar-data";

function Satir({
  label, value, indent = false, bold = false, color, bg, delay = 0,
}: {
  label: string; value: string | number; indent?: boolean; bold?: boolean;
  color?: string; bg?: string; delay?: number;
}) {
  const goster = typeof value === "number"
    ? (value < 0 ? "-" : "") + formatTL(value)
    : value;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="flex items-center justify-between px-5 py-2.5 rounded-lg transition-colors"
      style={{ backgroundColor: bg }}
    >
      <span
        className={`text-sm ${bold ? "font-bold text-white" : "text-[#94a3b8]"} ${indent ? "pl-4" : ""}`}
      >
        {label}
      </span>
      <span
        className={`text-sm font-${bold ? "bold" : "medium"}`}
        style={{ color: color ?? (bold ? "#ffffff" : "#94a3b8") }}
      >
        {goster}
      </span>
    </motion.div>
  );
}

function Ayrac({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 px-5 pt-4 pb-1">
      <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest">{label}</span>
      <div className="flex-1 h-px bg-[rgba(255,255,255,0.06)]" />
    </div>
  );
}

export default function PLTablosu({ urunler }: { urunler: Urun[] }) {
  const { toplamGelir, toplamSMM, brutKar, brutMarj, toplamOpGider, netKar, netMarj } = plOzeti(urunler);

  return (
    <div className="glass-card rounded-2xl py-4 w-full lg:w-80 shrink-0">
      <div className="px-5 pb-3 border-b border-[rgba(255,255,255,0.06)]">
        <h2 className="text-sm font-semibold text-white">Kar & Zarar Özeti</h2>
        <p className="text-xs text-[#94a3b8] mt-0.5">Aylık dönem</p>
      </div>

      <div className="py-2 space-y-0.5">
        <Ayrac label="Gelir" />
        <Satir label="Toplam Satış Geliri" value={toplamGelir} delay={0.05} />

        <Ayrac label="Satılan Mal Maliyeti (SMM)" />
        <Satir label="Ürün / hammadde maliyeti" value={-toplamSMM} color="#ef4444" indent delay={0.10} />

        <Ayrac label="Brüt Kar" />
        <Satir
          label={`Brüt Kar  (%${brutMarj.toFixed(1)} marj)`}
          value={brutKar}
          bold
          color={brutMarj >= 25 ? "#22c55e" : brutMarj >= 15 ? "#fbc024" : "#ef4444"}
          bg={brutMarj >= 25 ? "rgba(34,197,94,0.06)" : "rgba(251,192,36,0.06)"}
          delay={0.15}
        />

        <Ayrac label="İşletme Giderleri" />
        {ISLETME_GIDERLERI.map(({ kategori, tutar }, i) => (
          <Satir key={kategori} label={kategori} value={-tutar} color="#ef4444" indent delay={0.18 + i * 0.04} />
        ))}
        <Satir label="Toplam İşletme Gideri" value={-toplamOpGider} bold color="#ef4444" delay={0.38} />

        <div className="mx-5 my-1 h-px bg-[rgba(255,255,255,0.08)]" />

        <Satir
          label={`Net Kar  (%${netMarj.toFixed(1)} marj)`}
          value={netKar}
          bold
          color={netKar >= 0 ? "#22c55e" : "#ef4444"}
          bg={netKar >= 0 ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)"}
          delay={0.42}
        />
      </div>
    </div>
  );
}
