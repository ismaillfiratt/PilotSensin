"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import ProfilAvatar from "@/components/profil/ProfilAvatar";
import KisiselBilgiler from "@/components/profil/KisiselBilgiler";
import IsletmeBilgileri from "@/components/profil/IsletmeBilgileri";

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
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="h-8 w-40 rounded-xl bg-[rgba(255,255,255,0.06)] animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-64 rounded-2xl bg-[rgba(255,255,255,0.04)] animate-pulse" />
          <div className="lg:col-span-2 space-y-6">
            <div className="h-48 rounded-2xl bg-[rgba(255,255,255,0.04)] animate-pulse" />
            <div className="h-56 rounded-2xl bg-[rgba(255,255,255,0.04)] animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Profilim</h1>
        <p className="text-sm text-[#94a3b8] mt-1">Kişisel ve işletme bilgilerini yönet</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol — Avatar */}
        <div className="lg:col-span-1">
          <ProfilAvatar ad={user.ad} soyad={user.soyad} email={user.email} />
        </div>

        {/* Sağ — Formlar */}
        <div className="lg:col-span-2 space-y-6">
          <KisiselBilgiler ad={user.ad} soyad={user.soyad} telefon={user.telefon} />
          <IsletmeBilgileri
            businessAd={user.businessAd}
            sektor={user.sektor}
            vergiNo={user.vergiNo}
            adres={user.adres}
          />
        </div>
      </div>
    </div>
  );
}
