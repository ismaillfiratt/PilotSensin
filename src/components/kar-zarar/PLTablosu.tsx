"use client";

import { useMemo }             from "react";
import { motion }              from "framer-motion";
import { useSatislar }         from "@/store/satislar";
import { useIsletmeGiderleri } from "@/store/isletmeGiderleri";
import { plTablosu }           from "@/lib/selectors/pl";

const tl = (n: number) =>
  (n / 100).toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 2 });

const VURGU_RENK = {
  pozitif: "#22c55e",
  negatif: "#ef4444",
  nötr:    "#94a3b8",
} as const;

function Satir({
  label, tutarKurus, indent = false, bold = false, delay = 0, vurgu,
}: {
  label: string; tutarKurus: number; indent?: boolean; bold?: boolean;
  delay?: number; vurgu?: "pozitif" | "negatif" | "nötr";
}) {
  const renk = vurgu ? VURGU_RENK[vurgu] : (bold ? "#ffffff" : "#94a3b8");
  const bg   = !bold ? undefined
    : vurgu === "pozitif" ? "rgba(34,197,94,0.08)"
    : vurgu === "negatif" ? "rgba(239,68,68,0.08)"
    : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="flex items-center justify-between px-5 py-2.5 rounded-lg"
      style={{ backgroundColor: bg }}
    >
      <span className={`text-sm ${bold ? "font-bold text-gray-800" : "text-gray-400"} ${indent ? "pl-4" : ""}`}>
        {label}
      </span>
      <span className={`text-sm tabular-nums ${bold ? "font-bold" : "font-medium"}`} style={{ color: renk }}>
        {tl(tutarKurus)}
      </span>
    </motion.div>
  );
}

function Ayrac({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 px-5 pt-4 pb-1">
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
      <div className="flex-1 h-px bg-gray-50" />
    </div>
  );
}

interface Props {
  baslangic?: string;
  bitis?:     string;
}

export default function PLTablosu({ baslangic, bitis }: Props) {
  const { kayitlar } = useSatislar();
  const { giderler } = useIsletmeGiderleri();

  const pl = useMemo(
    () => plTablosu(kayitlar, giderler, baslangic, bitis),
    [kayitlar, giderler, baslangic, bitis]
  );

  const sections = [
    { ayrac: "Gelir",                    satirlar: [{ label: "Satış Hasılatı",          tutarKurus: pl.ciroKurus,          delay: 0.05, vurgu: "pozitif" as const }] },
    { ayrac: "Satılan Mal Maliyeti (SMM)", satirlar: [{ label: "Ürün / hammadde maliyeti", tutarKurus: -pl.smmKurus,         delay: 0.10, vurgu: "negatif" as const, indent: true }] },
    { ayrac: "Brüt Kâr",               satirlar: [{ label: `Brüt Kâr  (%${(pl.brutMarj * 100).toFixed(1)} marj)`, tutarKurus: pl.brutKarKurus, delay: 0.15, vurgu: pl.brutKarKurus >= 0 ? "pozitif" as const : "negatif" as const, bold: true }] },
  ];

  return (
    <div className="card rounded-2xl py-4 w-full lg:w-80 shrink-0">
      <div className="px-5 pb-3 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-800">Kâr &amp; Zarar Özeti</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Gerçek satış verisi · {pl.donemBaslangic} – {pl.donemBitis}
        </p>
      </div>

      <div className="py-2 space-y-0.5">
        {sections.map(({ ayrac, satirlar: ss }) => (
          <div key={ayrac}>
            <Ayrac label={ayrac} />
            {ss.map((s) => (
              <Satir key={s.label} {...s} />
            ))}
          </div>
        ))}

        <Ayrac label="İşletme Giderleri" />
        {giderler.length === 0 ? (
          <div className="px-5 py-2 text-xs text-gray-500 italic">
            Henüz işletme gideri eklenmedi
          </div>
        ) : (
          giderler.map((g, i) => (
            <Satir
              key={g.id}
              label={g.kategori}
              tutarKurus={-g.tutarKurus}
              vurgu="negatif"
              indent
              delay={0.18 + i * 0.04}
            />
          ))
        )}
        <Satir
          label="Toplam İşletme Gideri"
          tutarKurus={-pl.toplamGiderKurus}
          vurgu="negatif"
          bold
          delay={0.38}
        />

        <div className="mx-5 my-1 h-px bg-gray-50" />

        <Satir
          label={`Net Kâr  (%${(pl.netMarj * 100).toFixed(1)} marj)`}
          tutarKurus={pl.netKarKurus}
          vurgu={pl.netKarKurus >= 0 ? "pozitif" : "negatif"}
          bold
          delay={0.42}
        />
      </div>
    </div>
  );
}
