import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { sirketAdi } = await req.json();
    if (!sirketAdi?.trim()) {
      return NextResponse.json({ error: "Şirket adı zorunlu." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
    }

    // Zaten şirketi var mı?
    const { data: existing } = await supabase
      .from("company_members")
      .select("company_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();
    if (existing) {
      return NextResponse.json({ companyId: existing.company_id });
    }

    // Şirket oluştur
    const { data: company, error: ce } = await supabase
      .from("companies")
      .insert({ name: sirketAdi.trim(), owner_id: user.id })
      .select("id")
      .single();
    if (ce || !company) {
      console.error("[sirket/kur] companies insert:", ce);
      return NextResponse.json({ error: ce?.message ?? "Şirket oluşturulamadı." }, { status: 500 });
    }

    // Owner'ı pilot üye yap
    const { error: me } = await supabase.from("company_members").insert({
      company_id: company.id,
      user_id:    user.id,
      email:      user.email ?? "",
      role:       "pilot",
      status:     "active",
      joined_at:  new Date().toISOString(),
    });
    if (me) console.error("[sirket/kur] company_members insert:", me);

    // Eski user_store verisini company_store'a taşı
    const { data: us } = await supabase.from("user_store").select("*").maybeSingle();
    if (us) {
      const { error: cse } = await supabase.from("company_store").upsert({
        company_id:        company.id,
        nakit_islemler:    us.nakit_islemler    ?? [],
        gorevler:          us.gorevler          ?? [],
        stok_urunler:      us.stok_urunler      ?? [],
        prosedurler:       us.prosedurler       ?? [],
        checklist_items:   us.checklist_items   ?? [],
        acil_fon_hedefler: us.acil_fon_hedefler ?? [],
        acil_fon_islemler: us.acil_fon_islemler ?? [],
        isletme_giderleri: us.isletme_giderleri ?? [],
      }, { onConflict: "company_id" });
      if (cse) console.error("[sirket/kur] company_store upsert:", cse);
    }

    return NextResponse.json({ companyId: company.id });
  } catch (err) {
    console.error("[sirket/kur] unexpected:", err);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
