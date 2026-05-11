import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { token, userId, email, fullName } = await req.json();
    if (!token || !userId || !email) {
      return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
    }

    const supabase = await createClient();

    // SECURITY DEFINER fonksiyon — RLS'yi atlar, tüm işlemi atomik yapar
    const { data, error } = await supabase.rpc("accept_invitation", {
      p_token:     token,
      p_user_id:   userId,
      p_email:     email.toLowerCase(),
      p_full_name: fullName || null,
    });

    if (error) {
      console.error("[davet/kabul] rpc error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const result = data as { ok: boolean; error?: string };
    if (!result?.ok) {
      return NextResponse.json({ error: result?.error ?? "Davet kabul edilemedi." }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[davet/kabul] unexpected:", err);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
