"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plane, Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function YeniSifrePage() {
  const router = useRouter();
  const [form, setForm]         = useState({ password: "", tekrar: "" });
  const [goster, setGoster]     = useState(false);
  const [hata, setHata]         = useState("");
  const [yukleniyor, setYuk]    = useState(false);
  const [basarili, setBasarili] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (form.password !== form.tekrar) { setHata("Şifreler eşleşmiyor."); return; }
    if (form.password.length < 6) { setHata("Şifre en az 6 karakter olmalı."); return; }
    setHata("");
    setYuk(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: form.password });
    setYuk(false);
    if (error) { setHata("Şifre güncellenemedi. Bağlantı süresi dolmuş olabilir."); return; }
    setBasarili(true);
    setTimeout(() => router.push("/dashboard"), 2000);
  };

  if (basarili) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm">
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center space-y-5 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-2">Şifren Güncellendi!</h2>
              <p className="text-sm text-gray-400">Dashboard&apos;a yönlendiriliyorsun...</p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-sm"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-md" style={{ background: "var(--forest)" }}>
            <Plane className="w-7 h-7 text-white rotate-45" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Pilot Sensin</h1>
          <p className="text-sm text-gray-400 mt-1">Yeni şifreni belirle</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-7 space-y-5 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Yeni Şifre</h2>
            <p className="text-xs text-gray-400 mt-0.5">En az 6 karakter olmalı.</p>
          </div>

          {hata && (
            <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-sm text-red-600">{hata}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1.5">Yeni Şifre</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type={goster ? "text" : "password"} required value={form.password}
                  onChange={(e) => set("password", e.target.value)} placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-3 rounded-xl bg-white border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-(--leaf) transition-colors text-sm" />
                <button type="button" onClick={() => setGoster(!goster)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors">
                  {goster ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1.5">Şifre Tekrar</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type={goster ? "text" : "password"} required value={form.tekrar}
                  onChange={(e) => set("tekrar", e.target.value)} placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-(--leaf) transition-colors text-sm"
                  style={{ borderColor: form.tekrar && form.password !== form.tekrar ? "#FCA5A5" : undefined }} />
              </div>
            </div>

            <button type="submit" disabled={yukleniyor}
              className="w-full py-3 rounded-xl text-white text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "var(--forest)" }}>
              {yukleniyor ? "Güncelleniyor..." : "Şifremi Güncelle"}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
