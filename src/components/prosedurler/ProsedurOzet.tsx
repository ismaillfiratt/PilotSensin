"use client";

import { motion } from "framer-motion";
import { ClipboardList, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";
import { prosedurDurumu, type Prosedur, type ChecklistItem } from "@/lib/prosedur-data";

interface Props {
  prosedurler: Prosedur[];
  checklist: ChecklistItem[];
}

export default function ProsedurOzet({ prosedurler, checklist }: Props) {
  const guncellemeGerekli = prosedurler.filter((p) => prosedurDurumu(p.sonGuncelleme).gun >= 30).length;
  const gunluk            = checklist.filter((c) => c.sikligi === "gunluk");
  const tamamlananGunluk  = gunluk.filter((c) => c.tamamlandi).length;
  const tamamOran         = gunluk.length > 0 ? Math.round((tamamlananGunluk / gunluk.length) * 100) : 0;

  const kartlar = [
    {
      label: "Toplam Prosedür",
      value: prosedurler.length,
      alt: "Aktif SOP belgesi",
      icon: ClipboardList,
      color: "#94a3b8",
      bg: "rgba(148,163,184,0.1)",
      border: "rgba(148,163,184,0.2)",
    },
    {
      label: "Güncelleme Gerekli",
      value: guncellemeGerekli,
      alt: guncellemeGerekli > 0 ? "30+ gün güncellenmedi" : "Tüm belgeler güncel",
      icon: RefreshCw,
      color: guncellemeGerekli > 0 ? "#ef4444" : "#22c55e",
      bg: guncellemeGerekli > 0 ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
      border: guncellemeGerekli > 0 ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.2)",
    },
    {
      label: "Bugünkü Checklist",
      value: `${tamamlananGunluk}/${gunluk.length}`,
      alt: `%${tamamOran} tamamlandı`,
      icon: CheckCircle,
      color: tamamOran === 100 ? "#22c55e" : tamamOran >= 50 ? "#fbc024" : "#ef4444",
      bg: tamamOran === 100 ? "rgba(34,197,94,0.1)" : tamamOran >= 50 ? "rgba(251,192,36,0.1)" : "rgba(239,68,68,0.1)",
      border: tamamOran === 100 ? "rgba(34,197,94,0.2)" : tamamOran >= 50 ? "rgba(251,192,36,0.2)" : "rgba(239,68,68,0.2)",
    },
    {
      label: "Tamamlanmayan",
      value: gunluk.filter((c) => !c.tamamlandi).length,
      alt: "Bugün yapılması gereken",
      icon: AlertTriangle,
      color: gunluk.filter((c) => !c.tamamlandi).length > 0 ? "#fbc024" : "#22c55e",
      bg: gunluk.filter((c) => !c.tamamlandi).length > 0 ? "rgba(251,192,36,0.1)" : "rgba(34,197,94,0.1)",
      border: gunluk.filter((c) => !c.tamamlandi).length > 0 ? "rgba(251,192,36,0.2)" : "rgba(34,197,94,0.2)",
    },
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
