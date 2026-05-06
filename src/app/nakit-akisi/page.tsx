"use client";

import { useSearchParams } from "next/navigation";
import NakitOzet from "@/components/nakit/NakitOzet";
import NakitGrafik from "@/components/nakit/NakitGrafik";
import KategoriGrafik from "@/components/nakit/KategoriGrafik";
import IslemTablosu from "@/components/nakit/IslemTablosu";

export default function NakitAkisiPage() {
  const params   = useSearchParams();
  const modalParam = params.get("modal") as "gelir" | "gider" | null;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Nakit Akışı</h1>
        <p className="text-sm text-[#94a3b8] mt-1">
          Gelir ve giderlerini takip et, nakit durumunu anlık gör
        </p>
      </div>

      <NakitOzet />

      <div className="flex flex-col lg:flex-row gap-6">
        <NakitGrafik />
        <KategoriGrafik />
      </div>

      <div>
        <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-widest mb-4">
          İşlemler
        </h2>
        <IslemTablosu otomatikAcilModal={modalParam} />
      </div>
    </div>
  );
}
