"use client";

import { useMemo } from "react";
import { useNakit } from "@/store/nakit";
import { useStok } from "@/store/stok";
import { useKdvHavuzu, netKdvBakiye } from "@/store/kdvHavuzu";
import { formatTL } from "@/lib/para";
import { trGunBaslangici, trGunSonu } from "@/lib/tarih";
import { stokDurumu } from "@/lib/stok-data";
import { cn } from "@/lib/utils";

interface StatCardProps {
  etiket: string;
  deger: string;
  altDeger?: string;
  altRenk?: "success" | "danger" | "warning" | "default";
}

function StatCard({ etiket, deger, altDeger, altRenk = "default" }: StatCardProps) {
  const renkSinif = {
    success: "text-emerald-600",
    danger:  "text-red-500",
    warning: "text-amber-500",
    default: "text-gray-400",
  }[altRenk];

  return (
    <div className="stat-card">
      <p className="label-caps mb-2">{etiket}</p>
      <p className="font-number font-semibold text-xl" style={{ color: "var(--text-primary)" }}>
        {deger}
      </p>
      {altDeger && (
        <p className={cn("text-xs mt-1 font-medium", renkSinif)}>{altDeger}</p>
      )}
    </div>
  );
}

export default function StatStrip() {
  const { islemler }               = useNakit();
  const { urunler }                = useStok();
  const { kayitlar: kdvKayitlari } = useKdvHavuzu();

  const { bugunCiroKurus, oncekiGunCiroKurus } = useMemo(() => {
    const gunBasi  = trGunBaslangici();
    const gunSonu  = trGunSonu();
    const onceki   = trGunBaslangici(new Date(gunBasi.getTime() - 86400000).toISOString());
    const oncekiS  = trGunSonu(new Date(gunBasi.getTime() - 86400000).toISOString());

    const aktif = islemler.filter((x) => !x.silindi);
    const bugunGelir  = aktif.filter((x) => x.tip === "gelir" && new Date(x.tarih) >= gunBasi && new Date(x.tarih) <= gunSonu);
    const oncekiGelir = aktif.filter((x) => x.tip === "gelir" && new Date(x.tarih) >= onceki   && new Date(x.tarih) <= oncekiS);

    return {
      bugunCiroKurus:    bugunGelir.reduce((s, x) => s + x.tutarKurus, 0),
      oncekiGunCiroKurus: oncekiGelir.reduce((s, x) => s + x.tutarKurus, 0),
    };
  }, [islemler]);

  const bugunYuzde = useMemo(() => {
    if (oncekiGunCiroKurus === 0) return null;
    const oran = ((bugunCiroKurus - oncekiGunCiroKurus) / oncekiGunCiroKurus) * 100;
    return Math.round(oran);
  }, [bugunCiroKurus, oncekiGunCiroKurus]);

  const { aylikNetKarKurus, netMarjYuzde } = useMemo(() => {
    const simdi  = new Date();
    const ayBasi = new Date(simdi.getFullYear(), simdi.getMonth(), 1);

    const aktif = islemler.filter((x) => !x.silindi && new Date(x.tarih) >= ayBasi);
    const ayGelir = aktif.filter((x) => x.tip === "gelir").reduce((s, x) => s + x.tutarKurus, 0);
    const ayGider = aktif.filter((x) => x.tip === "gider").reduce((s, x) => s + x.tutarKurus, 0);
    const netKar  = ayGelir - ayGider;
    const marj    = ayGelir > 0 ? Math.round((netKar / ayGelir) * 100) : 0;

    return { aylikNetKarKurus: netKar, netMarjYuzde: marj };
  }, [islemler]);

  const kritikStokSayisi = useMemo(
    () => urunler.filter((u) => !u.silindi && stokDurumu(u) === "kritik").length,
    [urunler]
  );

  const kdvBakiyeKurus = useMemo(
    () => netKdvBakiye(kdvKayitlari.filter((x) => !x.silindi)),
    [kdvKayitlari]
  );

  return (
    <section className="py-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          etiket="Bugünkü ciro"
          deger={formatTL(bugunCiroKurus)}
          altDeger={bugunYuzde !== null ? `${bugunYuzde >= 0 ? "↑" : "↓"} %${Math.abs(bugunYuzde)} dünden` : undefined}
          altRenk={bugunYuzde !== null ? (bugunYuzde >= 0 ? "success" : "danger") : "default"}
        />
        <StatCard
          etiket="Aylık net kâr"
          deger={formatTL(aylikNetKarKurus)}
          altDeger={`Net marj %${netMarjYuzde}`}
          altRenk={aylikNetKarKurus >= 0 ? "success" : "danger"}
        />
        <StatCard
          etiket="Kritik stok"
          deger={String(kritikStokSayisi)}
          altDeger={kritikStokSayisi > 0 ? "İlgi gerekli" : "Stok temiz"}
          altRenk={kritikStokSayisi > 0 ? "danger" : "success"}
        />
        <StatCard
          etiket="KDV (bu ay)"
          deger={formatTL(Math.abs(kdvBakiyeKurus))}
          altDeger={kdvBakiyeKurus > 0 ? "Ödenecek" : kdvBakiyeKurus < 0 ? "Alacaklı" : "Dengede"}
          altRenk={kdvBakiyeKurus > 0 ? "warning" : "success"}
        />
      </div>
    </section>
  );
}
