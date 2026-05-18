import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/middleware";

const KORUMASIZ_ROTALAR = [
  "/giris", "/kayit", "/sifre-sifirla", "/auth/callback",
  "/onboarding", "/davet", "/politikalar", "/fiyatlandirma",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // "/" landing page — herkese açık
  if (pathname === "/") return NextResponse.next({ request: { headers: request.headers } });

  if (KORUMASIZ_ROTALAR.some((r) => pathname.startsWith(r))) {
    return NextResponse.next({ request: { headers: request.headers } });
  }

  const { supabase, supabaseResponse } = createClient(request);
  const { data: { user } } = await supabase.auth.getUser();

  // ── Giriş yapılmamış → /giris ────────────────────────────────────────────
  if (!user) {
    const girisUrl = new URL("/giris", request.url);
    girisUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(girisUrl);
  }

  // ── /admin rotaları: sunucu taraflı system_admin kontrolü ─────────────────
  if (pathname.startsWith("/admin")) {
    const { data: profil } = await supabase
      .from("profiles")
      .select("system_admin")
      .eq("id", user.id)
      .maybeSingle();

    if (!profil?.system_admin) {
      const url = new URL("/giris", request.url);
      url.searchParams.set("erisim", "reddedildi");
      return NextResponse.redirect(url);
    }

    return supabaseResponse;
  }

  // ── Deneme / abonelik kontrolü ────────────────────────────────────────────
  // Try-catch: migration henüz uygulanmamışsa kolon hatası Edge Runtime'ı çökertmesin
  try {
    const { data: uyelik, error } = await supabase
      .from("company_members")
      .select("companies(is_premium, trial_ends_at)")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (!error && uyelik) {
      const company = uyelik.companies as unknown as {
        is_premium: boolean; trial_ends_at: string | null;
      } | null;

      if (company && !company.is_premium) {
        const trialEnd = company.trial_ends_at ? new Date(company.trial_ends_at) : null;
        if (!trialEnd || trialEnd.getTime() < Date.now()) {
          return NextResponse.redirect(new URL("/fiyatlandirma", request.url));
        }
      }
    }
  } catch {
    // migration uygulanmamış veya beklenmedik hata — geç, kullanıcıyı engelleme
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/",
    "/admin/:path*",
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
