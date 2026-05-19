"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plane, Building2, AlertCircle } from "lucide-react";
import { useSirket } from "@/store/sirket";

export default function OnboardingPage() {
  const router = useRouter();
  const { yukle } = useSirket();
  const [sirketAdi, setSirketAdi] = useState("");
  const [yukleniyor, setYuk]      = useState(false);
  const [hata, setHata]           = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sirketAdi.trim()) { setHata("Şirket adı zorunlu."); return; }
    setHata("");
    setYuk(true);
    try {
      const res = await fetch("/api/sirket/kur", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sirketAdi: sirketAdi.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.companyId) {
        setHata(json.error ?? "Şirket oluşturulamadı. Lütfen tekrar deneyin.");
        return;
      }
      await yukle();
      router.replace("/dashboard");
    } catch {
      setHata("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setYuk(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--forest)] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[var(--forest)] opacity-5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-[var(--forest)] opacity-5 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm relative"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[var(--forest)] flex items-center justify-center mb-4 shadow-lg shadow-[var(--leaf)]/20">
            <Plane className="w-7 h-7 text-gray-900 rotate-45" />
          </div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">Hoş Geldiniz!</h1>
          <p className="text-sm text-gray-400 mt-1 text-center">
            Başlamak için şirketinizi kurun
          </p>
        </div>

        <div className="card rounded-2xl p-7 space-y-5">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Şirket Kur</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Siz Pilot olacaksınız — ekibinizi daha sonra davet edebilirsiniz.
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
              <label className="text-xs text-gray-400 font-medium block mb-1.5">Şirket / İşletme Adı</label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  required
                  autoFocus
                  value={sirketAdi}
                  onChange={(e) => setSirketAdi(e.target.value)}
                  placeholder="örn. Yılmaz Market"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-[#94a3b8] focus:outline-none focus:border-[var(--leaf)] transition-colors text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={yukleniyor}
              className="w-full py-3 rounded-xl bg-[var(--forest)] text-gray-800 text-sm font-bold hover:opacity-90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {yukleniyor ? "Oluşturuluyor..." : "Şirketi Kur ve Başla →"}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
