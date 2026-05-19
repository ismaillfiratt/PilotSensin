"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useNakit } from "@/store/nakit";
import { formatTL } from "@/lib/para";
import NakitOzet          from "@/components/nakit/NakitOzet";
import RunwayKart         from "@/components/nakitAkisi/RunwayKart";
import IslemTablosu       from "@/components/nakit/IslemTablosu";

const NakitGrafik           = dynamic(() => import("@/components/nakit/NakitGrafik"),                 { ssr: false });
const KategoriGrafik        = dynamic(() => import("@/components/nakit/KategoriGrafik"),               { ssr: false });
const NakitProjectionGrafik = dynamic(() => import("@/components/nakitAkisi/NakitProjectionGrafik"),   { ssr: false });
const PlanlananKalemler     = dynamic(() => import("@/components/nakitAkisi/PlanlananKalemler"),        { ssr: false });

export default function NakitAkisiContent() {
  const params     = useSearchParams();
  const modalParam = params.get("modal") as "gelir" | "gider" | null;
  const { islemler } = useNakit();

  const { netKurus, ayGelirKurus, ayGiderKurus } = useMemo(() => {
    const simdi  = new Date();
    const ayBasi = new Date(simdi.getFullYear(), simdi.getMonth(), 1);
    const aktif  = islemler.filter((x) => !x.silindi && new Date(x.tarih) >= ayBasi);
    const gelir  = aktif.filter((x) => x.tip === "gelir").reduce((s, x) => s + x.tutarKurus, 0);
    const gider  = aktif.filter((x) => x.tip === "gider").reduce((s, x) => s + x.tutarKurus, 0);
    return { netKurus: gelir - gider, ayGelirKurus: gelir, ayGiderKurus: gider };
  }, [islemler]);

  const ay = new Date().toLocaleDateString("tr-TR", { month: "long", year: "numeric" }).toUpperCase();

  return (
    <div className="max-w-6xl mx-auto px-2">
      {/* Hero */}
      <section className="space-y-2 py-6">
        <p className="label-caps">NAKİT AKIŞI · {ay}</p>
        <div className="flex items-baseline gap-3">
          <span
            className="hero-number"
            style={{ color: netKurus >= 0 ? "var(--forest)" : "var(--color-danger)" }}
          >
            {netKurus >= 0 ? "+" : ""}{formatTL(netKurus)}
          </span>
        </div>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Bu ay net · <span style={{ color: "var(--color-success)" }}>Gelir {formatTL(ayGelirKurus)}</span>
          {" · "}
          <span style={{ color: "#C97676" }}>Gider {formatTL(ayGiderKurus)}</span>
        </p>
      </section>

      <hr className="section-rule" />

      {/* Erken Uyarı */}
      <section className="space-y-4 py-2">
        <h2 className="text-sm font-semibold">Erken uyarı</h2>
        <RunwayKart />
        <NakitProjectionGrafik />
        <PlanlananKalemler />
      </section>

      <hr className="section-rule" />

      {/* Mevcut durum */}
      <section className="space-y-4 py-2">
        <h2 className="text-sm font-semibold">Mevcut nakit durumu</h2>
        <NakitOzet />
      </section>

      <div className="flex flex-col lg:flex-row gap-6 py-2">
        <NakitGrafik />
        <KategoriGrafik />
      </div>

      <hr className="section-rule" />

      {/* İşlemler */}
      <section className="space-y-3 py-2">
        <h2 className="text-sm font-semibold">İşlemler</h2>
        <IslemTablosu otomatikAcilModal={modalParam} />
      </section>
    </div>
  );
}
