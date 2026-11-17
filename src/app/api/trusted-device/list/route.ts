import { NextRequest, NextResponse }       from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient }                   from "@/utils/supabase/server";

export async function GET() {
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

    const { data: devices, error } = await admin
      .from("trusted_devices")
      .select("id, device_label, last_used_at, expires_at, created_at")
      .eq("user_id", user.id)
      .gt("expires_at", new Date().toISOString())
      .order("last_used_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: "Cihazlar alınamadı." }, { status: 500 });
    }

    return NextResponse.json({ devices: devices ?? [] });
  } catch (err) {
    console.error("[trusted-device/list GET]", err);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}

// Revoke (POST { id })
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

    const body = await req.json().catch(() => ({}));
    const deviceId: string = body?.id ?? "";
    if (!deviceId) {
      return NextResponse.json({ error: "Cihaz ID gerekli." }, { status: 400 });
    }

    const admin = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { error } = await admin
      .from("trusted_devices")
      .delete()
      .eq("id", deviceId)
      .eq("user_id", user.id); // Başkasının cihazını silemesin

    if (error) {
      return NextResponse.json({ error: "Cihaz silinemedi." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[trusted-device/list POST]", err);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
