"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Trash2, X, LogOut, ShieldOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function TehlikeZonu() {
  const router = useRouter();
  const [silModalAcik,  setSilModalAcik]  = useState(false);
  const [rizaModalAcik, setRizaModalAcik] = useState(false);
  const [onay, setOnay]                    = useState("");
  const [rizaOnay, setRizaOnay]            = useState("");
  const [yukleniyor, setYuk]               = useState(false);

  const handleCikis = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/giris");
    router.refresh();
  };

  const handleHesapSil = async () => {
    if (onay !== "SİL") return;
    setYuk(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/giris");
  };

  const handleRizaGeriCek = async () => {
    if (rizaOnay !== "RIZAYI GERİ ÇEKİYORUM") return;
    setYuk(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/giris");
  };

  return (
    <>
      <div className="card rounded-2xl p-6 border border-[rgba(239,68,68,0.2)]">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg bg-[rgba(239,68,68,0.12)] border border-[rgba(239,68,68,0.25)] flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-[#ef4444]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-800">Tehlike Zonu</h2>
            <p className="text-xs text-gray-400">Geri alınamaz işlemler</p>
          </div>
        </div>

        <div className="space-y-3">
          {/* Çıkış */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-200">
            <div>
              <p className="text-sm font-medium text-gray-800">Oturumu Kapat</p>
              <p className="text-xs text-gray-400 mt-0.5">Tüm cihazlarda oturumu sonlandır</p>
            </div>
            <button
              onClick={handleCikis}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-400 text-xs font-medium hover:bg-gray-50 hover:text-gray-800 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              Çıkış Yap
            </button>
          </div>

          {/* Açık rıza geri çekme */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-[rgba(239,68,68,0.05)] border border-[rgba(239,68,68,0.1)]">
            <div className="flex-1 min-w-0 pr-4">
              <p className="text-sm font-medium text-[#ef4444]">Açık Rıza Geri Çekme</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Kayıt sırasında verdiğiniz açık rızayı geri çekmek isterseniz hesabınız ve
                tüm verileriniz silinir.
              </p>
            </div>
            <button
              onClick={() => setRizaModalAcik(true)}
              className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.25)] text-[#ef4444] text-xs font-bold hover:bg-[rgba(239,68,68,0.15)] transition-all"
            >
              <ShieldOff className="w-3.5 h-3.5" />
              Geri Çek
            </button>
          </div>

          {/* Hesabı sil */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-[rgba(239,68,68,0.05)] border border-[rgba(239,68,68,0.15)]">
            <div>
              <p className="text-sm font-medium text-[#ef4444]">Hesabı Sil</p>
              <p className="text-xs text-gray-400 mt-0.5">
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

      {/* Açık rıza geri çekme modali */}
      <AnimatePresence>
        {rizaModalAcik && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setRizaModalAcik(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.18 }}
              className="w-full max-w-sm card rounded-2xl p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-[rgba(239,68,68,0.12)] border border-[rgba(239,68,68,0.25)] flex items-center justify-center">
                  <ShieldOff className="w-6 h-6 text-[#ef4444]" />
                </div>
                <button onClick={() => { setRizaModalAcik(false); setRizaOnay(""); }}
                  className="text-gray-400 hover:text-gray-800 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <h3 className="text-base font-bold text-gray-800 mb-1">Açık Rızayı Geri Çek ve Hesabı Sil</h3>
              <div className="space-y-2 mb-4">
                <p className="text-xs text-gray-400">Bu işlem geri alınamaz. Devam etmeniz durumunda:</p>
                <ul className="space-y-1.5 text-xs text-gray-400 list-disc list-inside">
                  <li>Tüm hesap verileriniz silinecek</li>
                  <li>Mali kayıtlar VUK gereği 10 yıl daha saklanır</li>
                  <li>Bu işlem geri alınamaz</li>
                </ul>
              </div>
              <p className="text-xs text-gray-400 mb-2">
                Onaylamak için aşağıya{" "}
                <span className="text-gray-800 font-bold">RIZAYI GERİ ÇEKİYORUM</span>{" "}
                yazın.
              </p>
              <input
                value={rizaOnay}
                onChange={(e) => setRizaOnay(e.target.value)}
                placeholder="RIZAYI GERİ ÇEKİYORUM"
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-[rgba(239,68,68,0.3)] text-gray-800 placeholder-[#475569] focus:outline-none focus:border-[rgba(239,68,68,0.6)] transition-colors text-sm mb-4"
              />
              <div className="flex gap-3">
                <button onClick={() => { setRizaModalAcik(false); setRizaOnay(""); }}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-400 text-sm font-medium hover:bg-gray-50 transition-colors">
                  İptal
                </button>
                <button
                  onClick={handleRizaGeriCek}
                  disabled={rizaOnay !== "RIZAYI GERİ ÇEKİYORUM" || yukleniyor}
                  className="flex-1 py-2.5 rounded-xl bg-[#ef4444] text-gray-800 text-sm font-bold hover:bg-[#dc2626] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {yukleniyor ? "İşleniyor..." : "Rızayı Geri Çek"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              className="w-full max-w-sm card rounded-2xl p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-[rgba(239,68,68,0.12)] border border-[rgba(239,68,68,0.25)] flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-[#ef4444]" />
                </div>
                <button onClick={() => setSilModalAcik(false)}
                  className="text-gray-400 hover:text-gray-800 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <h3 className="text-base font-bold text-gray-800 mb-1">Hesabı Kalıcı Olarak Sil</h3>
              <p className="text-sm text-gray-400 mb-5">
                Bu işlem geri alınamaz. Tüm verileriniz silinecek. Onaylamak için aşağıya <span className="text-gray-800 font-bold">SİL</span> yazın.
              </p>

              <input
                value={onay}
                onChange={(e) => setOnay(e.target.value)}
                placeholder="SİL"
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-[rgba(239,68,68,0.3)] text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[rgba(239,68,68,0.6)] transition-colors text-sm mb-4"
              />

              <div className="flex gap-3">
                <button onClick={() => { setSilModalAcik(false); setOnay(""); }}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-400 text-sm font-medium hover:bg-gray-50 transition-colors">
                  İptal
                </button>
                <button
                  onClick={handleHesapSil}
                  disabled={onay !== "SİL" || yukleniyor}
                  className="flex-1 py-2.5 rounded-xl bg-[#ef4444] text-gray-800 text-sm font-bold hover:bg-[#dc2626] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
