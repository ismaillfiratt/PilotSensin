"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSirket } from "@/store/sirket";

const ONBOARDING_YOK = ["/onboarding", "/davet", "/giris", "/kayit", "/sifre-sifirla", "/auth", "/politikalar"];

export default function SirketProvider() {
  const { yukle, companyId, yuklendi } = useSirket();
  const router   = useRouter();
  const pathname = usePathname();

  useEffect(() => { yukle(); }, [yukle]);

  useEffect(() => {
    if (!yuklendi) return;
    const korumali = !ONBOARDING_YOK.some((p) => pathname.startsWith(p));
    if (korumali && !companyId) {
      router.replace("/onboarding");
    }
  }, [yuklendi, companyId, pathname, router]);

  return null;
}
