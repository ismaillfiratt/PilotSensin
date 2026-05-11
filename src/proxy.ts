import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/middleware";

const KORUMASIZ_ROTALAR = [
  "/giris", "/kayit", "/sifre-sifirla", "/auth/callback",
  "/onboarding", "/davet", "/politikalar",
];

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

  // Dashboard ve alt sayfalar için permission kontrolü
  const routeModule = pathname.split("/")[1]; // "nakit-akisi", "stok" vb.
  if (routeModule && routeModule !== "api" && routeModule !== "_next") {
    const { data: member } = await supabase
      .from("company_members")
      .select("role, permissions, status")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (!member) {
      // Şirketi yok → onboarding
      if (pathname !== "/onboarding") {
        return NextResponse.redirect(new URL("/onboarding", request.url));
      }
      return supabaseResponse;
    }

    // Pilot her şeye erişebilir
    if (member.role === "pilot") return supabaseResponse;

    // Diğer roller: permissions kontrolü
    const perms = member.permissions as { modules?: Record<string, boolean> } | null;
    if (perms?.modules && perms.modules[routeModule] === false) {
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
