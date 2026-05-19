"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import NakitOzet          from "@/components/nakit/NakitOzet";
import RunwayKart         from "@/components/nakitAkisi/RunwayKart";
import IslemTablosu       from "@/components/nakit/IslemTablosu";

const NakitGrafik          = dynamic(() => import("@/components/nakit/NakitGrafik"),                    { ssr: false });
const KategoriGrafik       = dynamic(() => import("@/components/nakit/KategoriGrafik"),                 { ssr: false });
const NakitProjectionGrafik = dynamic(() => import("@/components/nakitAkisi/NakitProjectionGrafik"),    { ssr: false });
const PlanlananKalemler    = dynamic(() => import("@/components/nakitAkisi/PlanlananKalemler"),          { ssr: false });

export default function NakitAkisiContent() {
  const params     = useSearchParams();
  const modalParam = params.get("modal") as "gelir" | "gider" | null;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">Nakit Akışı</h1>
        <p className="text-xs md:text-sm text-gray-400 mt-1">
          Gelir ve giderlerini takip et · 30 günlük projeksiyon ve erken uyarı analizi
        </p>
      </div>

      {/* ─── BÖLÜM 1: Erken Uyarı (Runway + Projeksiyon) ─── */}
      <RunwayKart />
      <NakitProjectionGrafik />
      <PlanlananKalemler />

      {/* ─── BÖLÜM 2: Mevcut Durum ─── */}
      <div className="pt-2">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
          Mevcut Nakit Durumu
        </h2>
        <NakitOzet />
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <NakitGrafik />
        <KategoriGrafik />
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
          İşlemler
        </h2>
        <IslemTablosu otomatikAcilModal={modalParam} />
      </div>
    </div>
  );
}
