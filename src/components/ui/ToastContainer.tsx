"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { useToast, type ToastTip } from "@/store/toast";

const KONFIG: Record<ToastTip, { renk: string; bg: string; border: string; Icon: typeof CheckCircle2 }> = {
  basari: { renk: "#10B981", bg: "#F0FDF4", border: "#BBF7D0", Icon: CheckCircle2  },
  hata:   { renk: "#EF4444", bg: "#FEF2F2", border: "#FECACA", Icon: XCircle       },
  uyari:  { renk: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A", Icon: AlertTriangle },
  bilgi:  { renk: "#3B82F6", bg: "#EFF6FF", border: "#BFDBFE", Icon: Info          },
};

export default function ToastContainer() {
  const { toastlar, sil } = useToast();

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-xs w-full pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toastlar.map((t) => {
          const cfg = KONFIG[t.tip];
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 64, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 64, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-2xl shadow-lg"
              style={{ backgroundColor: cfg.bg, border: `1px solid ${cfg.border}` }}
            >
              <cfg.Icon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: cfg.renk }} />
              <div className="flex-1 min-w-0">
                {t.baslik && (
                  <p className="text-xs font-bold mb-0.5" style={{ color: cfg.renk }}>{t.baslik}</p>
                )}
                <p className="text-xs text-gray-600 leading-relaxed">{t.mesaj}</p>
              </div>
              <button
                onClick={() => sil(t.id)}
                className="shrink-0 w-5 h-5 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
