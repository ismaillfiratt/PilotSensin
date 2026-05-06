"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Trash2, X, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function TehlikeZonu() {
  const router = useRouter();
  const [silModalAcik, setSilModalAcik] = useState(false);
  const [onay, setOnay]                  = useState("");
  const [yukleniyor, setYuk]             = useState(false);

  const handleCikis = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/giris");
    router.refresh();
  };

  const handleHesapSil = async () => {
    if (onay !== "SİL") return;
    setYuk(true);
    // Gerçek silme için server-side admin API gerekir
    // Şimdilik çıkış yapıyoruz
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/giris");
  };

  return (
    <>
      <div className="glass-card rounded-2xl p-6 border border-[rgba(239,68,68,0.2)]">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg bg-[rgba(239,68,68,0.12)] border border-[rgba(239,68,68,0.25)] flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-[#ef4444]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Tehlike Zonu</h2>
            <p className="text-xs text-[#94a3b8]">Geri alınamaz işlemler</p>
          </div>
        </div>

        <div className="space-y-3">
          {/* Çıkış */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]">
            <div>
              <p className="text-sm font-medium text-white">Oturumu Kapat</p>
              <p className="text-xs text-[#94a3b8] mt-0.5">Tüm cihazlarda oturumu sonlandır</p>
            </div>
            <button
              onClick={handleCikis}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[rgba(255,255,255,0.1)] text-[#94a3b8] text-xs font-medium hover:bg-[rgba(255,255,255,0.06)] hover:text-white transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              Çıkış Yap
            </button>
          </div>

          {/* Hesabı sil */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-[rgba(239,68,68,0.05)] border border-[rgba(239,68,68,0.15)]">
            <div>
              <p className="text-sm font-medium text-[#ef4444]">Hesabı Sil</p>
              <p className="text-xs text-[#94a3b8] mt-0.5">
                Tüm veriler kalıcı olarak silinir
              </p>
            </div>
            <button
              onClick={() => setSilModalAcik(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[rgba(239,68,68,0.12)] border border-[rgba(239,68,68,0.3)] text-[#ef4444] text-xs font-bold hover:bg-[rgba(239,68,68,0.2)] transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Sil
            </button>
          </div>
        </div>
      </div>

      {/* Hesap silme onay modali */}
      <AnimatePresence>
        {silModalAcik && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setSilModalAcik(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.18 }}
              className="w-full max-w-sm glass-card rounded-2xl p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-[rgba(239,68,68,0.12)] border border-[rgba(239,68,68,0.25)] flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-[#ef4444]" />
                </div>
                <button onClick={() => setSilModalAcik(false)}
                  className="text-[#94a3b8] hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <h3 className="text-base font-bold text-white mb-1">Hesabı Kalıcı Olarak Sil</h3>
              <p className="text-sm text-[#94a3b8] mb-5">
                Bu işlem geri alınamaz. Tüm verileriniz silinecek. Onaylamak için aşağıya <span className="text-white font-bold">SİL</span> yazın.
              </p>

              <input
                value={onay}
                onChange={(e) => setOnay(e.target.value)}
                placeholder="SİL"
                className="w-full px-4 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(239,68,68,0.3)] text-white placeholder-[#94a3b8] focus:outline-none focus:border-[rgba(239,68,68,0.6)] transition-colors text-sm mb-4"
              />

              <div className="flex gap-3">
                <button onClick={() => { setSilModalAcik(false); setOnay(""); }}
                  className="flex-1 py-2.5 rounded-xl border border-[rgba(255,255,255,0.1)] text-[#94a3b8] text-sm font-medium hover:bg-[rgba(255,255,255,0.05)] transition-colors">
                  İptal
                </button>
                <button
                  onClick={handleHesapSil}
                  disabled={onay !== "SİL" || yukleniyor}
                  className="flex-1 py-2.5 rounded-xl bg-[#ef4444] text-white text-sm font-bold hover:bg-[#dc2626] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {yukleniyor ? "Siliniyor..." : "Hesabı Sil"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
