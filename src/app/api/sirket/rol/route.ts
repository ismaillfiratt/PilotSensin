import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { name, permissions } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "Rol adı zorunlu." }, { status: 400 });

    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });

    const { data: member } = await supabase
      .from("company_members")
      .select("company_id, role")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (!member || member.role !== "pilot") {
      return NextResponse.json({ error: "Bu işlem için Pilot yetkisi gerekli." }, { status: 403 });
    }

    const { data: rol, error: re } = await supabase
      .from("company_roles")
      .insert({ company_id: member.company_id, name: name.trim(), permissions })
      .select("id")
      .single();

    if (re) {
      console.error("[sirket/rol] insert:", re);
      return NextResponse.json({ error: re.message }, { status: 500 });
    }

    return NextResponse.json({ rolId: rol.id });
  } catch (err) {
    console.error("[sirket/rol] unexpected:", err);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { rolId } = await req.json();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });

    await supabase.from("company_roles").delete().eq("id", rolId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[sirket/rol] delete:", err);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
