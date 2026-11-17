"use client";

import { useSearchParams } from "next/navigation";
import AyarlarSidebar  from "@/components/ayarlar/AyarlarSidebar";
import BildirimPanel   from "@/components/ayarlar/panels/BildirimPanel";
import GorunumPanel    from "@/components/ayarlar/panels/GorunumPanel";
import SifrePanel      from "@/components/ayarlar/panels/SifrePanel";
import GuvenlikPanel   from "@/components/ayarlar/panels/GuvenlikPanel";
import VeriIndirPanel  from "@/components/ayarlar/panels/VeriIndirPanel";
import YasalPanel      from "@/components/ayarlar/panels/YasalPanel";
import SssPanel        from "@/components/ayarlar/panels/SssPanel";
import SurumPanel      from "@/components/ayarlar/panels/SurumPanel";
import TehlikePanel    from "@/components/ayarlar/panels/TehlikePanel";
import CopKutusuPanel  from "@/components/ayarlar/panels/CopKutusuPanel";
import IletisimPanel   from "@/components/ayarlar/panels/IletisimPanel";

type Tab =
  | "bildirim" | "gorunum" | "sifre" | "guvenlik"
  | "veri-indir" | "cop-kutusu" | "iletisim" | "yasal" | "sss" | "surum" | "tehlike";

const GECERLI_TABLER: Tab[] = [
  "bildirim", "gorunum", "sifre", "guvenlik",
  "veri-indir", "cop-kutusu", "iletisim", "yasal", "sss", "surum", "tehlike",
];

function gecerliTab(s: string | null): Tab {
  if (s && (GECERLI_TABLER as string[]).includes(s)) return s as Tab;
  return "bildirim";
}

const PANELLER: Record<Tab, React.ReactNode> = {
  bildirim:      <BildirimPanel />,
  gorunum:       <GorunumPanel />,
  sifre:         <SifrePanel />,
  guvenlik:      <GuvenlikPanel />,
  "veri-indir":  <VeriIndirPanel />,
  "cop-kutusu":  <CopKutusuPanel />,
  iletisim:      <IletisimPanel />,
  yasal:         <YasalPanel />,
  sss:           <SssPanel />,
  surum:         <SurumPanel />,
  tehlike:       <TehlikePanel />,
};

export default function AyarlarContent() {
  const params   = useSearchParams();
  const aktifTab = gecerliTab(params.get("tab"));

  return (
    <div className="max-w-6xl mx-auto px-2 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 items-start">
        <div className="lg:sticky lg:top-20">
          <AyarlarSidebar aktifTab={aktifTab} />
        </div>
        <div className="min-w-0">
          {PANELLER[aktifTab]}
        </div>
      </div>
    </div>
  );
}
