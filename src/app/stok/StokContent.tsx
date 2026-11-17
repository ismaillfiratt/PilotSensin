"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useStok } from "@/store/stok";
import { stokDurumu } from "@/lib/stok-data";
import { stokSkoru } from "@/lib/pilot-score";
import StokOzet                from "@/components/stok/StokOzet";
import StokTablosu             from "@/components/stok/StokTablosu";
import StokDegerTablosu        from "@/components/stok/StokDegerTablosu";
import KdvYonetimBolumu        from "@/components/stok/KdvYonetimBolumu";
import UrunMarjAnaliziSection  from "@/components/stok/UrunMarjAnaliziSection";

function StokSkorBadge({ skor, durum }: { skor: number; durum: "ok" | "warning" | "critical" }) {
  const renk   = durum === "ok" ? "#10B981" : durum === "warning" ? "#F59E0B" : "#EF4444";
  const etiket = durum === "ok" ? "İyi"     : durum === "warning" ? "Dikkat"  : "Kritik";
  const radius = 30;
  const circ   = 2 * Math.PI * radius;
  const offset = circ - (skor / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-1.5 shrink-0">
      <div className="relative w-20 h-20">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 70 70">
          <circle cx="35" cy="35" r={radius} fill="none" stroke="#F3F4F6" strokeWidth="6" />
          <motion.circle
            cx="35" cy="35" r={radius} fill="none"
            stroke={renk} strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-number font-bold text-base" style={{ color: renk }}>%{skor}</span>
        </div>
      </div>
      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
        style={{ color: renk, background: `${renk}15`, border: `1px solid ${renk}30` }}>
        {etiket}
      </span>
    </div>
  );
}

export default function StokContent() {
  const params     = useSearchParams();
  const modalParam = params.get("modal");
  const { urunler } = useStok();

  const aktif        = useMemo(() => urunler.filter((u) => !u.silindi), [urunler]);
  const kategoriler  = useMemo(() => new Set(aktif.map((u) => u.kategori)).size, [aktif]);
  const kritikSayisi = useMemo(() => aktif.filter((u) => stokDurumu(u) === "kritik").length, [aktif]);
  const skor         = useMemo(() => stokSkoru(aktif), [aktif]);

  // Toplam stok değeri (adet × birim maliyet, kuruş cinsinden)
  const toplamStokKurus = useMemo(
    () => aktif.reduce((toplam, u) => toplam + u.mevcutAdet * (u.birimMaliyetKurus ?? 0), 0),
    [aktif]
  );
  const toplamStokTL = (toplamStokKurus / 100).toLocaleString("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  });

  return (
    <div className="max-w-6xl mx-auto px-2">

      {/* Hero */}
      <section className="py-6">
        <div className="flex items-start justify-between gap-6">
          <div className="space-y-2">
            <p className="label-caps">STOK · TOPLAM ENVANTER DEĞERİ</p>
            <div className="flex items-baseline gap-3">
              <span className="hero-number" style={{ color: "var(--text-primary)" }}>{toplamStokTL}</span>
            </div>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {aktif.length} ürün · {kategoriler} kategori
              {kritikSayisi > 0 && (
                <> · <span className="font-medium" style={{ color: "var(--color-danger)" }}>
                  {kritikSayisi} kritik seviyede
                </span></>
              )}
            </p>
          </div>
          <StokSkorBadge skor={skor.skor} durum={skor.durum} />
        </div>
      </section>

      <hr className="section-rule" />
      <StokOzet />
      <hr className="section-rule" />

      <section className="space-y-3 py-2">
        <h2 className="text-sm font-semibold">Ürünler</h2>
        <StokTablosu otomatikAcilModal={modalParam === "urun-ekle"} />
      </section>

      <hr className="section-rule" />
      <UrunMarjAnaliziSection />
      <hr className="section-rule" />
      <StokDegerTablosu />
      <hr className="section-rule" />
      <KdvYonetimBolumu />

    </div>
  );
}
