"use client";

import { useState } from "react";
import { motion }   from "framer-motion";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import { createClient }    from "@/utils/supabase/client";
import { aktiviteKaydet }  from "@/lib/aktiviteLog";

const KART_STIL = { border: "0.5px solid rgba(0,0,0,0.08)" };

export default function SifrePanel() {
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
    if (form.yeni.length < 6)      { setHata("Şifre en az 6 karakter olmalı."); return; }

    setYuk(true);
    const { error } = await createClient().auth.updateUser({ password: form.yeni });
    setYuk(false);

    if (error) {
      setHata("Şifre güncellenemedi. Lütfen tekrar oturum açın.");
      return;
    }

    aktiviteKaydet({
      modul: "profil",
      eylem: "sifre-degistir",
      ozet:  "Hesap şifresini değiştirdi",
    });

    setForm({ yeni: "", tekrar: "" });
    setBasarili(true);
    setTimeout(() => setBasarili(false), 3000);
  };

  return (
    <div className="space-y-4">

      {/* Panel başlık */}
      <div>
        <p className="label-caps">HESAP & GÜVENLİK</p>
        <h2 className="text-xl font-medium text-gray-900 mt-1">Şifre</h2>
        <p className="text-sm text-gray-500 mt-1">
          Hesabını korumak için düzenli olarak şifreni güncelle
        </p>
      </div>

      {/* ── Şifre değiştir kartı ── */}
      <div className="bg-white rounded-xl p-5 space-y-4" style={KART_STIL}>
        <div>
          <p className="text-sm font-medium text-gray-800">Şifre Değiştir</p>
          <p className="text-xs text-gray-500 mt-0.5">
            En az 6 karakter — küçük büyük harf ve sayı önerilir
          </p>
        </div>

        {/* Hata banner */}
        {hata && (
          <motion.div
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg"
            style={{ background: "rgba(239,68,68,0.08)", color: "#C97676" }}
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p className="text-sm">{hata}</p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Yeni Şifre */}
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1.5">
              Yeni Şifre
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={goster ? "text" : "password"}
                required
                value={form.yeni}
                onChange={(e) => set("yeni", e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors text-sm"
              />
              <button
                type="button"
                onClick={() => setGoster(!goster)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {goster ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Şifre Tekrar */}
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1.5">
              Şifre Tekrar
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={goster ? "text" : "password"}
                required
                value={form.tekrar}
                onChange={(e) => set("tekrar", e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors text-sm"
                style={
                  form.tekrar && form.yeni !== form.tekrar
                    ? { borderColor: "rgba(239,68,68,0.5)" }
                    : undefined
                }
              />
            </div>
          </div>

          {/* Alt satır: başarı + buton */}
          <div className="flex items-center justify-between pt-1">
            {basarili ? (
              <motion.div
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-sm"
                style={{ color: "#047857" }}
              >
                <CheckCircle2 className="w-4 h-4" />
                Şifre güncellendi
              </motion.div>
            ) : (
              <span />
            )}
            <button
              type="submit"
              disabled={yukleniyor}
              className="ml-auto px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-60"
              style={{ backgroundColor: "var(--forest)" }}
            >
              {yukleniyor ? "Güncelleniyor..." : "Şifreyi Güncelle"}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
