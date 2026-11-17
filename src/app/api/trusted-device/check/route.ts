import { NextResponse }                   from "next/server";
import { cookies }                        from "next/headers";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient }                   from "@/utils/supabase/server";
import { sha256Hex }                      from "@/lib/mfa-helpers";

const COOKIE_NAME = "pilot-trusted-device";

export async function POST() {
  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      return NextResponse.json({ error: "Sunucu yapılandırma hatası." }, { status: 503 });
    }

    const cookieStore = await cookies();
    const plainToken  = cookieStore.get(COOKIE_NAME)?.value;

    if (!plainToken) {
      return NextResponse.json({ trusted: false });
    }

    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ trusted: false });
    }

    const tokenHash = await sha256Hex(decodeURIComponent(plainToken));

    const admin = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: kayit } = await admin
      .from("trusted_devices")
      .select("id, device_label")
      .eq("user_id", user.id)
      .eq("token_hash", tokenHash)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (!kayit) {
      // Cookie geçersiz/süresi dolmuş — temizle
      const res = NextResponse.json({ trusted: false });
      res.headers.set(
        "Set-Cookie",
        `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/`
      );
      return res;
    }

    // last_used_at güncelle
    await admin
      .from("trusted_devices")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", kayit.id);

    return NextResponse.json({ trusted: true, deviceLabel: kayit.device_label });
  } catch (err) {
    console.error("[trusted-device/check]", err);
    return NextResponse.json({ trusted: false });
  }
}
