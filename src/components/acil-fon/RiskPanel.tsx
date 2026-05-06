"use client";

import { motion } from "framer-motion";
import { Shield, TrendingUp, AlertTriangle, Target } from "lucide-react";
import { buAyYatirma, formatTL, type FonIslem, type FonAyar } from "@/lib/acil-fon-data";

interface Props {
  islemler: FonIslem[];
  mevcut: number;
  ayar: FonAyar;
}

export default function RiskPanel({ islemler, mevcut, ayar }: Props) {
  const oran         = mevcut / ayar.hedef;
  const buAy         = buAyYatirma(islemler);
  const buAyOran     = ayar.aylikHedef > 0 ? Math.min(buAy / ayar.aylikHedef, 1) : 0;
  const kalan        = Math.max(ayar.hedef - mevcut, 0);
  const ayKaldi      = ayar.aylikHedef > 0 ? Math.ceil(kalan / ayar.aylikHedef) : 0;
  const buAyEksik    = Math.max(ayar.aylikHedef - buAy, 0);

  const riskler = [
    oran < 0.5  && { icon: AlertTriangle, renk: "#ef4444", mesaj: "Fon hedefin %50 altında — acil birikim gerekli"       },
    oran < 0.75 && { icon: TrendingUp,    renk: "#fbc024", mesaj: "Fon henüz hedef seviyesinde değil, birikime devam et" },
    buAyEksik > 0 && { icon: Target,      renk: "#fbc024", mesaj: `Bu ay ${formatTL(buAyEksik)} daha yatırılması gerekiyor` },
  ].filter(Boolean) as { icon: typeof Shield; renk: string; mesaj: string }[];

  return (
    <div className="space-y-4">
      {/* Bu ay ilerleme */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">Bu Ay Birikimi</h3>
          <span className="text-xs text-[#94a3b8]">{formatTL(buAy)} / {formatTL(ayar.aylikHedef)}</span>
        </div>
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
          {buAyOran >= 1
            ? "Bu ayın hedefine ulaşıldı!"
            : buAyEksik > 0
            ? `${formatTL(buAyEksik)} eksik`
            : "Henüz yatırma yapılmadı"}
        </p>
      </div>

      {/* Hedef tahmini */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-[rgba(251,192,36,0.12)] border border-[rgba(251,192,36,0.2)] flex items-center justify-center">
            <Target className="w-4 h-4 text-[#fbc024]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Hedef Tahmini</p>
            <p className="text-xs text-[#94a3b8]">Mevcut hızla devam edilirse</p>
          </div>
        </div>
        {kalan > 0 ? (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#94a3b8]">Kalan tutar</span>
              <span className="text-white font-bold">{formatTL(kalan)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#94a3b8]">Tahmini süre</span>
              <span className="text-[#fbc024] font-bold">~{ayKaldi} ay</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#94a3b8]">Aylık birikim önerisi</span>
              <span className="text-white font-bold">{formatTL(ayar.aylikHedef)}</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-[#22c55e] font-semibold">Hedefe ulaşıldı! 🎯</p>
        )}
      </div>

      {/* Risk uyarıları */}
      {riskler.length > 0 && (
        <div className="glass-card rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-white mb-1">Uyarılar</h3>
          {riskler.map(({ icon: Icon, renk, mesaj }, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-start gap-3 p-3 rounded-xl"
              style={{ backgroundColor: `${renk}10`, border: `1px solid ${renk}25` }}
            >
              <Icon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: renk }} />
              <p className="text-xs leading-relaxed" style={{ color: renk }}>{mesaj}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Fon sağlıklıysa pozitif mesaj */}
      {riskler.length === 0 && (
        <div className="glass-card rounded-2xl p-5 flex items-center gap-3"
          style={{ backgroundColor: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)" }}>
          <Shield className="w-5 h-5 text-[#22c55e] shrink-0" />
          <p className="text-sm text-[#22c55e] font-medium">
            Acil durum fonunuz sağlıklı bir seviyede. Harika iş!
          </p>
        </div>
      )}
    </div>
  );
}
