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
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#070d1a" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 animate-spin"
            style={{ borderColor: "var(--forest-200, #B3E8C8)", borderTopColor: "var(--leaf)" }} />
          <p className="text-sm" style={{ color: "#64748b" }}>Yetki kontrol ediliyor…</p>
        </div>
      </div>
    );
  }

  /* ─── Erişim Reddedildi ─── */
  if (kontrol === "red") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#070d1a" }}>
        <div className="text-center space-y-4 max-w-sm px-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
            <span className="text-3xl">🚫</span>
          </div>
          <h1 className="text-xl font-bold text-white">Erişim Reddedildi</h1>
          <p className="text-sm" style={{ color: "#94a3b8" }}>
            {hata || "Bu sayfaya erişim yetkiniz yok."}
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <button
              onClick={() => router.replace("/giris")}
              className="px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: "var(--leaf)", color: "var(--forest)" }}
            >
              Farklı Hesapla Giriş Yap
            </button>
            <button
              onClick={() => router.replace("/dashboard")}
              className="px-4 py-2 rounded-xl text-sm font-medium border"
              style={{ borderColor: "rgba(255,255,255,0.1)", color: "#94a3b8" }}
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
    <div className="min-h-screen" style={{ background: "#070d1a", color: "#ffffff" }}>
      {children}
    </div>
  );
}
