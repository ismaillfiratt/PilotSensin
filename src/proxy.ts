import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/middleware";

const KORUMASIZ_ROTALAR = [
  "/giris", "/kayit", "/sifre-sifirla", "/auth/callback",
  "/onboarding", "/davet", "/politikalar",
];

// Co-Pilot'un erişemeyeceği finansal rotalar
const SADECE_PILOT = ["/nakit-akisi", "/kar-zarar", "/acil-fon", "/ekip"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (KORUMASIZ_ROTALAR.some((r) => pathname.startsWith(r))) {
    return NextResponse.next({ request: { headers: request.headers } });
  }

  const { supabase, supabaseResponse } = createClient(request);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const girisUrl = new URL("/giris", request.url);
    girisUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(girisUrl);
  }

  // Co-Pilot RBAC — sadece kısıtlı rotalarda kontrol et
  if (SADECE_PILOT.some((r) => pathname.startsWith(r))) {
    const { data: member } = await supabase
      .from("company_members")
      .select("role")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (member?.role === "copilot") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/nakit-akisi/:path*",
    "/kar-zarar/:path*",
    "/stok/:path*",
    "/gorevler/:path*",
    "/prosedurler/:path*",
    "/acil-fon/:path*",
    "/ekip/:path*",
    "/ekip",
    "/profil/:path*",
    "/profil",
    "/ayarlar/:path*",
    "/ayarlar",
    "/bildirimler/:path*",
    "/bildirimler",
  ],
};
