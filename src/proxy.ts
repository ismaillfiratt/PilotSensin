import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/middleware";

const KORUMASIZ_ROTALAR = [
  "/giris", "/kayit", "/sifre-sifirla", "/auth/callback",
  "/onboarding", "/davet", "/politikalar",
];

// Sadece auth kontrolü — company/role kontrolü SirketProvider'a bırakıldı
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
