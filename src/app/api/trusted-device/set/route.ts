import { NextRequest, NextResponse }       from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient }                   from "@/utils/supabase/server";
import { uretTrustedToken, sha256Hex, parseDeviceLabel } from "@/lib/mfa-helpers";

const COOKIE_NAME = "pilot-trusted-device";
const OTUZ_GUN_MS = 30 * 24 * 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      return NextResponse.json({ error: "Sunucu yapılandırma hatası." }, { status: 503 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
    }

    const admin = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const plainToken   = uretTrustedToken();
    const tokenHash    = await sha256Hex(plainToken);
    const ua           = req.headers.get("user-agent") ?? "";
    const deviceLabel  = parseDeviceLabel(ua);
    const expiresAt    = new Date(Date.now() + OTUZ_GUN_MS).toISOString();

    const { error: insertErr } = await admin.from("trusted_devices").insert({
      user_id:      user.id,
      token_hash:   tokenHash,
      device_label: deviceLabel,
      expires_at:   expiresAt,
    });

    if (insertErr) {
      console.error("[trusted-device/set] insert:", insertErr.message);
      return NextResponse.json({ error: "Cihaz kaydedilemedi." }, { status: 500 });
    }

    const cookieValue = encodeURIComponent(plainToken);
    const cookieStr   = [
      `${COOKIE_NAME}=${cookieValue}`,
      "HttpOnly",
      "Secure",
      "SameSite=Lax",
      `Max-Age=${30 * 24 * 3600}`,
      "Path=/",
    ].join("; ");

    const res = NextResponse.json({ success: true, deviceLabel });
    res.headers.set("Set-Cookie", cookieStr);
    return res;
  } catch (err) {
    console.error("[trusted-device/set]", err);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
