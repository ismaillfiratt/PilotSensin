"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSirket } from "@/store/sirket";
import { MODULLER } from "@/lib/permissions";

const ONBOARDING_YOK = [
  "/onboarding", "/davet", "/giris", "/kayit",
  "/sifre-sifirla", "/auth", "/politikalar",
];

// Co-Pilot erişemez (client-side koruma)
const SADECE_PILOT = ["/nakit-akisi", "/kar-zarar", "/acil-fon", "/ekip"];

export default function SirketProvider() {
  const { yukle, companyId, rol, permissions, yuklendi } = useSirket();
  const router   = useRouter();
  const pathname = usePathname();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { yukle(); }, [yukle]);

  useEffect(() => {
    if (!yuklendi) return;

    const korumali = !ONBOARDING_YOK.some((p) => pathname.startsWith(p));
    if (!korumali) return;

    if (!companyId) {
      // companyId yoksa 1.5sn bekle — davet kabul sonrası DB yayılımı için
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        await yukle();
        if (!useSirket.getState().companyId) {
          router.replace("/onboarding");
        }
      }, 1500);
      return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }

    // Co-Pilot route koruması + dashboard erişim yoksa ilk izinli modüle yönlendir
    if (rol && rol !== "pilot" && permissions) {
      const modul = pathname.split("/")[1];

      // Dashboard'a erişim yoksa → ilk izinli modüle git
      if (pathname === "/dashboard" && !permissions.modules["dashboard"]) {
        const ilkModul = MODULLER.find((m) => permissions.modules[m.key]);
        router.replace(ilkModul ? `/${ilkModul.key}` : "/bildirimler");
        return;
      }

      // Diğer kısıtlı rotalar
      const kısıtlı = SADECE_PILOT.some((r) => pathname.startsWith(r));
      const izinli  = permissions.modules[modul as keyof typeof permissions.modules];
      if (kısıtlı || izinli === false) {
        const ilkModul = MODULLER.find((m) => permissions.modules[m.key]);
        router.replace(ilkModul ? `/${ilkModul.key}` : "/bildirimler");
      }
    }
  }, [yuklendi, companyId, rol, permissions, pathname, router, yukle]);

  return null;
}
