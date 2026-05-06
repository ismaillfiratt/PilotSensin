import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  try {
    const { ad, soyad, email, password, businessAd, sektor } = await req.json();

    if (!ad || !email || !password || !businessAd) {
      return NextResponse.json({ error: "Zorunlu alanlar eksik." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Şifre en az 6 karakter olmalı." }, { status: 400 });
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          ad,
          soyad:      soyad ?? "",
          businessAd,
          sektor:     sektor ?? "",
        },
      },
    });

    if (error) {
      if (error.message.includes("already registered")) {
        return NextResponse.json({ error: "Bu e-posta zaten kayıtlı." }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, userId: data.user?.id }, { status: 201 });
  } catch (err) {
    console.error("[REGISTER]", err);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
