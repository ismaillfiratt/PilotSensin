"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Save, CheckCircle2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface Props {
  ad: string;
  soyad: string;
  telefon: string;
}

export default function KisiselBilgiler({ ad, soyad, telefon }: Props) {
  const [form, setForm]      = useState({ ad, soyad, telefon });
  const [yukleniyor, setYuk] = useState(false);
  const [basarili, setBasarili] = useState(false);
  const [hata, setHata]      = useState("");

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setHata("");
    setYuk(true);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      data: { ad: form.ad, soyad: form.soyad, telefon: form.telefon },
    });

    setYuk(false);

    if (error) {
      setHata("Bilgiler kaydedilemedi.");
      return;
    }

    setBasarili(true);
    setTimeout(() => setBasarili(false), 3000);
  };

  return (
    <div className="glass-card rounded-2xl p-6">
      <h2 className="text-sm font-semibold text-white mb-5">Kişisel Bilgiler</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">Ad *</label>
            <input
              required value={form.ad} onChange={(e) => set("ad", e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#94a3b8] focus:outline-none focus:border-[rgba(251,192,36,0.5)] transition-colors text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">Soyad</label>
            <input
              value={form.soyad} onChange={(e) => set("soyad", e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#94a3b8] focus:outline-none focus:border-[rgba(251,192,36,0.5)] transition-colors text-sm"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">Telefon</label>
          <input
            type="tel" value={form.telefon} onChange={(e) => set("telefon", e.target.value)}
            placeholder="+90 5xx xxx xx xx"
            className="w-full px-3 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#94a3b8] focus:outline-none focus:border-[rgba(251,192,36,0.5)] transition-colors text-sm"
          />
        </div>

        {hata && <p className="text-sm text-[#ef4444]">{hata}</p>}

        <div className="flex items-center justify-between pt-2">
          {basarili && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-[#22c55e] text-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              Kaydedildi
            </motion.div>
          )}
          <button
            type="submit"
            disabled={yukleniyor}
            className="ml-auto flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#fbc024] text-[#0e172a] text-sm font-bold hover:bg-[#d9a61f] transition-colors disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {yukleniyor ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </form>
    </div>
  );
}
