import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Profil kaydı — DB trigger zaten yapıyor; bu fallback/güncelleme içindir
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("profiles").upsert(
            {
              id:         user.id,
              email:      user.email,
              full_name:  user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
              avatar_url: user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "id" }
          );
        }
      } catch {
        // Profil hatası kritik değil; dashboard'a devam et
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/giris?error=auth_callback_failed`);
}
