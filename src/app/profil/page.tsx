"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import ProfilAvatar from "@/components/profil/ProfilAvatar";
import KisiselBilgiler from "@/components/profil/KisiselBilgiler";
import IsletmeBilgileri from "@/components/profil/IsletmeBilgileri";
import { useSirket } from "@/store/sirket";

interface UserMeta {
  ad: string;
  soyad: string;
  telefon: string;
  businessAd: string;
  sektor: string;
  vergiNo: string;
  adres: string;
  email: string;
}

export default function ProfilPage() {
  const [user, setUser] = useState<UserMeta | null>(null);
  const { rol, sirketAdi } = useSirket();
  const isPilot = rol === "pilot" || !rol;

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      const m = data.user.user_metadata ?? {};
      setUser({
        ad:         m.ad         ?? "",
        soyad:      m.soyad      ?? "",
        telefon:    m.telefon    ?? "",
        businessAd: m.businessAd ?? "",
        sektor:     m.sektor     ?? "",
        vergiNo:    m.vergiNo    ?? "",
        adres:      m.adres      ?? "",
        email:      data.user.email ?? "",
      });
    });
  }, []);

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-2 space-y-6">
        <div className="h-8 w-40 rounded-xl bg-gray-50 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-64 rounded-2xl bg-gray-50 animate-pulse" />
          <div className="lg:col-span-2 space-y-6">
            <div className="h-48 rounded-2xl bg-gray-50 animate-pulse" />
            {isPilot && <div className="h-56 rounded-2xl bg-gray-50 animate-pulse" />}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-2">
      {/* Hero */}
      <section className="space-y-2 py-6">
        <p className="label-caps">PROFİL</p>
        <h1 className="hero-number" style={{ fontSize: "2.5rem" }}>
          {user.ad || user.email.split("@")[0]}
        </h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {isPilot ? "Pilot · İşletme sahibi" : `${sirketAdi} ekibinin üyesi`}
        </p>
      </section>

      <hr className="section-rule" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ProfilAvatar ad={user.ad} soyad={user.soyad} email={user.email} />
        </div>
        <div className="lg:col-span-2 space-y-6">
          <KisiselBilgiler ad={user.ad} soyad={user.soyad} telefon={user.telefon} />
          {/* İşletme bilgileri sadece pilota gösterilir */}
          {isPilot && (
            <IsletmeBilgileri
              businessAd={user.businessAd}
              sektor={user.sektor}
              vergiNo={user.vergiNo}
              adres={user.adres}
            />
          )}
        </div>
      </div>
    </div>
  );
}
