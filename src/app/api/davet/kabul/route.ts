import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { token, userId, email, fullName } = await req.json();
    if (!token || !userId) return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });

    const supabase = await createClient();

    // Daveti getir
    const { data: inv } = await supabase
      .from("invitations")
      .select("*")
      .eq("token", token)
      .is("accepted_at", null)
      .gte("expires_at", new Date().toISOString())
      .maybeSingle();

    if (!inv) return NextResponse.json({ error: "Davet geçersiz veya süresi dolmuş." }, { status: 400 });

    // Şirketin ilk rolünü al (copilot varsayılan)
    const { data: rol } = await supabase
      .from("company_roles")
      .select("id, permissions")
      .eq("company_id", inv.company_id)
      .eq("is_owner", false)
      .order("created_at")
      .limit(1)
      .maybeSingle();

    // Üyeyi güncelle (pending → active)
    await supabase.from("company_members").upsert({
      company_id:  inv.company_id,
      user_id:     userId,
      email:       email,
      full_name:   fullName || null,
      role:        inv.role,
      role_id:     rol?.id ?? null,
      permissions: rol?.permissions ?? {},
      status:      "active",
      joined_at:   new Date().toISOString(),
    }, { onConflict: "company_id,email" });

    // Daveti kapat
    await supabase.from("invitations").update({ accepted_at: new Date().toISOString() }).eq("id", inv.id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[davet/kabul]", err);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
