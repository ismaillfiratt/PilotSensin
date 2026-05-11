"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSirket } from "@/store/sirket";

const ONBOARDING_YOK = [
  "/onboarding", "/davet", "/giris", "/kayit",
  "/sifre-sifirla", "/auth", "/politikalar",
];

export default function SirketProvider() {
  const { yukle, companyId, yuklendi } = useSirket();
  const router    = useRouter();
  const pathname  = usePathname();
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { yukle(); }, [yukle]);

  useEffect(() => {
    if (!yuklendi) return;

    const korumali = !ONBOARDING_YOK.some((p) => pathname.startsWith(p));
    if (!korumali) return;

    if (companyId) {
      // companyId varsa bekleyen timer'ı iptal et
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    // companyId yoksa 1.2sn bekle — davet kabul sonrası DB yayılımı için
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      // Son bir kez daha dene
      await yukle();
      if (!useSirket.getState().companyId) {
        router.replace("/onboarding");
      }
    }, 1200);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [yuklendi, companyId, pathname, router, yukle]);

  return null;
}
