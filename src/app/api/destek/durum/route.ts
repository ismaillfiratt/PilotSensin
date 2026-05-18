import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { destekDurumBildir } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const sb = await createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

    const { talepId, yeniDurum } = await req.json() as { talepId: string; yeniDurum: string };

    const { data: talep } = await sb
      .from("destek_talepleri")
      .select("konu, kullanici_email")
      .eq("id", talepId)
      .single();
    if (!talep) return NextResponse.json({ error: "Talep bulunamadı" }, { status: 404 });

    await destekDurumBildir({
      talepId,
      konu:           talep.konu as string,
      kullaniciEmail: talep.kullanici_email as string,
      yeniDurum,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/destek/durum]", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
