"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plane, Mail, Lock, User, Building2, Eye, EyeOff, AlertCircle, CheckCircle2, MailCheck, Check } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

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

const SEKTORLER = [
  "Market / Bakkal", "Kafe / Restoran", "Kuaför / Güzellik",
  "Butik / Giyim", "Eczane", "Elektronik", "Fırın / Pastane",
  "Çiçekçi", "Kırtasiye", "Diğer",
];

export default function KayitPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    ad: "", soyad: "", email: "", password: "", passwordTekrar: "",
    businessAd: "", sektor: "Market / Bakkal",
  });
  const [goster, setGoster]           = useState(false);
  const [hata, setHata]               = useState("");
  const [adim, setAdim]               = useState<1 | 2>(1);
  const [yukleniyor, setYuk]          = useState(false);
  const [emailGonderildi, setEG]      = useState(false);
  const [googleYuk, setGoogleYuk]     = useState(false);
  const [yasalKabul, setYasalKabul]   = useState(false);

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

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleAdim1 = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (form.password !== form.passwordTekrar) { setHata("Şifreler eşleşmiyor."); return; }
    if (form.password.length < 6) { setHata("Şifre en az 6 karakter olmalı."); return; }
    setHata("");
    setAdim(2);
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.businessAd.trim()) { setHata("İşletme adı zorunlu."); return; }
    if (!yasalKabul) { setHata("Devam etmek için yasal belgeleri kabul etmeniz gerekiyor."); return; }
    setHata("");
    setYuk(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email:    form.email,
      password: form.password,
      options: {
        emailRedirectTo: getRedirectUrl(),
        data: {
          ad:         form.ad,
          soyad:      form.soyad,
          businessAd: form.businessAd,
          sektor:     form.sektor,
        },
      },
    });

    setYuk(false);

    if (error) {
      setHata(error.message.includes("already registered")
        ? "Bu e-posta zaten kayıtlı."
        : error.message);
      return;
    }

    // Yasal kabul kaydı
    await fetch("/api/yasal-kabul", { method: "POST" }).catch(() => {});

    // Oturum açıldıysa (e-posta onayı kapalı) direkt dashboard'a
    if (data.session) {
      router.push("/dashboard");
      router.refresh();
    } else {
      // E-posta onayı bekleniyor
      setEG(true);
    }
  };

  // E-posta onay bekleme ekranı
  if (emailGonderildi) {
    return (
      <div className="min-h-screen bg-[#0e172a] flex items-center justify-center p-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[#fbc024] opacity-5 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-[#fbc024] opacity-5 blur-3xl" />
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm relative"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-[#fbc024] flex items-center justify-center mb-4">
              <Plane className="w-7 h-7 text-[#0e172a] rotate-45" />
            </div>
            <h1 className="text-2xl font-black text-white">Pilot Sensin</h1>
          </div>
          <div className="glass-card rounded-2xl p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-[rgba(251,192,36,0.12)] border border-[rgba(251,192,36,0.25)] flex items-center justify-center mx-auto">
              <MailCheck className="w-8 h-8 text-[#fbc024]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white mb-2">E-postanı Onayla</h2>
              <p className="text-sm text-[#94a3b8] leading-relaxed">
                <span className="text-white font-medium">{form.email}</span> adresine onay bağlantısı gönderdik. Bağlantıya tıklayarak hesabını aktifleştir.
              </p>
            </div>
            <div className="text-xs text-[#94a3b8] bg-[rgba(255,255,255,0.04)] rounded-xl p-3">
              E-posta gelmediyse spam klasörünü kontrol et.
            </div>
            <Link href="/giris" className="block w-full py-3 rounded-xl bg-[#fbc024] text-[#0e172a] text-sm font-bold hover:bg-[#d9a61f] transition-colors">
              Giriş Sayfasına Git
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

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
          <p className="text-sm text-[#94a3b8] mt-1">İşletmenizi büyütmeye hazır mısınız?</p>
        </div>

        {/* Adım göstergesi */}
        <div className="flex items-center gap-2 mb-6 justify-center">
          {([1, 2] as const).map((n) => (
            <div key={n} className="flex items-center gap-2">
              <div className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all"
                style={{
                  backgroundColor: adim >= n ? "#fbc024" : "rgba(255,255,255,0.08)",
                  color: adim >= n ? "#0e172a" : "#94a3b8",
                }}>
                {adim > n ? <CheckCircle2 className="w-4 h-4" /> : n}
              </div>
              <span className="text-xs text-[#94a3b8]">{n === 1 ? "Hesap" : "İşletme"}</span>
              {n < 2 && <div className="w-8 h-px bg-[rgba(255,255,255,0.1)]" />}
            </div>
          ))}
        </div>

        <div className="glass-card rounded-2xl p-7 space-y-5">
          {hata && (
            <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.25)]">
              <AlertCircle className="w-4 h-4 text-[#ef4444] shrink-0" />
              <p className="text-sm text-[#ef4444]">{hata}</p>
            </motion.div>
          )}

          {/* Adım 1 */}
          {adim === 1 && (
            <form onSubmit={handleAdim1} className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-white">Hesap Bilgileri</h2>
                <p className="text-xs text-[#94a3b8] mt-0.5">Giriş için kullanılacak bilgiler</p>
              </div>

              {/* Google OAuth */}
              <button
                type="button"
                onClick={handleGoogle}
                disabled={googleYuk}
                className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl border border-[rgba(255,255,255,0.12)] text-white text-sm font-medium hover:bg-[rgba(255,255,255,0.06)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {googleYuk ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <GoogleIcon />
                )}
                {googleYuk ? "Yönlendiriliyor..." : "Google ile Kayıt Ol"}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-[rgba(255,255,255,0.08)]" />
                <span className="text-xs text-[#475569]">veya e-posta ile</span>
                <div className="flex-1 h-px bg-[rgba(255,255,255,0.08)]" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">Ad *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94a3b8]" />
                    <input required value={form.ad} onChange={(e) => set("ad", e.target.value)}
                      placeholder="Adınız"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#94a3b8] focus:outline-none focus:border-[rgba(251,192,36,0.5)] transition-colors text-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">Soyad</label>
                  <input value={form.soyad} onChange={(e) => set("soyad", e.target.value)}
                    placeholder="Soyadınız"
                    className="w-full px-3 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#94a3b8] focus:outline-none focus:border-[rgba(251,192,36,0.5)] transition-colors text-sm" />
                </div>
              </div>

              <div>
                <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">E-posta *</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
                  <input type="email" required value={form.email} onChange={(e) => set("email", e.target.value)}
                    placeholder="ornek@isletme.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#94a3b8] focus:outline-none focus:border-[rgba(251,192,36,0.5)] transition-colors text-sm" />
                </div>
              </div>

              <div>
                <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">Şifre * (min. 6 karakter)</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
                  <input type={goster ? "text" : "password"} required value={form.password}
                    onChange={(e) => set("password", e.target.value)} placeholder="••••••••"
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#94a3b8] focus:outline-none focus:border-[rgba(251,192,36,0.5)] transition-colors text-sm" />
                  <button type="button" onClick={() => setGoster(!goster)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-white transition-colors">
                    {goster ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">Şifre Tekrar *</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
                  <input type={goster ? "text" : "password"} required value={form.passwordTekrar}
                    onChange={(e) => set("passwordTekrar", e.target.value)} placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#94a3b8] focus:outline-none focus:border-[rgba(251,192,36,0.5)] transition-colors text-sm"
                    style={{ borderColor: form.passwordTekrar && form.password !== form.passwordTekrar ? "rgba(239,68,68,0.5)" : undefined }} />
                </div>
              </div>

              <button type="submit" className="w-full py-3 rounded-xl bg-[#fbc024] text-[#0e172a] text-sm font-bold hover:bg-[#d9a61f] transition-colors">
                Devam Et →
              </button>
            </form>
          )}

          {/* Adım 2 */}
          {adim === 2 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-white">İşletme Bilgileri</h2>
                <p className="text-xs text-[#94a3b8] mt-0.5">İşletmenizi tanımlayın</p>
              </div>

              <div>
                <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">İşletme Adı *</label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
                  <input required value={form.businessAd} onChange={(e) => set("businessAd", e.target.value)}
                    placeholder="örn. Yılmaz Market"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#94a3b8] focus:outline-none focus:border-[rgba(251,192,36,0.5)] transition-colors text-sm" />
                </div>
              </div>

              <div>
                <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">Sektör</label>
                <select value={form.sektor} onChange={(e) => set("sektor", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white focus:outline-none focus:border-[rgba(251,192,36,0.5)] transition-colors text-sm">
                  {SEKTORLER.map((s) => <option key={s} value={s} className="bg-[#0e172a]">{s}</option>)}
                </select>
              </div>

              {/* Yasal kabul checkbox */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setYasalKabul(v => !v)}
                onKeyDown={e => e.key === " " && setYasalKabul(v => !v)}
                className="flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none"
                style={{
                  borderColor:     yasalKabul ? "rgba(251,192,36,0.4)" : "rgba(255,255,255,0.1)",
                  backgroundColor: yasalKabul ? "rgba(251,192,36,0.06)" : "rgba(255,255,255,0.02)",
                }}
              >
                <div
                  className="w-4 h-4 rounded flex items-center justify-center shrink-0 mt-0.5 transition-colors"
                  style={{
                    backgroundColor: yasalKabul ? "#fbc024" : "transparent",
                    border: yasalKabul ? "1.5px solid #fbc024" : "1.5px solid rgba(255,255,255,0.25)",
                  }}
                >
                  {yasalKabul && <Check className="w-3 h-3 text-[#0e172a]" />}
                </div>
                <p className="text-xs text-[#94a3b8] leading-relaxed">
                  <Link href="/politikalar/kullanim-kosullari" target="_blank" onClick={e => e.stopPropagation()} className="text-[#fbc024] hover:underline">Kullanım Koşulları</Link>
                  {", "}
                  <Link href="/politikalar/gizlilik" target="_blank" onClick={e => e.stopPropagation()} className="text-[#fbc024] hover:underline">Gizlilik Politikası</Link>
                  {" ve verilerimin aktarılmasına ilişkin "}
                  <Link href="/politikalar/acik-riza" target="_blank" onClick={e => e.stopPropagation()} className="text-[#fbc024] hover:underline">Açık Rıza Metni</Link>
                  {"'ni okudum, kabul ediyorum."}
                </p>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => { setAdim(1); setHata(""); }}
                  className="flex-1 py-3 rounded-xl border border-[rgba(255,255,255,0.1)] text-[#94a3b8] text-sm font-medium hover:bg-[rgba(255,255,255,0.05)] transition-colors">
                  ← Geri
                </button>
                <button type="submit" disabled={yukleniyor || !yasalKabul}
                  className="flex-1 py-3 rounded-xl bg-[#fbc024] text-[#0e172a] text-sm font-bold hover:bg-[#d9a61f] transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                  {yukleniyor ? "Kaydediliyor..." : "Hesap Oluştur"}
                </button>
              </div>
            </form>
          )}

          <p className="text-center text-sm text-[#94a3b8]">
            Zaten hesabınız var mı?{" "}
            <Link href="/giris" className="text-[#fbc024] font-semibold hover:underline">Giriş Yap</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
