"use client";

import { motion } from "framer-motion";
import { Target } from "lucide-react";
import { buAyYatirma, formatTL, type FonIslem, type FonHedef } from "@/lib/acil-fon-data";

interface Props {
  islemler:    FonIslem[];
  hedef:       FonHedef | null;   // null = tüm hedefler (aggregate)
  mevcut:      number;
  toplamHedef: number;
}

export default function RiskPanel({ islemler, hedef, mevcut, toplamHedef }: Props) {
  const hedefId    = hedef?.id;
  const aylikOdeme = hedef?.aylikOdeme ?? 0;
  const varVeri    = islemler.length > 0;

  const buAy      = buAyYatirma(islemler, hedefId);
  const buAyOran  = aylikOdeme > 0 ? Math.min(buAy / aylikOdeme, 1) : 0;
  const buAyEksik = aylikOdeme > 0 ? Math.max(aylikOdeme - buAy, 0) : 0;
  const kalan     = toplamHedef > 0 ? Math.max(toplamHedef - mevcut, 0) : 0;
  const ayKaldi   = aylikOdeme > 0 && kalan > 0 ? Math.ceil(kalan / aylikOdeme) : 0;

  return (
    <div className="space-y-4">
      {/* Bu ay birikimi */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">Bu Ay Birikimi</h3>
          {varVeri && aylikOdeme > 0 && (
            <span className="text-xs text-[#94a3b8]">{formatTL(buAy)} / {formatTL(aylikOdeme)}</span>
          )}
        </div>

        {!varVeri || aylikOdeme === 0 ? (
          <p className="text-xs text-[#94a3b8]">
            {aylikOdeme === 0 && !hedef
              ? "Hedef belirlenmedi."
              : "Henüz işlem eklenmedi."}
          </p>
        ) : (
          <>
            <div className="h-3 rounded-full bg-[rgba(255,255,255,0.06)] mb-2">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: buAyOran >= 1 ? "#22c55e" : buAyOran >= 0.5 ? "#fbc024" : "#ef4444" }}
                initial={{ width: 0 }}
                animate={{ width: `${buAyOran * 100}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
            <p className="text-xs" style={{ color: buAyOran >= 1 ? "#22c55e" : "#fbc024" }}>
              {buAyOran >= 1 ? "Bu ayın hedefine ulaşıldı!" : `${formatTL(buAyEksik)} eksik`}
            </p>
          </>
        )}
      </div>

      {/* Hedefim */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-[rgba(251,192,36,0.12)] border border-[rgba(251,192,36,0.2)] flex items-center justify-center">
            <Target className="w-4 h-4 text-[#fbc024]" />
          </div>
          <p className="text-sm font-semibold text-white">Hedefim</p>
        </div>

        {toplamHedef === 0 ? (
          <p className="text-xs text-[#94a3b8]">Hedef belirlenmedi. Sağ üstten hedef ekleyebilirsin.</p>
        ) : kalan === 0 ? (
          <p className="text-sm text-[#22c55e] font-semibold">Hedefe ulaşıldı!</p>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#94a3b8]">Kalan tutar</span>
              <span className="text-white font-bold">{formatTL(kalan)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#94a3b8]">Hedef süresi</span>
              <span className="text-[#fbc024] font-bold">{ayKaldi > 0 ? `~${ayKaldi} ay` : "—"}</span>
            </div>
            {hedef?.odemeGunu && (
              <div className="flex justify-between text-sm">
                <span className="text-[#94a3b8]">Ödeme günü</span>
                <span className="text-white font-bold">Her ayın {hedef.odemeGunu}.</span>
              </div>
            )}
            {hedef?.aciklama && (
              <p className="text-xs text-[#94a3b8] mt-2 pt-2 border-t border-[rgba(255,255,255,0.06)] italic">
                {hedef.aciklama}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
