"use client";

import { motion } from "framer-motion";
import { prosedurDurumu, isDue, type Prosedur, type ChecklistItem } from "@/lib/prosedur-data";

interface Props {
  prosedurler: Prosedur[];
  checklist: ChecklistItem[];
}

export default function ProsedurOzet({ prosedurler, checklist }: Props) {
  // Silinmiş kayıtları say dışı bırak — store soft-delete kullanır
  const aktifProsedurler  = prosedurler.filter(p => !p.silindi);
  const aktifChecklist    = checklist.filter(c => !c.silindi);

  const toplamProsedur    = aktifProsedurler.length;
  const guncellemeGerekli = aktifProsedurler.filter(p => prosedurDurumu(p.sonGuncelleme).gun >= 30).length;
  const bekleyen          = aktifChecklist.filter(c => isDue(c) && !c.otomatikKontrol).length;
  const uyariSayisi       = guncellemeGerekli + bekleyen;

  const kartlar = [
    {
      label: "Toplam Prosedür",
      value: String(toplamProsedur),
      alt:   "Aktif SOP belgesi",
      altRenk: "var(--text-secondary)" as string,
    },
    {
      label: "Bekleyen Kontrol",
      value: String(bekleyen),
      alt:   bekleyen > 0 ? "Yapılması gereken madde var" : "Tüm kontroller güncel",
      altRenk: (bekleyen === 0 ? "var(--color-success)" : bekleyen <= 3 ? "var(--leaf)" : "var(--color-danger)") as string,
    },
    {
      label: "Güncelleme Gerekli",
      value: String(guncellemeGerekli),
      alt:   guncellemeGerekli > 0 ? "30+ gün güncellenmedi" : "Tüm belgeler güncel",
      altRenk: (guncellemeGerekli > 0 ? "var(--color-danger)" : "var(--color-success)") as string,
    },
    {
      label: "Uyarı Var",
      value: String(uyariSayisi),
      alt:   uyariSayisi > 0 ? "Dikkat gerektiren madde" : "Sorun yok",
      altRenk: (uyariSayisi > 0 ? "var(--leaf)" : "var(--color-success)") as string,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {kartlar.map(({ label, value, alt, altRenk }, i) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07 }}
          className="stat-card"
        >
          <p className="label-caps mb-2">{label}</p>
          <p className="font-number font-semibold text-xl text-[#0F172A]">{value}</p>
          <p className="text-xs mt-1 font-medium" style={{ color: altRenk }}>{alt}</p>
        </motion.div>
      ))}
    </div>
  );
}
