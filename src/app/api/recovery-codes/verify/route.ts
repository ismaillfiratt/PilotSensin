import { NextRequest, NextResponse }       from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient }                   from "@/utils/supabase/server";
import { sha256Hex }                      from "@/lib/mfa-helpers";

function normalizeKod(raw: string): string {
  // Büyük harf, tire ve boşlukları kaldır, sonra XXXX-XXXX-XX formatına sok
  const temiz = raw.toUpperCase().replace(/[-\s]/g, "");
  if (temiz.length === 10) {
    return `${temiz.slice(0, 4)}-${temiz.slice(4, 8)}-${temiz.slice(8)}`;
  }
  return temiz;
}

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
    const rawKod: string = body?.code ?? "";
    if (!rawKod) {
      return NextResponse.json({ error: "Kod gerekli." }, { status: 400 });
    }

    const normalized = normalizeKod(rawKod);
    const hash = await sha256Hex(normalized);

    const admin = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Kullanılmamış eşleşen kodu bul
    const { data: kayit, error: searchErr } = await admin
      .from("user_recovery_codes")
      .select("id")
      .eq("user_id", user.id)
      .eq("code_hash", hash)
      .is("used_at", null)
      .maybeSingle();

    if (searchErr) {
      console.error("[recovery-codes/verify] select:", searchErr.message);
      return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
    }

    if (!kayit) {
      return NextResponse.json({ error: "Geçersiz veya kullanılmış kod." }, { status: 401 });
    }

    // Kodu kullanıldı olarak işaretle
    await admin
      .from("user_recovery_codes")
      .update({ used_at: new Date().toISOString() })
      .eq("id", kayit.id);

    // Tüm TOTP faktörlerini unenroll et (kayıp telefon senaryosu)
    const { data: mfaListe } = await supabase.auth.mfa.listFactors();
    for (const f of mfaListe?.totp ?? []) {
      await admin.auth.admin.mfa.deleteFactor({ userId: user.id, id: f.id });
    }

    await supabase.from("activity_log").insert({
      user_id: user.id, company_id: null,
      modul: "profil", eylem: "recovery-code-used",
      ozet: "Recovery code kullanıldı, TOTP devre dışı bırakıldı",
    });

    return NextResponse.json({
      success: true,
      message: "TOTP devre dışı bırakıldı. Profilden yeniden aktif edebilirsin.",
    });
  } catch (err) {
    console.error("[recovery-codes/verify]", err);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
