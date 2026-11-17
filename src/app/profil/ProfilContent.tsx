"use client";

import { useSearchParams } from "next/navigation";
import ProfilSidebar from "@/components/profil/ProfilSidebar";
import KisiselPanel  from "@/components/profil/panels/KisiselPanel";
import GuvenlikPanel from "@/components/profil/panels/GuvenlikPanel";
import IsletmePanel  from "@/components/profil/panels/IsletmePanel";
import AbonelikPanel from "@/components/profil/panels/AbonelikPanel";
import AktivitePanel from "@/components/profil/panels/AktivitePanel";

type Tab = "kisisel" | "guvenlik" | "isletme" | "abonelik" | "aktivite";

const PANELLER: Record<Tab, React.ReactNode> = {
  kisisel:  <KisiselPanel />,
  guvenlik: <GuvenlikPanel />,
  isletme:  <IsletmePanel />,
  abonelik: <AbonelikPanel />,
  aktivite: <AktivitePanel />,
};

const GECERLI_TABLAR = new Set<Tab>(["kisisel", "guvenlik", "isletme", "abonelik", "aktivite"]);

function gecerliTab(s: string | null): Tab {
  if (s && GECERLI_TABLAR.has(s as Tab)) return s as Tab;
  return "kisisel";
}

export default function ProfilContent() {
  const params    = useSearchParams();
  const aktifTab  = gecerliTab(params.get("tab"));

  return (
    <div className="max-w-6xl mx-auto px-2 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 items-start">
        {/* Sidebar — mobile'da üstte, desktop'ta solda sticky */}
        <div className="lg:sticky lg:top-20">
          <ProfilSidebar aktifTab={aktifTab} />
        </div>

        {/* Panel */}
        <div className="min-w-0">
          {PANELLER[aktifTab]}
        </div>
      </div>
    </div>
  );
}
