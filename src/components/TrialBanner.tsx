"use client";

import Link from "next/link";
import { useSirket, trialGunKaldi, trialAktif } from "@/store/sirket";

export default function TrialBanner() {
  const isPremium   = useSirket((s) => s.isPremium);
  const trialEndsAt = useSirket((s) => s.trialEndsAt);
  const yuklendi    = useSirket((s) => s.yuklendi);

  if (!yuklendi) return null;
  if (!trialAktif(isPremium, trialEndsAt)) return null;
  if (isPremium) return null;

  const gun = trialGunKaldi(trialEndsAt);

  return (
    <div
      className="w-full px-4 py-2.5 flex items-center justify-between gap-4 text-sm"
      style={{
        background:   "rgba(251,192,36,0.10)",
        borderBottom: "1px solid rgba(251,192,36,0.25)",
      }}
    >
      <p style={{ color: "#fbc024" }}>
        <span className="font-semibold">Ücretsiz deneme süreniz:</span>{" "}
        {gun === 0
          ? "Bugün sona eriyor."
          : `${gun} gün kaldı.`}
      </p>
      <Link
        href="/fiyatlandirma"
        className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
        style={{
          background: "#fbc024",
          color:      "#0e172a",
        }}
      >
        Pakete Geç
      </Link>
    </div>
  );
}
