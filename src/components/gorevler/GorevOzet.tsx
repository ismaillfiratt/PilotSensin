"use client";

import { motion } from "framer-motion";
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
    {
      label: "Toplam Görev",
      value: String(toplam),
      alt:   "Aktif + tamamlanan",
      altRenk: "var(--text-secondary)" as string,
    },
    {
      label: "Geciken Görev",
      value: String(geciken),
      alt:   geciken > 0 ? "Hemen ilgilenin" : "Harika, temiz!",
      altRenk: geciken > 0 ? "var(--color-danger)" : "var(--color-success)" as string,
    },
    {
      label: "Bu Hafta Bitiyor",
      value: String(buHafta),
      alt:   "7 gün içinde son tarih",
      altRenk: buHafta > 0 ? "var(--leaf)" : "var(--text-secondary)" as string,
    },
    {
      label: "Tamamlanma",
      value: `%${tamamOran}`,
      alt:   `${tamamlandi} / ${toplam} görev`,
      altRenk: tamamOran >= 70 ? "var(--color-success)" : tamamOran >= 40 ? "var(--leaf)" : "var(--color-danger)" as string,
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
