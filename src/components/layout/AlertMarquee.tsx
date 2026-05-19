"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { useBildirimler } from "@/store/bildirimler";

const MODUL_HREF: Record<string, string> = {
  "stok":        "/stok",
  "nakit-akisi": "/nakit-akisi",
  "kar-zarar":   "/kar-zarar",
  "gorevler":    "/gorevler",
  "prosedurler": "/prosedurler",
  "acil-fon":    "/acil-fon",
  "sistem":      "/dashboard",
};

export default function AlertMarquee() {
  const { bildirimler, okunduYap } = useBildirimler();

  const aktif = bildirimler.filter(
    (b) => !b.okundu && (b.tip === "kritik" || b.tip === "uyari")
  );

  // Önceki bildirimlerin ID listesi (yeni eklenenleri tespit etmek için)
  const prevIds = useRef<string[]>([]);
  useEffect(() => {
    prevIds.current = aktif.map((b) => b.id);
  });

  if (aktif.length === 0) {
    return (
      <div
        className="flex items-center h-9 overflow-hidden shrink-0 px-4 gap-2"
        style={{ background: "var(--bg-secondary)", borderTop: "1px solid var(--border-subtle)" }}
      >
        <CheckCircle className="w-3.5 h-3.5 text-[#22c55e]" />
        <span className="text-xs text-gray-400">Aktif uyarı yok</span>
      </div>
    );
  }

  const doubled = [...aktif, ...aktif];
  // Bildirim listesi değişince kaydırma sıfırlanmadan yeni içerik sağdan kayarak gelsin
  const trackKey = aktif.map((b) => b.id).join(",");

  return (
    <div
      className="flex items-center h-9 overflow-hidden shrink-0"
      style={{ background: "var(--bg-secondary)", borderTop: "1px solid var(--border-subtle)" }}
    >
      {/* Sabit etiket */}
      <div className="flex items-center gap-1 px-3 shrink-0 border-r border-gray-200 h-full">
        <AlertTriangle className="w-3.5 h-3.5 text-[var(--leaf)]" />
        <span className="text-[10px] font-bold text-[var(--leaf)] uppercase tracking-widest">Uyarılar</span>
        <span className="ml-1 text-[10px] font-bold bg-[#ef4444] text-white rounded-full w-4 h-4 flex items-center justify-center">
          {aktif.length}
        </span>
      </div>

      {/* Kayan alan — yeni bildirim gelince sağdan kayarak girer */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={trackKey}
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-30%", opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {/* İç div: CSS marquee kaydırma */}
            <div className="marquee-track flex gap-12 whitespace-nowrap">
              {doubled.map((b, i) => (
                <Link
                  key={`${b.id}-${i}`}
                  href={MODUL_HREF[b.modul] ?? "/dashboard"}
                  onClick={() => okunduYap(b.id)}
                  className={`text-xs font-medium hover:underline ${
                    b.tip === "kritik" ? "text-[#ef4444]" : "text-[var(--leaf)]"
                  }`}
                >
                  {b.tip === "kritik" ? "🔴" : "🟡"} {b.baslik}: {b.mesaj}
                </Link>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
