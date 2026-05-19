"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [kontrol, setKontrol] = useState<"yukleniyor" | "izin" | "red">("yukleniyor");
  const [hata, setHata] = useState("");

  useEffect(() => {
    async function adminKontrol() {
      const supabase = createClient();

      // getUser() → sunucudan doğrulama yapar (getSession()'dan daha güvenilir)
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/giris");
        return;
      }

      const { data: profil, error: profilError } = await supabase
        .from("profiles")
        .select("system_admin")
        .eq("id", user.id)
        .maybeSingle();

      if (profilError) {
        setHata(`Profil okunamadı: ${profilError.message}`);
        setKontrol("red");
        return;
      }

      if (!profil?.system_admin) {
        setHata(`Bu hesabın (${user.email}) admin yetkisi yok.`);
        setKontrol("red");
        return;
      }

      setKontrol("izin");
    }

    adminKontrol();
  }, [router]);

  /* ─── Yükleniyor ─── */
  if (kontrol === "yukleniyor") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 animate-spin"
            style={{ borderColor: "#E2E8F0", borderTopColor: "var(--leaf)" }} />
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Yetki kontrol ediliyor…</p>
        </div>
      </div>
    );
  }

  /* ─── Erişim Reddedildi ─── */
  if (kontrol === "red") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center space-y-4 max-w-sm px-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <span className="text-3xl">🚫</span>
          </div>
          <h1 className="text-xl font-bold" style={{ color: "#0F172A" }}>Erişim Reddedildi</h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {hata || "Bu sayfaya erişim yetkiniz yok."}
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <button
              onClick={() => router.replace("/giris")}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: "var(--forest)" }}
            >
              Farklı Hesapla Giriş Yap
            </button>
            <button
              onClick={() => router.replace("/dashboard")}
              className="px-4 py-2 rounded-xl text-sm font-medium border"
              style={{ borderColor: "rgba(0,0,0,0.12)", color: "var(--text-secondary)" }}
            >
              Dashboard'a Dön
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ─── İzin verildi ─── */
  return (
    <div className="min-h-screen bg-white">
      {children}
    </div>
  );
}
