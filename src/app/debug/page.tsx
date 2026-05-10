"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function DebugPage() {
  const [sonuc, setSonuc] = useState<string>("Henüz test yapılmadı");
  const [yukleniyor, setYuk] = useState(false);

  const test = async () => {
    setYuk(true);
    const satirlar: string[] = [];

    try {
      const sb = createClient();

      // 1. Oturum kontrolü
      const { data: sessionData, error: sessionError } = await sb.auth.getSession();
      if (sessionError) satirlar.push(`❌ Oturum hatası: ${sessionError.message}`);
      else if (!sessionData.session) satirlar.push("❌ Oturum YOK — lütfen çıkış yapıp tekrar giriş yapın");
      else {
        const uid = sessionData.session.user.id;
        const email = sessionData.session.user.email;
        satirlar.push(`✅ Oturum var — ${email}`);
        satirlar.push(`   user_id: ${uid}`);
        satirlar.push(`   Token: ${sessionData.session.access_token.slice(0, 30)}...`);

        // 2. user_store okuma
        const { data: readData, error: readError } = await sb
          .from("user_store")
          .select("user_id")
          .maybeSingle();

        if (readError) satirlar.push(`❌ Okuma hatası: ${readError.message} (code: ${readError.code})`);
        else satirlar.push(`✅ Okuma başarılı — kayıt ${readData ? "var" : "henüz yok"}`);

        // 3. user_store yazma (upsert)
        const { error: writeError } = await sb
          .from("user_store")
          .upsert({ user_id: uid, nakit_islemler: [] }, { onConflict: "user_id" });

        if (writeError) satirlar.push(`❌ YAZMA HATASI: ${writeError.message} (code: ${writeError.code})`);
        else satirlar.push("✅ YAZMA BAŞARILI — user_store güncellendi");
      }

      // 4. getUser (network doğrulama)
      const { data: userData, error: userError } = await sb.auth.getUser();
      if (userError) satirlar.push(`⚠️ getUser hatası: ${userError.message}`);
      else if (userData.user) satirlar.push(`✅ getUser başarılı — ${userData.user.email}`);
      else satirlar.push("❌ getUser null döndü");

    } catch (e: unknown) {
      satirlar.push(`💥 Beklenmedik hata: ${e}`);
    }

    setSonuc(satirlar.join("\n"));
    setYuk(false);
  };

  return (
    <div style={{ padding: 32, fontFamily: "monospace", background: "#0e172a", minHeight: "100vh", color: "#fff" }}>
      <h1 style={{ color: "#fbc024", marginBottom: 24 }}>DB Tanı Paneli</h1>
      <button
        onClick={test}
        disabled={yukleniyor}
        style={{
          background: "#fbc024", color: "#0e172a", border: "none",
          padding: "12px 24px", borderRadius: 8, fontWeight: "bold",
          cursor: yukleniyor ? "not-allowed" : "pointer", fontSize: 16, marginBottom: 24,
        }}
      >
        {yukleniyor ? "Test yapılıyor..." : "Test Et"}
      </button>
      <pre style={{
        background: "#1a2540", padding: 24, borderRadius: 12,
        whiteSpace: "pre-wrap", lineHeight: 1.8, fontSize: 14,
      }}>
        {sonuc}
      </pre>
      <p style={{ marginTop: 16, color: "#94a3b8", fontSize: 12 }}>
        Bu sayfayı test ettikten sonra sonucu paylaşın.
      </p>
    </div>
  );
}
