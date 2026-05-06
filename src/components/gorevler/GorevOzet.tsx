"use client";

import { motion } from "framer-motion";
import { CheckSquare, AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { type Gorev, sonTarihDurumu } from "@/lib/gorev-data";

export default function GorevOzet({ gorevler }: { gorevler: Gorev[] }) {
  const toplam     = gorevler.length;
  const tamamlandi = gorevler.filter((g) => g.durum === "tamamlandi").length;
  const geciken    = gorevler.filter((g) => g.durum !== "tamamlandi" && sonTarihDurumu(g.sonTarih).etiket.includes("gecikti")).length;
  const buHafta    = gorevler.filter((g) => {
    const fark = Math.ceil((new Date(g.sonTarih).getTime() - Date.now()) / 86400000);
    return g.durum !== "tamamlandi" && fark >= 0 && fark <= 7;
  }).length;
  const tamamOran = toplam > 0 ? Math.round((tamamlandi / toplam) * 100) : 0;

  const kartlar = [
    { label: "Toplam Görev",    value: toplam,     alt: "Aktif + tamamlanan",     icon: CheckSquare,  color: "#94a3b8", bg: "rgba(148,163,184,0.1)", border: "rgba(148,163,184,0.2)" },
    { label: "Geciken Görev",   value: geciken,    alt: geciken > 0 ? "Hemen ilgilenin" : "Harika, temiz!", icon: AlertTriangle, color: geciken > 0 ? "#ef4444" : "#22c55e", bg: geciken > 0 ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)", border: geciken > 0 ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.2)" },
    { label: "Bu Hafta Bitiyor", value: buHafta,   alt: "7 gün içinde son tarih",  icon: Clock,        color: buHafta > 0 ? "#fbc024" : "#94a3b8", bg: buHafta > 0 ? "rgba(251,192,36,0.1)" : "rgba(148,163,184,0.1)", border: buHafta > 0 ? "rgba(251,192,36,0.2)" : "rgba(148,163,184,0.2)" },
    { label: "Tamamlanma",      value: `%${tamamOran}`, alt: `${tamamlandi} / ${toplam} görev`, icon: CheckCircle, color: tamamOran >= 70 ? "#22c55e" : tamamOran >= 40 ? "#fbc024" : "#ef4444", bg: tamamOran >= 70 ? "rgba(34,197,94,0.1)" : "rgba(251,192,36,0.1)", border: tamamOran >= 70 ? "rgba(34,197,94,0.2)" : "rgba(251,192,36,0.2)" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {kartlar.map(({ label, value, alt, icon: Icon, color, bg, border }, i) => (
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
          <p className="text-xs mt-1" style={{ color }}>{alt}</p>
        </motion.div>
      ))}
    </div>
  );
}
