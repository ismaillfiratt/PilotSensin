import { NextResponse }                   from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient }                   from "@/utils/supabase/server";
import { uretRecoveryCode, sha256Hex }    from "@/lib/mfa-helpers";

export async function POST() {
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

    // Eski kodları sil
    await admin.from("user_recovery_codes").delete().eq("user_id", user.id);

    // 8 yeni kod üret
    const codes: string[] = [];
    const rows: { user_id: string; code_hash: string }[] = [];

    for (let i = 0; i < 8; i++) {
      const plain = uretRecoveryCode();
      const hash  = await sha256Hex(plain);
      codes.push(plain);
      rows.push({ user_id: user.id, code_hash: hash });
    }

    const { error: insertErr } = await admin.from("user_recovery_codes").insert(rows);
    if (insertErr) {
      console.error("[recovery-codes/generate] insert:", insertErr.message);
      return NextResponse.json({ error: "Kodlar kaydedilemedi." }, { status: 500 });
    }

    await supabase.from("activity_log").insert({
      user_id: user.id, company_id: null,
      modul: "profil", eylem: "recovery-codes-generate",
      ozet: "Yeni recovery kodları oluşturuldu",
    });

    // Plain code'lar sadece bu response'da — bir kaha gösterilir, server'da saklanmaz
    return NextResponse.json({ codes });
  } catch (err) {
    console.error("[recovery-codes/generate]", err);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
