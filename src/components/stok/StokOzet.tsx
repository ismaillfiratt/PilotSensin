"use client";

import { motion } from "framer-motion";
import { stokDurumu } from "@/lib/stok-data";
import { useStok } from "@/store/stok";

export default function StokOzet() {
  const { urunler } = useStok();
  const aktif    = urunler.filter((u) => !u.silindi);
  const kritikler = aktif.filter((u) => stokDurumu(u) === "kritik");
  const uyarilar  = aktif.filter((u) => stokDurumu(u) === "uyari");
  const oluStok   = aktif.filter((u) => stokDurumu(u) === "olu");

  const stats = [
    { label: "Toplam Ürün",     value: aktif.length,      altRenk: "var(--text-secondary)" },
    { label: "Kritik Stok",     value: kritikler.length,  altRenk: kritikler.length  > 0 ? "var(--color-danger)"  : "var(--color-success)" },
    { label: "Uyarı Seviyesi",  value: uyarilar.length,   altRenk: uyarilar.length   > 0 ? "#d4a373"              : "var(--color-success)" },
    { label: "Ölü Stok (90g+)", value: oluStok.length,    altRenk: oluStok.length    > 0 ? "var(--text-secondary)": "var(--color-success)" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map(({ label, value, altRenk }, i) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07 }}
          className="stat-card"
        >
          <p className="label-caps mb-2">{label}</p>
          <p className="font-number font-semibold text-xl" style={{ color: "var(--text-primary)" }}>{value}</p>
          <p className="text-xs mt-1 font-medium" style={{ color: altRenk }}>
            {value === 0
              ? label === "Toplam Ürün" ? "Ürün girilmedi" : "Sorun yok"
              : label === "Kritik Stok" ? "Acil sipariş gerekli"
              : label === "Uyarı Seviyesi" ? "Sipariş planlayın"
              : "Hareketsiz ürün"}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
