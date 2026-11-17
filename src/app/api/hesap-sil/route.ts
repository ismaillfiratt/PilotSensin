import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: NextRequest) {
  try {
    // ── 1. Servis anahtarı kontrolü ─────────────────────────────────────────
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      return NextResponse.json(
        { error: "Sunucu yapılandırma hatası: SUPABASE_SERVICE_ROLE_KEY eksik." },
        { status: 503 }
      );
    }

    // ── 2. Kullanıcı doğrulama (cookie tabanlı) ──────────────────────────────
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
    }

    // ── 3. Onay metni kontrolü ───────────────────────────────────────────────
    const body = await req.json().catch(() => ({}));
    const onay: string = body?.onay ?? "";
    if (onay !== "SİL" && onay !== "RIZAYI GERİ ÇEKİYORUM") {
      return NextResponse.json({ error: "Geçersiz onay metni." }, { status: 400 });
    }

    // ── 4. Admin client (service role) ───────────────────────────────────────
    const admin = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // ── 5. Activity log — SİLMEDEN ÖNCE ────────────────────────────────────
    await supabase.from("activity_log").insert({
      user_id:    user.id,
      company_id: null,
      modul:      "profil",
      eylem:      "hesap-sil-istek",
      ozet:       `Hesap silme isteği başlatıldı (onay: ${onay})`,
      meta:       { onay },
    }).then(({ error }) => {
      if (error) console.warn("[hesap-sil] activity_log:", error.message);
    });

    // ── 6. company_members temizleme ────────────────────────────────────────
    const { error: memberErr } = await supabase
      .from("company_members")
      .delete()
      .eq("user_id", user.id);
    if (memberErr) {
      console.warn("[hesap-sil] company_members delete:", memberErr.message);
    }

    // ── 7. Auth kullanıcısını sil ────────────────────────────────────────────
    const { error: deleteErr } = await admin.auth.admin.deleteUser(user.id);
    if (deleteErr) {
      console.error("[hesap-sil] deleteUser:", deleteErr.message);
      return NextResponse.json(
        { error: `Hesap silinemedi: ${deleteErr.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[hesap-sil] unexpected:", err);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
