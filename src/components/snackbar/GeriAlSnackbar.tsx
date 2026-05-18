"use client";

import { motion, AnimatePresence, useMotionValue } from "framer-motion";
import { CheckCircle2, X, RotateCcw } from "lucide-react";
import { useGeriAl } from "@/store/geriAl";

export default function GeriAlSnackbar() {
  const { aksiyonlar, kapat, tetikle } = useGeriAl();

  return (
    /* Mobil: bottom-nav'ın üstünde (bottom-24), Desktop: sağ alt */
    <div className="fixed bottom-24 inset-x-4 z-[190] flex flex-col gap-2 md:bottom-6 md:right-6 md:left-auto md:max-w-sm pointer-events-none">
      <AnimatePresence mode="popLayout">
        {aksiyonlar.map((a) => (
          <SnackbarItem
            key={a.id}
            aksiyon={a}
            onKapat={() => kapat(a.id)}
            onGeriAl={() => tetikle(a.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function SnackbarItem({
  aksiyon,
  onKapat,
  onGeriAl,
}: {
  aksiyon:   import("@/store/geriAl").GeriAlAksiyon;
  onKapat:   () => void;
  onGeriAl:  () => void;
}) {
  const y = useMotionValue(0);

  /* Kalan süre yüzdesi animasyonu için progress bar başlangıç-bitiş */
  const gecenMs = Date.now() - aksiyon.olusturma;
  const kalanMs = Math.max(aksiyon.sureMs - gecenMs, 0);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.95 }}
      drag="y"
      dragConstraints={{ top: 0 }}
      dragElastic={{ top: 0, bottom: 0.4 }}
      onDragEnd={(_, info) => { if (info.velocity.y > 200 || info.offset.y > 60) onKapat(); }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="pointer-events-auto flex flex-col rounded-2xl overflow-hidden shadow-2xl"
      style={{
        y,
        background: "rgba(22,37,60,0.96)",
        border:     "1px solid rgba(34,197,94,0.25)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* İçerik satırı */}
      <div className="flex items-center gap-3 px-4 py-3">
        <CheckCircle2 className="w-4 h-4 text-[#22c55e] shrink-0" />

        <span className="flex-1 text-sm text-white leading-snug">{aksiyon.mesaj}</span>

        <button
          onClick={onGeriAl}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#22c55e] hover:bg-[rgba(34,197,94,0.12)] transition-colors shrink-0"
        >
          <RotateCcw className="w-3 h-3" />
          GERİ AL
        </button>

        <button
          onClick={onKapat}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-[#64748b] hover:text-white hover:bg-white/8 transition-colors shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Kalan süre progress bar */}
      <motion.div
        className="h-0.5 bg-[#22c55e]"
        initial={{ scaleX: 1, originX: 0 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: kalanMs / 1000, ease: "linear" }}
        style={{ transformOrigin: "left" }}
      />
    </motion.div>
  );
}
