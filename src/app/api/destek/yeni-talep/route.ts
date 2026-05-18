import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { destekYeniTalepBildir } from "@/lib/email";
import { KATEGORI_ETIKETLERI, ONCELIK_ETIKETLERI } from "@/lib/destek-data";

export async function POST(req: NextRequest) {
  try {
    const sb = await createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

    const { talepId } = await req.json() as { talepId: string };

    const { data: talep } = await sb
      .from("destek_talepleri")
      .select("*")
      .eq("id", talepId)
      .single();
    if (!talep) return NextResponse.json({ error: "Talep bulunamadı" }, { status: 404 });

    const { data: mesajlar } = await sb
      .from("destek_mesajlari")
      .select("mesaj")
      .eq("talep_id", talepId)
      .eq("gonderen_tip", "kullanici")
      .order("olusturma", { ascending: true })
      .limit(1);

    await destekYeniTalepBildir({
      talepId,
      konu:           talep.konu as string,
      kategori:       KATEGORI_ETIKETLERI[talep.kategori as keyof typeof KATEGORI_ETIKETLERI],
      oncelik:        ONCELIK_ETIKETLERI[talep.oncelik as keyof typeof ONCELIK_ETIKETLERI],
      kullaniciAd:    (talep.kullanici_ad as string | null) ?? (talep.kullanici_email as string),
      kullaniciEmail: talep.kullanici_email as string,
      mesaj:          (mesajlar?.[0]?.mesaj as string) ?? "",
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/destek/yeni-talep]", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
