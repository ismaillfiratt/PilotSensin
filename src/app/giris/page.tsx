"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plane, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function GirisPage() {
  const router = useRouter();
  const [form, setForm]      = useState({ email: "", password: "" });
  const [goster, setGoster]  = useState(false);
  const [hata, setHata]      = useState("");
  const [yukleniyor, setYuk] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setHata("");
    setYuk(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email:    form.email,
      password: form.password,
    });

    setYuk(false);

    if (error) {
      setHata("E-posta veya şifre hatalı.");
    } else {
      router.push("/dashboard");
      router.refresh();
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">E-posta</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
                <input
                  type="email" required autoComplete="email"
                  value={form.email} onChange={(e) => set("email", e.target.value)}
                  placeholder="ornek@isletme.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#94a3b8] focus:outline-none focus:border-[rgba(251,192,36,0.5)] transition-colors text-sm"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-[#94a3b8] font-medium">Şifre</label>
                <Link href="/sifre-sifirla" className="text-xs text-[#fbc024] hover:underline">
                  Şifremi unuttum
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
                <input
                  type={goster ? "text" : "password"} required autoComplete="current-password"
                  value={form.password} onChange={(e) => set("password", e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-3 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#94a3b8] focus:outline-none focus:border-[rgba(251,192,36,0.5)] transition-colors text-sm"
                />
                <button type="button" onClick={() => setGoster(!goster)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-white transition-colors">
                  {goster ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={yukleniyor}
              className="w-full py-3 rounded-xl bg-[#fbc024] text-[#0e172a] text-sm font-bold hover:bg-[#d9a61f] transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
              {yukleniyor ? "Giriş yapılıyor..." : "Giriş Yap"}
            </button>
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
