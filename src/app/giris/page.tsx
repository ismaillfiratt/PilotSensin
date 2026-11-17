"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Plane, Mail, Lock, Eye, EyeOff, AlertCircle, ShieldCheck, KeyRound } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { GirisAlani, Buton } from "@/components/form";

type LoginStep = "kimlik" | "mfa" | "recovery";

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

  const [step,         setStep]         = useState<LoginStep>("kimlik");
  const [email,        setEmail]        = useState("");
  const [sifre,        setSifre]        = useState("");
  const [sifreGoster,  setSifreGoster]  = useState(false);
  const [totpKodu,     setTotpKodu]     = useState("");
  const [recoveryKodu, setRecoveryKodu] = useState("");
  const [cihazHatirla, setCihazHatirla] = useState(false);
  const [factorId,     setFactorId]     = useState<string | null>(null);
  const [hata,         setHata]         = useState("");
  const [yukleniyor,   setYukleniyor]   = useState(false);
  const [googleYuk,    setGoogleYuk]    = useState(false);
  const [isAdmin,      setIsAdmin]      = useState(false);

  const totpRef     = useRef<HTMLInputElement>(null);
  const recoveryRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchParams.get("erisim") === "reddedildi") {
      setHata("Bu sayfaya erişim yetkiniz yok. Lütfen yetkili bir hesapla giriş yapın.");
    }
  }, [searchParams]);

  useEffect(() => {
    if (step === "mfa")      setTimeout(() => totpRef.current?.focus(), 80);
    if (step === "recovery") setTimeout(() => recoveryRef.current?.focus(), 80);
  }, [step]);

  // ── Step 1: Email / şifre ──────────────────────────────────────────────────
  const handleKimlikSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setHata("");
    setYukleniyor(true);
    try {
      const sb = createClient();

      const { data: { user }, error } = await sb.auth.signInWithPassword({
        email, password: sifre,
      });

      if (error || !user) {
        setHata("E-posta veya şifre hatalı.");
        setYukleniyor(false);
        return;
      }

      const { data: profil } = await sb.from("profiles")
        .select("system_admin").eq("id", user.id).maybeSingle();
      setIsAdmin(!!profil?.system_admin);

      const { data: factors } = await sb.auth.mfa.listFactors();
      const verifiedTotp = factors?.totp?.find((f) => f.status === "verified");

      if (!verifiedTotp) {
        router.replace(profil?.system_admin ? "/admin" : "/dashboard");
        router.refresh();
        return;
      }

      // Cihaz trusted mi?
      try {
        const tr = await fetch("/api/trusted-device/check", { method: "POST", credentials: "include" });
        const tj = await tr.json();
        if (tj.trusted) {
          router.replace(profil?.system_admin ? "/admin" : "/dashboard");
          router.refresh();
          return;
        }
      } catch { /* güvenli devam */ }

      setFactorId(verifiedTotp.id);
      setStep("mfa");
    } catch {
      setHata("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setYukleniyor(false);
    }
  };

  // ── Step 2: TOTP ──────────────────────────────────────────────────────────
  const handleMfaSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!factorId || totpKodu.length !== 6) return;
    setHata("");
    setYukleniyor(true);
    try {
      const sb = createClient();

      const { data: ch, error: chErr } = await sb.auth.mfa.challenge({ factorId });
      if (chErr || !ch) {
        setHata("Doğrulama başlatılamadı. Tekrar dene.");
        setYukleniyor(false);
        return;
      }

      const { error: vErr } = await sb.auth.mfa.verify({
        factorId, challengeId: ch.id, code: totpKodu,
      });

      if (vErr) {
        setHata("Kod yanlış veya süresi dolmuş. Tekrar dene.");
        setTotpKodu("");
        setTimeout(() => totpRef.current?.focus(), 50);
        setYukleniyor(false);
        return;
      }

      if (cihazHatirla) {
        await fetch("/api/trusted-device/set", { method: "POST", credentials: "include" })
          .catch(() => null);
      }

      router.replace(isAdmin ? "/admin" : "/dashboard");
      router.refresh();
    } catch {
      setHata("Bağlantı hatası. Tekrar dene.");
      setYukleniyor(false);
    }
  };

  // ── Step 3: Recovery code ─────────────────────────────────────────────────
  const handleRecoverySubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (recoveryKodu.replace(/[-\s]/g, "").length < 10) return;
    setHata("");
    setYukleniyor(true);
    try {
      const res = await fetch("/api/recovery-codes/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: recoveryKodu }),
        credentials: "include",
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setHata(json.error ?? "Geçersiz veya kullanılmış recovery code.");
        setYukleniyor(false);
        return;
      }

      router.replace("/dashboard?2fa-disabled=1");
      router.refresh();
    } catch {
      setHata("Bağlantı hatası. Tekrar dene.");
      setYukleniyor(false);
    }
  };

  // ── Google OAuth ──────────────────────────────────────────────────────────
  const handleGoogle = async () => {
    setHata("");
    setGoogleYuk(true);
    try {
      const { error } = await createClient().auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: getRedirectUrl(), queryParams: { access_type: "offline", prompt: "consent" } },
      });
      if (error) setHata("Google girişi başlatılamadı. Lütfen tekrar deneyin.");
    } catch {
      setHata("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setGoogleYuk(false);
    }
  };

  const stepBaslik: Record<LoginStep, { h2: string; sub: string }> = {
    kimlik:   { h2: "Giriş Yap",             sub: "Hesabınıza erişin" },
    mfa:      { h2: "İki Adımlı Doğrulama",  sub: "Authenticator uygulamanızdaki kodu girin" },
    recovery: { h2: "Recovery Code",          sub: "Kayıt olurken aldığınız kodlardan birini kullanın" },
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-md"
            style={{ background: "var(--forest)" }}>
            {step === "kimlik"   && <Plane       className="w-7 h-7 text-white rotate-45" />}
            {step === "mfa"      && <ShieldCheck className="w-7 h-7 text-white" />}
            {step === "recovery" && <KeyRound    className="w-7 h-7 text-white" />}
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Pilot Sensin</h1>
          <p className="text-sm text-gray-500 mt-1">İşletmenizi güvenle yönetin</p>
        </div>

        {/* Kart */}
        <div className="bg-white border border-gray-200 rounded-2xl p-7 space-y-5 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-gray-800">{stepBaslik[step].h2}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{stepBaslik[step].sub}</p>
          </div>

          {/* Hata */}
          <AnimatePresence mode="wait">
            {hata && (
              <motion.div
                key={hata}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100"
              >
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-sm text-red-600">{hata}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ═══ STEP 1 ═══ */}
          {step === "kimlik" && (
            <div className="space-y-5">
              <button
                type="button"
                onClick={handleGoogle}
                disabled={googleYuk || yukleniyor}
                className="w-full min-h-12 flex items-center justify-center gap-2.5 px-4 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {googleYuk
                  ? <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
                  : <GoogleIcon />}
                {googleYuk ? "Yönlendiriliyor..." : "Google ile Giriş Yap"}
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">veya e-posta ile</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <form onSubmit={handleKimlikSubmit} className="space-y-4">
                <GirisAlani
                  label="E-posta"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@isletme.com"
                  prefix={<Mail className="w-4 h-4" />}
                />
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-medium">Şifre</span>
                    <Link href="/sifre-sifirla" className="text-xs hover:underline"
                      style={{ color: "var(--leaf)" }}>
                      Şifremi unuttum
                    </Link>
                  </div>
                  <GirisAlani
                    type={sifreGoster ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={sifre}
                    onChange={(e) => setSifre(e.target.value)}
                    placeholder="••••••••"
                    prefix={<Lock className="w-4 h-4" />}
                    suffix={
                      <button type="button" onClick={() => setSifreGoster(!sifreGoster)}
                        className="min-w-11 min-h-11 flex items-center justify-center rounded-lg text-gray-400 active:text-gray-700 transition-colors">
                        {sifreGoster ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                  />
                </div>
                <Buton type="submit" varyant="primary" yukleniyor={yukleniyor} disabled={googleYuk} className="w-full">
                  Giriş Yap
                </Buton>
              </form>

              <p className="text-center text-sm text-gray-500">
                Hesabınız yok mu?{" "}
                <Link href="/kayit" className="font-semibold hover:underline" style={{ color: "var(--leaf)" }}>
                  Kayıt Ol
                </Link>
              </p>
              <p className="text-center text-[10px] text-gray-400 leading-relaxed">
                Sisteme giriş yaparak{" "}
                <Link href="/politikalar/kullanim-kosullari" className="hover:text-gray-600 underline">
                  Kullanım Koşulları
                </Link>
                &apos;nı kabul etmiş sayılırsınız.
              </p>
            </div>
          )}

          {/* ═══ STEP 2: TOTP ═══ */}
          {step === "mfa" && (
            <form onSubmit={handleMfaSubmit} className="space-y-5">
              <p className="text-xs text-gray-500">
                Authenticator uygulamanızdaki 6 haneli kodu girin
              </p>
              <input
                ref={totpRef}
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                value={totpKodu}
                onChange={(e) => setTotpKodu(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="w-full text-center text-3xl font-mono py-4 rounded-xl focus:outline-none transition-colors"
                style={{
                  background: "#F8FAFC",
                  border: "0.5px solid rgba(0,0,0,0.12)",
                  color: "#0F172A",
                  letterSpacing: "0.5em",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--forest)")}
                onBlur={(e)  => (e.target.style.borderColor = "rgba(0,0,0,0.12)")}
              />

              <label className="flex items-center gap-2.5 cursor-pointer text-sm text-gray-600 select-none">
                <input
                  type="checkbox"
                  checked={cihazHatirla}
                  onChange={(e) => setCihazHatirla(e.target.checked)}
                  className="w-4 h-4 rounded cursor-pointer"
                  style={{ accentColor: "var(--forest)" }}
                />
                Bu cihazı 30 gün hatırla
              </label>

              <Buton type="submit" varyant="primary" yukleniyor={yukleniyor}
                disabled={totpKodu.length !== 6} className="w-full">
                {yukleniyor ? "Doğrulanıyor..." : "Doğrula"}
              </Buton>

              <div className="text-center space-y-2 pt-1">
                <button type="button"
                  onClick={() => { setStep("recovery"); setHata(""); setTotpKodu(""); }}
                  className="text-xs hover:underline block mx-auto"
                  style={{ color: "var(--leaf)" }}>
                  Authenticator&apos;a erişimim yok — recovery code kullan
                </button>
                <button type="button"
                  onClick={() => { setStep("kimlik"); setHata(""); setTotpKodu(""); }}
                  className="text-xs text-gray-400 hover:text-gray-700 transition-colors block mx-auto">
                  ← E-posta / şifre adımına dön
                </button>
              </div>
            </form>
          )}

          {/* ═══ STEP 3: Recovery ═══ */}
          {step === "recovery" && (
            <form onSubmit={handleRecoverySubmit} className="space-y-5">
              <p className="text-xs text-gray-500">
                2FA aktif ederken size verilen 10 karakterli kodlardan birini girin.
                Format: XXXX-XXXX-XX
              </p>
              <input
                ref={recoveryRef}
                type="text"
                required
                value={recoveryKodu}
                onChange={(e) => setRecoveryKodu(e.target.value.toUpperCase())}
                placeholder="XXXX-XXXX-XX"
                maxLength={12}
                className="w-full text-center text-xl font-mono py-3.5 rounded-xl focus:outline-none transition-colors"
                style={{
                  background: "#F8FAFC",
                  border: "0.5px solid rgba(0,0,0,0.12)",
                  color: "#0F172A",
                  letterSpacing: "0.15em",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--forest)")}
                onBlur={(e)  => (e.target.style.borderColor = "rgba(0,0,0,0.12)")}
              />

              <div className="px-3 py-2.5 rounded-xl text-xs"
                style={{ background: "rgba(245,158,11,0.08)", color: "#B45309", border: "0.5px solid rgba(245,158,11,0.2)" }}>
                ⚠ Bu kod kullanılınca 2FA otomatik kapanır. Sonra tekrar aktif etmeniz gerekir.
              </div>

              <Buton type="submit" varyant="primary" yukleniyor={yukleniyor}
                disabled={recoveryKodu.replace(/[-\s]/g, "").length < 10} className="w-full">
                {yukleniyor ? "Doğrulanıyor..." : "Recovery code ile gir"}
              </Buton>

              <div className="text-center pt-1">
                <button type="button"
                  onClick={() => { setStep("mfa"); setHata(""); setRecoveryKodu(""); }}
                  className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
                  ← Authenticator koduna dön
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
