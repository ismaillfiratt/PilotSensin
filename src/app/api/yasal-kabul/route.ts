import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const sb = await createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? req.headers.get("x-real-ip")
      ?? "bilinmiyor";

    const ua = req.headers.get("user-agent") ?? "bilinmiyor";

    await sb.from("profiles").update({
      yasal_kabul:           true,
      yasal_kabul_tarih:     new Date().toISOString(),
      yasal_kabul_ip:        ip,
      yasal_kabul_useragent: ua,
    }).eq("id", user.id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/yasal-kabul]", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
