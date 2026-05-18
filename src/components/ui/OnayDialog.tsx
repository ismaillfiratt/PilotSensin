"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";

interface Props {
  open:         boolean;
  onClose:      () => void;
  onOnayla:     () => void;
  baslik:       string;
  aciklama:     React.ReactNode;
  onayLabel?:   string;
  iptalLabel?:  string;
  tehlikeli?:   boolean;
}

export default function OnayDialog({
  open, onClose, onOnayla,
  baslik, aciklama,
  onayLabel = "Evet, Sil",
  iptalLabel = "İptal",
  tehlikeli = true,
}: Props) {
  if (!open) return null;

  const onayRenk = tehlikeli ? "#ef4444" : "#fbc024";
  const onayBg   = tehlikeli ? "#ef4444" : "#fbc024";
  const ikonBg   = tehlikeli ? "rgba(239,68,68,0.12)" : "rgba(251,192,36,0.12)";
  const ikonBorder = tehlikeli ? "rgba(239,68,68,0.25)" : "rgba(251,192,36,0.25)";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            drag="y" dragConstraints={{ top: 0 }} dragElastic={{ top: 0, bottom: 0.3 }}
            onDragEnd={(_, info) => { if (info.velocity.y > 300 || info.offset.y > 100) onClose(); }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed z-50 bg-[#0e172a] glass-card bottom-0 inset-x-0 rounded-t-2xl border-t border-white/10 md:bottom-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:border md:max-w-sm md:w-full"
          >
            <div className="md:hidden flex justify-center pt-3 pb-1 cursor-grab">
              <div className="w-12 h-1 rounded-full bg-white/20" />
            </div>

            <div className="px-6 pt-5 pb-2">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: ikonBg, border: `1px solid ${ikonBorder}` }}>
                <AlertTriangle className="w-6 h-6" style={{ color: onayRenk }} />
              </div>
              <h3 className="text-base font-bold text-white mb-1">{baslik}</h3>
              <div className="text-sm text-[#94a3b8]">{aciklama}</div>
            </div>

            <div className="sticky bottom-0 bg-[#0e172a] px-6 pt-3 pb-4 md:pb-4"
              style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 16px)" }}>
              <div className="flex gap-3">
                <button onClick={onClose}
                  className="flex-1 min-h-12 rounded-xl border border-[rgba(255,255,255,0.1)] text-[#94a3b8] text-sm font-medium hover:bg-[rgba(255,255,255,0.05)] transition-colors">
                  {iptalLabel}
                </button>
                <button onClick={() => { onOnayla(); onClose(); }}
                  className="flex-1 min-h-12 rounded-xl text-white text-sm font-bold transition-colors"
                  style={{ backgroundColor: onayBg, color: tehlikeli ? "white" : "#0e172a" }}>
                  {onayLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
