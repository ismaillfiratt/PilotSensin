"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams }    from "next/navigation";
import Link                              from "next/link";
import { createClient }                  from "@/utils/supabase/client";
import HoseGeldinHero          from "@/components/dashboard/HoseGeldinHero";
import PilotSkorMini           from "@/components/dashboard/PilotSkorMini";
import StatStrip               from "@/components/dashboard/StatStrip";
import IlgiGerekliSection      from "@/components/dashboard/IlgiGerekliSection";
import BugunYapilacaklarSection from "@/components/dashboard/BugunYapilacaklarSection";
import NakitAkisiOzet          from "@/components/dashboard/NakitAkisiOzet";
import ModuleHizliErisim       from "@/components/dashboard/ModuleHizliErisim";

function YeniSurumBanner() {
  const [surum,  setSurum]  = useState<{ id: string; version_string: string; baslik: string } | null>(null);
  const [goruldu, setGoruldu] = useState(false);

  useEffect(() => {
    (async () => {
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;
      const { data: latest } = await sb
        .from("app_versions").select("id,version_string,baslik")
        .eq("yayinlandi", true).order("release_date", { ascending: false }).limit(1).single();
      if (!latest) return;
      const { data: seen } = await sb
        .from("user_seen_versions").select("version_id").eq("version_id", latest.id).maybeSingle();
      if (!seen) setSurum(latest as { id: string; version_string: string; baslik: string });
    })();
  }, []);

  if (!surum || goruldu) return null;

  async function gordum() {
    if (!surum) return;
    setGoruldu(true);
    await createClient().from("user_seen_versions").insert({ version_id: surum.id });
  }

  return (
    <div className="mx-auto max-w-6xl px-2 pt-4">
      <div className="px-4 py-3 rounded-xl text-sm flex items-center justify-between gap-4"
        style={{ background: "rgba(250,250,250,0.06)", border: "0.5px solid rgba(250,250,250,0.10)", color: "var(--text-secondary)" }}>
        <span>
          🎉 Yeni sürüm: <strong>{surum.version_string}</strong> — {surum.baslik}.{" "}
          <Link href="/ayarlar?tab=surum" className="font-semibold underline hover:opacity-80">
            Yeniliklere göz at
          </Link>
        </span>
        <button onClick={gordum} className="shrink-0 text-xs opacity-60 hover:opacity-100 transition-opacity">Gördüm ✕</button>
      </div>
    </div>
  );
}

function MfaDeactiveBanner() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [goster, setGoster] = useState(false);

  useEffect(() => {
    if (searchParams.get("2fa-disabled") === "1") {
      setGoster(true);
      router.replace("/dashboard", { scroll: false });
      const t = setTimeout(() => setGoster(false), 5000);
      return () => clearTimeout(t);
    }
  }, [searchParams, router]);

  if (!goster) return null;

  return (
    <div className="mx-auto max-w-6xl px-2 pt-4">
      <div className="px-4 py-3 rounded-xl text-sm flex items-center justify-between gap-4"
        style={{ background: "rgba(245,158,11,0.1)", border: "0.5px solid rgba(245,158,11,0.3)", color: "#B45309" }}>
        <span>
          ⚠ Recovery code ile giriş yaptınız — 2FA devre dışı bırakıldı.{" "}
          <Link href="/profil?tab=guvenlik" className="font-semibold underline hover:opacity-80">
            Güvenlik sayfasından tekrar aktif edin
          </Link>
          .
        </span>
        <button onClick={() => setGoster(false)} className="shrink-0 text-xs opacity-60 hover:opacity-100">✕</button>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <>
      <Suspense><YeniSurumBanner /></Suspense>
      <Suspense>
        <MfaDeactiveBanner />
      </Suspense>
      <div className="max-w-6xl mx-auto px-2">

      {/* Hero + Pilot Skoru yan yana — dikey ortalı */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6 lg:gap-10 items-center min-h-[200px] py-2">
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
      <ModuleHizliErisim />

      </div>
    </>
  );
}
