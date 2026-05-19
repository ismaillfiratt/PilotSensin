"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useStok } from "@/store/stok";
import { stokDurumu } from "@/lib/stok-data";
import StokOzet          from "@/components/stok/StokOzet";
import StokTablosu       from "@/components/stok/StokTablosu";
import StokDegerTablosu  from "@/components/stok/StokDegerTablosu";
import KdvYonetimBolumu  from "@/components/stok/KdvYonetimBolumu";

export default function StokContent() {
  const params     = useSearchParams();
  const modalParam = params.get("modal");
  const { urunler } = useStok();

  const aktif     = useMemo(() => urunler.filter((u) => !u.silindi), [urunler]);
  const kategoriler = useMemo(() => new Set(aktif.map((u) => u.kategori)).size, [aktif]);
  const kritikSayisi = useMemo(() => aktif.filter((u) => stokDurumu(u) === "kritik").length, [aktif]);

  return (
    <div className="max-w-6xl mx-auto px-2">
      {/* Hero */}
      <section className="space-y-2 py-6">
        <p className="label-caps">STOK · {aktif.length} ÜRÜN · {kategoriler} KATEGORİ</p>
        <div className="flex items-baseline gap-3">
          <span className="hero-number">{aktif.length}</span>
          <span className="text-lg text-gray-400">ürün</span>
        </div>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Toplam envanter
          {kritikSayisi > 0 && (
            <> · <span className="font-medium" style={{ color: "var(--color-danger)" }}>
              {kritikSayisi} kritik seviyede
            </span></>
          )}
        </p>
      </section>

      <hr className="section-rule" />
      <StokOzet />
      <hr className="section-rule" />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Ürünler</h2>
        <StokTablosu otomatikAcilModal={modalParam === "urun-ekle"} />
      </section>

      <hr className="section-rule" />
      <StokDegerTablosu />
      <hr className="section-rule" />
      <KdvYonetimBolumu />
    </div>
  );
}
