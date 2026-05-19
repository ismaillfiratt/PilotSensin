"use client";

import { motion, AnimatePresence, useMotionValue } from "framer-motion";
import { CheckCircle2, X, RotateCcw } from "lucide-react";
import { useGeriAl } from "@/store/geriAl";

export default function GeriAlSnackbar() {
  const { aksiyonlar, kapat, tetikle } = useGeriAl();

  return (
    <div className="fixed bottom-24 inset-x-4 z-190 flex flex-col gap-2 md:bottom-6 md:right-6 md:left-auto md:max-w-sm pointer-events-none">
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
  aksiyon:  import("@/store/geriAl").GeriAlAksiyon;
  onKapat:  () => void;
  onGeriAl: () => void;
}) {
  const y = useMotionValue(0);

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
      className="pointer-events-auto flex flex-col rounded-2xl overflow-hidden shadow-lg bg-white"
      style={{ y, border: "1px solid #BBF7D0" }}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
        <span className="flex-1 text-sm text-gray-700 leading-snug">{aksiyon.mesaj}</span>
        <button
          onClick={onGeriAl}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-600 hover:bg-emerald-50 transition-colors shrink-0"
        >
          <RotateCcw className="w-3 h-3" />
          GERİ AL
        </button>
        <button
          onClick={onKapat}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <motion.div
        className="h-0.5 bg-emerald-400"
        initial={{ scaleX: 1, originX: 0 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: kalanMs / 1000, ease: "linear" }}
        style={{ transformOrigin: "left" }}
      />
    </motion.div>
  );
}
