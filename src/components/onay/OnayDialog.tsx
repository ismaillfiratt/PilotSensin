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

  useEffect(() => {
    if (acik) {
      setKaskad(true);
      setOturumdaSusturma(false);
      setSilDisabled(false);
      const t = setTimeout(() => vazgecRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [acik]);

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
    if (oturumdaSusturma && secenek) bu_oturumdaSusturuldu(secenek.tip);
    onayla(kaskad);
  };

  return (
    <AnimatePresence>
      {acik && secenek && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-200"
            onClick={vazgec}
          />

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
            className="fixed z-201 bg-white bottom-0 inset-x-0 rounded-t-2xl border-t border-gray-200 md:bottom-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:border md:max-w-md md:w-full shadow-2xl"
          >
            {/* Mobil drag handle */}
            <div className="md:hidden flex justify-center pt-3 pb-1 cursor-grab">
              <div className="w-12 h-1 rounded-full bg-gray-200" />
            </div>

            <div className="px-5 pt-5 pb-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5 text-red-500" />
                </div>
                <h2 className="text-lg font-bold text-gray-800">Silme Onayı</h2>
              </div>

              <p className="text-sm text-gray-500 leading-relaxed">
                <span className="text-gray-800 font-semibold">&ldquo;{secenek.isim}&rdquo;</span>{" "}
                kaydını silmek istediğine emin misin?
              </p>

              {secenek.kaskadBaglıSayisi > 0 && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                  Bu kayda bağlı <span className="font-bold">{secenek.kaskadBaglıSayisi}</span> kayıt daha var.
                </p>
              )}

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={kaskad}
                  onChange={(e) => setKaskad(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded accent-red-500 cursor-pointer"
                />
                <span className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors leading-snug">
                  Bağlı kayıtları da sil
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={oturumdaSusturma}
                  onChange={(e) => setOturumdaSusturma(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded cursor-pointer"
                  style={{ accentColor: "var(--leaf)" }}
                />
                <span className="text-sm text-gray-400 group-hover:text-gray-500 transition-colors leading-snug">
                  Bu oturumda bu tip kayıt için bir daha sorma
                </span>
              </label>

              <p className="text-xs text-gray-400 bg-gray-50 rounded-xl px-3 py-2">
                30 gün boyunca çöp kutusunda kalır, sonra kalıcı silinir.
              </p>
            </div>

            <div
              className="sticky bottom-0 bg-white px-5 pt-3 pb-4 md:pb-5 border-t border-gray-100"
              style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 20px)" }}
            >
              <div className="flex gap-3">
                <button
                  ref={vazgecRef}
                  type="button"
                  onClick={vazgec}
                  className="flex-1 min-h-12 rounded-xl border border-gray-200 bg-white text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
                >
                  {secenek.iptalMetni ?? "Vazgeç"}
                </button>
                <button
                  type="button"
                  onClick={handleOnayla}
                  disabled={silDisabled}
                  className="flex-1 min-h-12 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-red-400/50"
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
