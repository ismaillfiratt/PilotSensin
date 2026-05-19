"use client";

import { useMemo, useEffect, useState } from "react";
import { useNakit } from "@/store/nakit";
import { formatTL } from "@/lib/para";
import { trGunBaslangici } from "@/lib/tarih";
import { createClient } from "@/utils/supabase/client";

export default function HoseGeldinHero() {
  const { islemler } = useNakit();
  const [ad, setAd] = useState<string>("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      const m = data.user.user_metadata ?? {};
      setAd(m.ad || data.user.email?.split("@")[0] || "");
    });
  }, []);

  const aktif = useMemo(() => islemler.filter((x) => !x.silindi), [islemler]);

  const kasaBakiyeKurus = useMemo(
    () => aktif.reduce((s, x) => s + (x.tip === "gelir" ? x.tutarKurus : -x.tutarKurus), 0),
    [aktif]
  );

  const { bugunDeltaKurus, bugunIslemSayisi } = useMemo(() => {
    const gunBasi = trGunBaslangici();
    const bugun = aktif.filter((x) => new Date(x.tarih) >= gunBasi);
    const delta = bugun.reduce((s, x) => s + (x.tip === "gelir" ? x.tutarKurus : -x.tutarKurus), 0);
    return { bugunDeltaKurus: delta, bugunIslemSayisi: bugun.length };
  }, [aktif]);

  const tarih = new Date().toLocaleDateString("tr-TR", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <section className="space-y-2 py-6">
      <p className="label-caps">
        {ad ? `HOŞ GELDİN, ${ad.toUpperCase()} · ` : ""}{tarih}
      </p>
      <div className="flex items-baseline gap-3">
        <span className="hero-number">{formatTL(kasaBakiyeKurus)}</span>
      </div>
      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
        Kasa bakiyesi
        {bugunDeltaKurus > 0 && (
          <> · <span className="font-medium" style={{ color: "var(--color-success)" }}>
            +{formatTL(bugunDeltaKurus)} bugün
          </span></>
        )}
        {bugunDeltaKurus < 0 && (
          <> · <span className="font-medium" style={{ color: "var(--color-danger)" }}>
            {formatTL(bugunDeltaKurus)} bugün
          </span></>
        )}
        {bugunIslemSayisi > 0 && <> · {bugunIslemSayisi} işlem</>}
      </p>
    </section>
  );
}
