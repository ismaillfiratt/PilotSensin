import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { destekCevapBildir, destekYeniMesajAdminBildir } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const sb = await createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

    const { talepId, mesajId } = await req.json() as { talepId: string; mesajId: string };

    const { data: talep } = await sb
      .from("destek_talepleri")
      .select("*")
      .eq("id", talepId)
      .single();
    if (!talep) return NextResponse.json({ error: "Talep bulunamadı" }, { status: 404 });

    const { data: mesaj } = await sb
      .from("destek_mesajlari")
      .select("*")
      .eq("id", mesajId)
      .single();
    if (!mesaj) return NextResponse.json({ error: "Mesaj bulunamadı" }, { status: 404 });

    if (mesaj.ic_not) return NextResponse.json({ ok: true });

    if (mesaj.gonderen_tip === "admin") {
      await destekCevapBildir({
        talepId,
        konu:           talep.konu as string,
        kullaniciEmail: talep.kullanici_email as string,
        adminMesaj:     mesaj.mesaj as string,
      });
    } else if (mesaj.gonderen_tip === "kullanici") {
      await destekYeniMesajAdminBildir({
        talepId,
        konu:           talep.konu as string,
        kullaniciAd:    (talep.kullanici_ad as string | null) ?? (talep.kullanici_email as string),
        kullaniciEmail: talep.kullanici_email as string,
        mesaj:          mesaj.mesaj as string,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/destek/cevap]", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
