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
        background:   "var(--mint)",
        borderBottom: "1px solid var(--forest-200, #B3E8C8)",
      }}
    >
      <p style={{ color: "var(--leaf)" }}>
        <span className="font-semibold">Ücretsiz deneme süreniz:</span>{" "}
        {gun === 0
          ? "Bugün sona eriyor."
          : `${gun} gün kaldı.`}
      </p>
      <Link
        href="/fiyatlandirma"
        className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
        style={{
          background: "var(--leaf)",
          color:      "var(--forest)",
        }}
      >
        Pakete Geç
      </Link>
    </div>
  );
}
