"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2 } from "lucide-react";
import { useOnay } from "@/store/onay";

export default function OnayDialog() {
  const { acik, secenek, onayla, vazgec, bu_oturumdaSusturuldu } = useOnay();

  const [kaskad,           setKaskad]           = useState(true);
  const [oturumdaSusturma, setOturumdaSusturma] = useState(false);
  const [silDisabled,      setSilDisabled]       = useState(false);

  const vazgecRef = useRef<HTMLButtonElement>(null);

  /* Her açılışta checkbox'ları sıfırla, Vazgeç'e focus ver */
  useEffect(() => {
    if (acik) {
      setKaskad(true);
      setOturumdaSusturma(false);
      setSilDisabled(false);
      // Küçük gecikme — animasyon tamamlanınca focus
      const t = setTimeout(() => vazgecRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [acik]);

  /* ESC → vazgeç */
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") { e.preventDefault(); vazgec(); }
  }, [vazgec]);

  useEffect(() => {
    if (acik) {
      document.addEventListener("keydown", handleKey);
      return () => document.removeEventListener("keydown", handleKey);
    }
  }, [acik, handleKey]);

  const handleOnayla = () => {
    if (silDisabled) return;
    setSilDisabled(true);
    if (oturumdaSusturma && secenek) {
      bu_oturumdaSusturuldu(secenek.tip);
    }
    onayla(kaskad);
  };

  return (
    <AnimatePresence>
      {acik && secenek && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
            onClick={vazgec}
          />

          {/* Sheet / Dialog */}
          <motion.div
            key="dialog"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.3 }}
            onDragEnd={(_, info) => { if (info.velocity.y > 300 || info.offset.y > 100) vazgec(); }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed z-[201] bg-[#0e172a] glass-card bottom-0 inset-x-0 rounded-t-2xl border-t border-white/10 md:bottom-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:border md:max-w-md md:w-full"
          >
            {/* Mobil drag handle */}
            <div className="md:hidden flex justify-center pt-3 pb-1 cursor-grab">
              <div className="w-12 h-1 rounded-full bg-white/20" />
            </div>

            <div className="px-5 pt-5 pb-2 space-y-4">
              {/* İkon + Başlık */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5 text-red-400" />
                </div>
                <h2 className="text-lg font-bold text-white">Silme Onayı</h2>
              </div>

              {/* Açıklama */}
              <p className="text-sm text-[#94a3b8] leading-relaxed">
                <span className="text-white font-semibold">&ldquo;{secenek.isim}&rdquo;</span>{" "}
                kaydını silmek istediğine emin misin?
              </p>

              {/* Bağlı kayıt uyarısı */}
              {secenek.kaskadBaglıSayisi > 0 && (
                <p className="text-xs text-amber-400 bg-amber-400/8 border border-amber-400/20 rounded-xl px-3 py-2">
                  Bu kayda bağlı <span className="font-bold">{secenek.kaskadBaglıSayisi}</span> kayıt daha var.
                </p>
              )}

              {/* Kaskad checkbox */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={kaskad}
                  onChange={(e) => setKaskad(e.target.checked)}
                  className="mt-0.5 min-w-[18px] min-h-[18px] rounded accent-red-500 cursor-pointer"
                />
                <span className="text-sm text-[#94a3b8] group-hover:text-white transition-colors leading-snug">
                  Bağlı kayıtları da sil
                </span>
              </label>

              {/* Oturumda susturma checkbox */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={oturumdaSusturma}
                  onChange={(e) => setOturumdaSusturma(e.target.checked)}
                  className="mt-0.5 min-w-[18px] min-h-[18px] rounded accent-[#fbc024] cursor-pointer"
                />
                <span className="text-sm text-[#64748b] group-hover:text-[#94a3b8] transition-colors leading-snug">
                  Bu oturumda bu tip kayıt için bir daha sorma
                </span>
              </label>

              {/* Çöp kutusu notu */}
              <p className="text-xs text-[#475569] bg-white/3 rounded-xl px-3 py-2">
                30 gün boyunca çöp kutusunda kalır, sonra kalıcı silinir.
              </p>
            </div>

            {/* Butonlar — sticky footer */}
            <div
              className="sticky bottom-0 bg-[#0e172a] px-5 pt-3 pb-4 md:pb-5"
              style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 20px)" }}
            >
              <div className="flex gap-3">
                <button
                  ref={vazgecRef}
                  type="button"
                  onClick={vazgec}
                  className="flex-1 min-h-12 rounded-xl border border-white/10 bg-white/5 text-[#94a3b8] text-sm font-semibold hover:bg-white/8 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
                >
                  {secenek.iptalMetni ?? "Vazgeç"}
                </button>
                <button
                  type="button"
                  onClick={handleOnayla}
                  disabled={silDisabled}
                  className="flex-1 min-h-12 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/50"
                >
                  {secenek.onayMetni ?? "Evet, Sil"}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
