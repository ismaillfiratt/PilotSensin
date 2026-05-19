"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useNakit }            from "@/store/nakit";
import { useKdvHavuzu, netKdvBakiye } from "@/store/kdvHavuzu";
import { formatTL } from "@/lib/para";
import RunwayKart  from "@/components/nakitAkisi/RunwayKart";
import IslemTablosu from "@/components/nakit/IslemTablosu";

const NakitGrafik           = dynamic(() => import("@/components/nakit/NakitGrafik"),                 { ssr: false });
const KategoriGrafik        = dynamic(() => import("@/components/nakit/KategoriGrafik"),               { ssr: false });
const NakitProjectionGrafik = dynamic(() => import("@/components/nakitAkisi/NakitProjectionGrafik"),   { ssr: false });
const PlanlananKalemler     = dynamic(() => import("@/components/nakitAkisi/PlanlananKalemler"),        { ssr: false });

interface StatCardProps {
  etiket: string;
  deger: string;
  altDeger?: string;
  altRenk?: string;
}

function StatCard({ etiket, deger, altDeger, altRenk }: StatCardProps) {
  return (
    <div className="stat-card">
      <p className="label-caps mb-2">{etiket}</p>
      <p className="font-number font-semibold text-xl text-[#0F172A]">{deger}</p>
      {altDeger && (
        <p className="text-xs mt-1 font-medium" style={{ color: altRenk ?? "var(--text-secondary)" }}>
          {altDeger}
        </p>
      )}
    </div>
  );
}

export default function NakitAkisiContent() {
  const params     = useSearchParams();
  const modalParam = params.get("modal") as "gelir" | "gider" | null;
  const { islemler }               = useNakit();
  const { kayitlar: kdvKayitlari } = useKdvHavuzu();

  const { netKurus, ayGelirKurus, ayGiderKurus } = useMemo(() => {
    const simdi  = new Date();
    const ayBasi = new Date(simdi.getFullYear(), simdi.getMonth(), 1);
    const aktif  = islemler.filter((x) => !x.silindi && new Date(x.tarih) >= ayBasi);
    const gelir  = aktif.filter((x) => x.tip === "gelir").reduce((s, x) => s + x.tutarKurus, 0);
    const gider  = aktif.filter((x) => x.tip === "gider").reduce((s, x) => s + x.tutarKurus, 0);
    return { netKurus: gelir - gider, ayGelirKurus: gelir, ayGiderKurus: gider };
  }, [islemler]);

  const kdvBakiyeKurus = useMemo(
    () => netKdvBakiye(kdvKayitlari.filter((x) => !x.silindi)),
    [kdvKayitlari]
  );

  const ay = new Date().toLocaleDateString("tr-TR", { month: "long", year: "numeric" }).toUpperCase();

  return (
    <div className="max-w-6xl mx-auto px-2">

      {/* 1. Hero */}
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
          Bu ay net
        </p>
      </section>

      <hr className="section-rule" />

      {/* 2. Stat strip — TEK YER */}
      <section className="py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            etiket="Bu ay gelir"
            deger={formatTL(ayGelirKurus)}
            altDeger="Toplam gelir"
            altRenk="var(--color-success)"
          />
          <StatCard
            etiket="Bu ay gider"
            deger={formatTL(ayGiderKurus)}
            altDeger="Toplam gider"
            altRenk="#C97676"
          />
          <StatCard
            etiket="Net akış"
            deger={(netKurus >= 0 ? "+" : "") + formatTL(netKurus)}
            altDeger={netKurus >= 0 ? "Pozitif" : "Negatif"}
            altRenk={netKurus >= 0 ? "var(--color-success)" : "#C97676"}
          />
          <StatCard
            etiket="KDV (bu ay)"
            deger={formatTL(Math.abs(kdvBakiyeKurus))}
            altDeger={kdvBakiyeKurus > 0 ? "Ödenecek" : kdvBakiyeKurus < 0 ? "Alacaklı" : "Dengede"}
            altRenk={kdvBakiyeKurus > 0 ? "#F59E0B" : "var(--color-success)"}
          />
        </div>
      </section>

      <hr className="section-rule" />

      {/* 3. Can suyu kartı */}
      <section className="py-2">
        <h2 className="text-sm font-semibold mb-4">Erken uyarı</h2>
        <RunwayKart />
      </section>

      <hr className="section-rule" />

      {/* 4. 30 günlük projeksiyon */}
      <section className="py-2">
        <h2 className="text-sm font-semibold mb-4">30 günlük projeksiyon</h2>
        <NakitProjectionGrafik />
      </section>

      <hr className="section-rule" />

      {/* 5. Planlanan kalemler */}
      <section className="py-2">
        <PlanlananKalemler />
      </section>

      <hr className="section-rule" />

      {/* 6. Nakit grafikleri */}
      <section className="py-2">
        <h2 className="text-sm font-semibold mb-4">Nakit akışı grafiği</h2>
        <div className="flex flex-col lg:flex-row gap-6">
          <NakitGrafik />
          <KategoriGrafik />
        </div>
      </section>

      <hr className="section-rule" />

      {/* 7. İşlemler tablosu */}
      <section className="py-2">
        <h2 className="text-sm font-semibold mb-4">İşlemler</h2>
        <IslemTablosu otomatikAcilModal={modalParam} />
      </section>

    </div>
  );
}
