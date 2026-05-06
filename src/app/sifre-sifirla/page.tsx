"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plane, Mail, AlertCircle, MailCheck, ArrowLeft } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function SifreSifirlaPage() {
  const [email, setEmail]         = useState("");
  const [yukleniyor, setYuk]      = useState(false);
  const [hata, setHata]           = useState("");
  const [gonderildi, setGonderildi] = useState(false);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setHata("");
    setYuk(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/sifre-sifirla/yeni`,
    });

    setYuk(false);

    if (error) {
      setHata("İstek gönderilemedi. Lütfen tekrar deneyin.");
      return;
    }

    setGonderildi(true);
  };

  if (gonderildi) {
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
              <h2 className="text-lg font-bold text-white mb-2">E-postanı Kontrol Et</h2>
              <p className="text-sm text-[#94a3b8] leading-relaxed">
                <span className="text-white font-medium">{email}</span> adresine şifre sıfırlama bağlantısı gönderdik.
              </p>
            </div>
            <div className="text-xs text-[#94a3b8] bg-[rgba(255,255,255,0.04)] rounded-xl p-3">
              Bağlantı 1 saat geçerlidir. E-posta gelmediyse spam klasörünü kontrol et.
            </div>
            <Link href="/giris"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-[rgba(255,255,255,0.1)] text-[#94a3b8] text-sm font-medium hover:bg-[rgba(255,255,255,0.05)] transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Giriş Sayfasına Dön
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
          <p className="text-sm text-[#94a3b8] mt-1">Şifreni sıfırla</p>
        </div>

        <div className="glass-card rounded-2xl p-7 space-y-5">
          <div>
            <h2 className="text-lg font-bold text-white">Şifremi Unuttum</h2>
            <p className="text-xs text-[#94a3b8] mt-0.5">
              E-posta adresini gir, sıfırlama bağlantısı gönderelim.
            </p>
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">
                E-posta Adresi
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@isletme.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#94a3b8] focus:outline-none focus:border-[rgba(251,192,36,0.5)] transition-colors text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={yukleniyor}
              className="w-full py-3 rounded-xl bg-[#fbc024] text-[#0e172a] text-sm font-bold hover:bg-[#d9a61f] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {yukleniyor ? "Gönderiliyor..." : "Sıfırlama Bağlantısı Gönder"}
            </button>
          </form>

          <Link
            href="/giris"
            className="flex items-center justify-center gap-2 text-sm text-[#94a3b8] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Giriş sayfasına dön
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
