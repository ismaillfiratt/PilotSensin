"use client";

import { motion } from "framer-motion";
import { ClipboardList, AlertTriangle, CheckCircle, RefreshCw, BarChart2 } from "lucide-react";
import { prosedurDurumu, isDue, uyumSkoru, type Prosedur, type ChecklistItem } from "@/lib/prosedur-data";

interface Props {
  prosedurler: Prosedur[];
  checklist: ChecklistItem[];
}

export default function ProsedurOzet({ prosedurler, checklist }: Props) {
  const guncellemeGerekli = prosedurler.filter(p => prosedurDurumu(p.sonGuncelleme).gun >= 30).length;
  const bekleyen          = checklist.filter(c => isDue(c) && !c.otomatikKontrol).length;
  const uyum              = uyumSkoru(checklist);
  const uyumRenk          = uyum >= 75 ? "#22c55e" : uyum >= 40 ? "#fbc024" : "#ef4444";

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
      label: "Genel Uyum Skoru",
      value: `%${uyum}`,
      alt: uyum >= 75 ? "Harika! Prosedürler takip ediliyor" : uyum >= 40 ? "Bazı kontroller gecikiyor" : "Kritik: birçok kontrol atlandı",
      icon: BarChart2,
      color: uyumRenk,
      bg: `${uyumRenk}18`,
      border: `${uyumRenk}30`,
    },
    {
      label: "Bekleyen Kontrol",
      value: bekleyen,
      alt: bekleyen > 0 ? "Yapılması gereken madde var" : "Tüm kontroller güncel",
      icon: CheckCircle,
      color: bekleyen === 0 ? "#22c55e" : bekleyen <= 3 ? "#fbc024" : "#ef4444",
      bg:    bekleyen === 0 ? "rgba(34,197,94,0.1)"  : bekleyen <= 3 ? "rgba(251,192,36,0.1)" : "rgba(239,68,68,0.1)",
      border:bekleyen === 0 ? "rgba(34,197,94,0.2)"  : bekleyen <= 3 ? "rgba(251,192,36,0.2)" : "rgba(239,68,68,0.2)",
    },
    {
      label: "Güncelleme Gerekli",
      value: guncellemeGerekli,
      alt: guncellemeGerekli > 0 ? "30+ gün güncellenmedi" : "Tüm belgeler güncel",
      icon: RefreshCw,
      color: guncellemeGerekli > 0 ? "#ef4444" : "#22c55e",
      bg:    guncellemeGerekli > 0 ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
      border:guncellemeGerekli > 0 ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.2)",
    },
    {
      label: "Uyarı Var",
      value: guncellemeGerekli + bekleyen,
      alt: guncellemeGerekli + bekleyen > 0 ? "Dikkat gerektiren madde" : "Sorun yok",
      icon: AlertTriangle,
      color: guncellemeGerekli + bekleyen > 0 ? "#fbc024" : "#22c55e",
      bg:    guncellemeGerekli + bekleyen > 0 ? "rgba(251,192,36,0.1)" : "rgba(34,197,94,0.1)",
      border:guncellemeGerekli + bekleyen > 0 ? "rgba(251,192,36,0.2)" : "rgba(34,197,94,0.2)",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {kartlar.map(({ label, value, alt, icon: Icon, color, bg, border }, i) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          className="glass-card rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-[#94a3b8] font-medium leading-tight">{label}</span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: bg, border: `1px solid ${border}` }}>
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
          </div>
          <p className="text-xl font-bold" style={{ color }}>{value}</p>
          <p className="text-[10px] mt-1 text-[#64748b] leading-tight">{alt}</p>
        </motion.div>
      ))}
    </div>
  );
}
