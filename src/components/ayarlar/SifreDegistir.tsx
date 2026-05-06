"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function SifreDegistir() {
  const [form, setForm]         = useState({ yeni: "", tekrar: "" });
  const [goster, setGoster]     = useState(false);
  const [yukleniyor, setYuk]    = useState(false);
  const [basarili, setBasarili] = useState(false);
  const [hata, setHata]         = useState("");

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setHata("");

    if (form.yeni !== form.tekrar) { setHata("Şifreler eşleşmiyor."); return; }
    if (form.yeni.length < 6) { setHata("Şifre en az 6 karakter olmalı."); return; }

    setYuk(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: form.yeni });
    setYuk(false);

    if (error) {
      setHata("Şifre güncellenemedi. Lütfen tekrar oturum açın.");
      return;
    }

    setForm({ yeni: "", tekrar: "" });
    setBasarili(true);
    setTimeout(() => setBasarili(false), 3000);
  };

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-lg bg-[rgba(148,163,184,0.1)] border border-[rgba(148,163,184,0.2)] flex items-center justify-center">
          <Lock className="w-4 h-4 text-[#94a3b8]" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">Şifre Değiştir</h2>
          <p className="text-xs text-[#94a3b8]">Hesap güvenliği için düzenli güncelle</p>
        </div>
      </div>

      {hata && (
        <motion.div
          initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.25)] mb-4"
        >
          <AlertCircle className="w-4 h-4 text-[#ef4444] shrink-0" />
          <p className="text-sm text-[#ef4444]">{hata}</p>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">Yeni Şifre</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
            <input
              type={goster ? "text" : "password"} required value={form.yeni}
              onChange={(e) => set("yeni", e.target.value)} placeholder="••••••••"
              className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#94a3b8] focus:outline-none focus:border-[rgba(251,192,36,0.5)] transition-colors text-sm"
            />
            <button type="button" onClick={() => setGoster(!goster)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-white transition-colors">
              {goster ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">Şifre Tekrar</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
            <input
              type={goster ? "text" : "password"} required value={form.tekrar}
              onChange={(e) => set("tekrar", e.target.value)} placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#94a3b8] focus:outline-none focus:border-[rgba(251,192,36,0.5)] transition-colors text-sm"
              style={{ borderColor: form.tekrar && form.yeni !== form.tekrar ? "rgba(239,68,68,0.5)" : undefined }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          {basarili && (
            <motion.div
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-[#22c55e] text-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              Şifre güncellendi
            </motion.div>
          )}
          <button
            type="submit" disabled={yukleniyor}
            className="ml-auto px-5 py-2.5 rounded-xl bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.1)] text-white text-sm font-medium hover:bg-[rgba(255,255,255,0.12)] transition-colors disabled:opacity-60"
          >
            {yukleniyor ? "Güncelleniyor..." : "Şifreyi Güncelle"}
          </button>
        </div>
      </form>
    </div>
  );
}
