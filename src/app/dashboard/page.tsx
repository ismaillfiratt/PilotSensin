"use client";

import HoseGeldinHero          from "@/components/dashboard/HoseGeldinHero";
import PilotSkorMini           from "@/components/dashboard/PilotSkorMini";
import StatStrip               from "@/components/dashboard/StatStrip";
import IlgiGerekliSection      from "@/components/dashboard/IlgiGerekliSection";
import BugunYapilacaklarSection from "@/components/dashboard/BugunYapilacaklarSection";
import NakitAkisiOzet          from "@/components/dashboard/NakitAkisiOzet";
import SonHareketler           from "@/components/dashboard/SonHareketler";
import ModuleHizliErisim       from "@/components/dashboard/ModuleHizliErisim";

export default function DashboardPage() {
  return (
    <div className="max-w-6xl mx-auto px-2">

      {/* Hero + Pilot Skoru yan yana */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6 lg:gap-10 items-start">
        <HoseGeldinHero />
        <PilotSkorMini />
      </div>

      <hr className="section-rule" />
      <StatStrip />
      <hr className="section-rule" />

      {/* İlgi gerekli + Bugün yapılacaklar yan yana */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
        <IlgiGerekliSection />
        <BugunYapilacaklarSection />
      </div>

      <hr className="section-rule" />
      <NakitAkisiOzet />
      <hr className="section-rule" />
      <SonHareketler />
      <hr className="section-rule" />
      <ModuleHizliErisim />

    </div>
  );
}
