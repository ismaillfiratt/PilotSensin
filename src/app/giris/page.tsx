"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plane, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { GirisAlani, Buton } from "@/components/form";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function getRedirectUrl() {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
  return `${base}/auth/callback`;
}

export default function GirisPage() {
  return (
    <Suspense>
      <GirisIcerik />
    </Suspense>
  );
}

function GirisIcerik() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm]         = useState({ email: "", password: "" });
  const [goster, setGoster]     = useState(false);
  const [hata, setHata]         = useState("");
  const [yukleniyor, setYuk]    = useState(false);
  const [googleYuk, setGoogleYuk] = useState(false);

  // URL'de ?erisim=reddedildi varsa uyarı göster
  useEffect(() => {
    if (searchParams.get("erisim") === "reddedildi") {
      setHata("Bu sayfaya erişim yetkiniz yok. Lütfen yetkili bir hesapla giriş yapın.");
    }
  }, [searchParams]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setHata("");
    setYuk(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email:    form.email,
        password: form.password,
      });
      if (error) {
        setHata("E-posta veya şifre hatalı.");
      } else {
        // system_admin kontrolü → /admin veya /dashboard
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profil } = await supabase
            .from("profiles")
            .select("system_admin")
            .eq("id", user.id)
            .maybeSingle();
          if (profil?.system_admin) {
            router.push("/admin");
          } else {
            router.push("/dashboard");
          }
        } else {
          router.push("/dashboard");
        }
        router.refresh();
      }
    } catch {
      setHata("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setYuk(false);
    }
  };

  const handleGoogle = async () => {
    setHata("");
    setGoogleYuk(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: getRedirectUrl(),
          queryParams: { access_type: "offline", prompt: "consent" },
        },
      });
      if (error) setHata("Google girişi başlatılamadı. Lütfen tekrar deneyin.");
    } catch {
      setHata("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setGoogleYuk(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0e172a] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[#fbc024] opacity-5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-[#fbc024] opacity-5 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm relative"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#fbc024] flex items-center justify-center mb-4 shadow-lg shadow-[#fbc024]/20">
            <Plane className="w-7 h-7 text-[#0e172a] rotate-45" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Pilot Sensin</h1>
          <p className="text-sm text-[#94a3b8] mt-1">İşletmenizi güvenle yönetin</p>
        </div>

        <div className="glass-card rounded-2xl p-7 space-y-5">
          <div>
            <h2 className="text-lg font-bold text-white">Giriş Yap</h2>
            <p className="text-xs text-[#94a3b8] mt-0.5">Hesabınıza erişin</p>
          </div>

          {hata && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.25)]"
            >
              <AlertCircle className="w-4 h-4 text-[#ef4444] shrink-0" />
              <p className="text-sm text-[#ef4444]">{hata}</p>
            </motion.div>
          )}

          {/* Google OAuth */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleYuk || yukleniyor}
            className="w-full min-h-12 flex items-center justify-center gap-2.5 px-4 rounded-xl border border-[rgba(255,255,255,0.12)] text-white text-sm font-medium active:bg-white/5 hover:bg-[rgba(255,255,255,0.06)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {googleYuk ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            {googleYuk ? "Yönlendiriliyor..." : "Google ile Giriş Yap"}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[rgba(255,255,255,0.08)]" />
            <span className="text-xs text-[#475569]">veya e-posta ile</span>
            <div className="flex-1 h-px bg-[rgba(255,255,255,0.08)]" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <GirisAlani
              label="E-posta"
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="ornek@isletme.com"
              prefix={<Mail className="w-4 h-4" />}
            />

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#94a3b8] font-medium">Şifre</span>
                <Link href="/sifre-sifirla" className="text-xs text-[#fbc024] hover:underline">
                  Şifremi unuttum
                </Link>
              </div>
              <GirisAlani
                type={goster ? "text" : "password"}
                required
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder="••••••••"
                prefix={<Lock className="w-4 h-4" />}
                suffix={
                  <button type="button" onClick={() => setGoster(!goster)}
                    className="min-w-11 min-h-11 flex items-center justify-center rounded-lg text-[#94a3b8] active:text-white transition-colors">
                    {goster ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />
            </div>

            <Buton type="submit" varyant="primary" yukleniyor={yukleniyor} disabled={googleYuk} className="w-full">
              Giriş Yap
            </Buton>
          </form>

          <p className="text-center text-sm text-[#94a3b8]">
            Hesabınız yok mu?{" "}
            <Link href="/kayit" className="text-[#fbc024] font-semibold hover:underline">
              Kayıt Ol
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
