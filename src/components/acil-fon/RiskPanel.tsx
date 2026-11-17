"use client";

import { motion } from "framer-motion";
import { Target } from "lucide-react";
import { buAyYatirma, formatTL, type FonIslem, type FonHedef } from "@/lib/acil-fon-data";
import type { Kurus } from "@/lib/para";

interface Props {
  islemler:    FonIslem[];
  hedef:       FonHedef | null;   // null = tüm hedefler (aggregate)
  mevcut:      number;
  toplamHedefKurus: number;
}

export default function RiskPanel({ islemler, hedef, mevcut, toplamHedefKurus }: Props) {
  const hedefId    = hedef?.id;
  const aylikOdemeKurus = hedef?.aylikOdemeKurus ?? 0;
  const varVeri    = islemler.length > 0;

  const buAy      = buAyYatirma(islemler, hedefId);
  const buAyOran  = aylikOdemeKurus > 0 ? Math.min(buAy / aylikOdemeKurus, 1) : 0;
  const buAyEksik = aylikOdemeKurus > 0 ? Math.max(aylikOdemeKurus - buAy, 0) : 0;
  const kalan     = toplamHedefKurus > 0 ? Math.max(toplamHedefKurus - mevcut, 0) : 0;
  const ayKaldi   = aylikOdemeKurus > 0 && kalan > 0 ? Math.ceil(kalan / aylikOdemeKurus) : 0;

  return (
    <div className="space-y-4">
      {/* Bu ay birikimi */}
      <div className="card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-800">Bu Ay Birikimi</h3>
          {varVeri && aylikOdemeKurus > 0 && (
            <span className="text-xs text-gray-400 font-number tabular-nums">{formatTL(buAy)} / {formatTL(aylikOdemeKurus)}</span>
          )}
        </div>

        {!varVeri || aylikOdemeKurus === 0 ? (
          <p className="text-xs text-gray-400">
            {aylikOdemeKurus === 0 && !hedef
              ? "Hedef belirlenmedi."
              : "Henüz işlem eklenmedi."}
          </p>
        ) : (
          <>
            <div className="h-3 rounded-full bg-gray-50 mb-2">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: buAyOran >= 1 ? "#22c55e" : buAyOran >= 0.5 ? "var(--leaf)" : "#ef4444" }}
                initial={{ width: 0 }}
                animate={{ width: `${buAyOran * 100}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
            <p className="text-xs" style={{ color: buAyOran >= 1 ? "#22c55e" : "var(--leaf)" }}>
              {buAyOran >= 1 ? "Bu ayın hedefine ulaşıldı!" : `${formatTL(buAyEksik)} eksik`}
            </p>
          </>
        )}
      </div>

      {/* Hedefim */}
      <div className="card rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-[var(--mint)] border border-[var(--forest-100, #D9F2E4)] flex items-center justify-center">
            <Target className="w-4 h-4 text-[var(--leaf)]" />
          </div>
          <p className="text-sm font-semibold text-gray-800">Hedefim</p>
        </div>

        {toplamHedefKurus === 0 ? (
          <p className="text-xs text-gray-400">Hedef belirlenmedi. Sağ üstten hedef ekleyebilirsin.</p>
        ) : kalan === 0 ? (
          <p className="text-sm text-[#22c55e] font-semibold">Hedefe ulaşıldı!</p>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Kalan tutar</span>
              <span className="text-gray-800 font-bold font-number tabular-nums">{formatTL(kalan)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Hedef süresi</span>
              <span className="text-[var(--leaf)] font-bold font-number tabular-nums">{ayKaldi > 0 ? `~${ayKaldi} ay` : "—"}</span>
            </div>
            {hedef?.odemeGunu && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Ödeme günü</span>
                <span className="text-gray-800 font-bold">Her ayın {hedef.odemeGunu}.</span>
              </div>
            )}
            {hedef?.aciklama && (
              <p className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-200 italic">
                {hedef.aciklama}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
