"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ArrowRight, Package, TrendingUp, CheckSquare, ClipboardList, BarChart3 } from "lucide-react";
import { useRouter } from "next/navigation";
import { ara, TIP_ETIKET, TIP_RENK, type AramaSonucu, type AramaSonucTip } from "@/lib/arama-data";

const TIP_IKON: Record<AramaSonucTip, typeof Search> = {
  stok:     Package,
  nakit:    TrendingUp,
  gorev:    CheckSquare,
  prosedur: ClipboardList,
  urun:     BarChart3,
};

interface Props {
  acik: boolean;
  onKapat: () => void;
}

export default function AramaModal({ acik, onKapat }: Props) {
  const router                      = useRouter();
  const [sorgu, setSorgu]           = useState("");
  const [sonuclar, setSonuclar]     = useState<AramaSonucu[]>([]);
  const [secili, setSecili]         = useState(0);
  const inputRef                    = useRef<HTMLInputElement>(null);

  // Arama yap
  useEffect(() => {
    const s = ara(sorgu);
    setSonuclar(s);
    setSecili(0);
  }, [sorgu]);

  // Input focus
  useEffect(() => {
    if (acik) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSorgu("");
      setSonuclar([]);
    }
  }, [acik]);

  const git = useCallback(
    (sonuc: AramaSonucu) => {
      router.push(sonuc.href);
      onKapat();
    },
    [router, onKapat]
  );

  // Klavye navigasyonu
  useEffect(() => {
    if (!acik) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onKapat(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setSecili((p) => Math.min(p + 1, sonuclar.length - 1)); }
      if (e.key === "ArrowUp")   { e.preventDefault(); setSecili((p) => Math.max(p - 1, 0)); }
      if (e.key === "Enter" && sonuclar[secili]) { git(sonuclar[secili]); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [acik, sonuclar, secili, git, onKapat]);

  // Grupla
  const gruplar = sonuclar.reduce<Record<string, AramaSonucu[]>>((acc, s) => {
    const etiket = TIP_ETIKET[s.tip];
    if (!acc[etiket]) acc[etiket] = [];
    acc[etiket].push(s);
    return acc;
  }, {});

  return (
    <AnimatePresence>
      {acik && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-start justify-center pt-[10vh] px-4"
          onClick={(e) => e.target === e.currentTarget && onKapat()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -12 }}
            transition={{ duration: 0.18 }}
            className="w-full max-w-xl glass-card rounded-2xl overflow-hidden shadow-2xl"
          >
            {/* Input */}
            <div className="flex items-center gap-3 px-4 py-4 border-b border-[rgba(255,255,255,0.06)]">
              <Search className="w-5 h-5 text-[#94a3b8] shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Ürün, görev, prosedür, işlem ara..."
                value={sorgu}
                onChange={(e) => setSorgu(e.target.value)}
                className="flex-1 bg-transparent text-white placeholder-[#94a3b8] text-sm focus:outline-none"
              />
              {sorgu && (
                <button onClick={() => setSorgu("")} className="text-[#94a3b8] hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
              <kbd className="px-2 py-1 rounded-lg text-[10px] bg-[rgba(255,255,255,0.06)] text-[#94a3b8] border border-[rgba(255,255,255,0.1)]">
                ESC
              </kbd>
            </div>

            {/* Sonuçlar */}
            <div className="max-h-[60vh] overflow-y-auto">
              {sorgu.length < 2 ? (
                <div className="px-5 py-8 text-center">
                  <p className="text-sm text-[#94a3b8]">En az 2 karakter gir</p>
                  <div className="flex items-center justify-center gap-4 mt-4 text-[10px] text-[#94a3b8]">
                    <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)]">↑↓</kbd> seç</span>
                    <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)]">↵</kbd> git</span>
                    <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)]">ESC</kbd> kapat</span>
                  </div>
                </div>
              ) : sonuclar.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <Search className="w-8 h-8 text-[#94a3b8] mx-auto mb-3 opacity-40" />
                  <p className="text-sm text-[#94a3b8]">
                    <span className="text-white font-medium">"{sorgu}"</span> için sonuç bulunamadı
                  </p>
                </div>
              ) : (
                <div className="py-2">
                  {Object.entries(gruplar).map(([grup, items]) => {
                    const Icon = TIP_IKON[items[0].tip];
                    const renk = TIP_RENK[items[0].tip];
                    return (
                      <div key={grup}>
                        {/* Grup başlığı */}
                        <div className="flex items-center gap-2 px-4 py-2">
                          <Icon className="w-3.5 h-3.5" style={{ color: renk }} />
                          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: renk }}>
                            {grup}
                          </span>
                        </div>

                        {/* Sonuç satırları */}
                        {items.map((sonuc) => {
                          const idx = sonuclar.indexOf(sonuc);
                          const aktif = idx === secili;
                          return (
                            <button
                              key={sonuc.id}
                              onClick={() => git(sonuc)}
                              onMouseEnter={() => setSecili(idx)}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                              style={{ backgroundColor: aktif ? "rgba(251,192,36,0.08)" : "transparent" }}
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-white font-medium truncate">{sonuc.baslik}</p>
                                <p className="text-xs text-[#94a3b8] truncate mt-0.5">{sonuc.altBilgi}</p>
                              </div>
                              {aktif && <ArrowRight className="w-4 h-4 text-[#fbc024] shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {sonuclar.length > 0 && (
              <div className="px-4 py-2.5 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between text-[11px] text-[#94a3b8]">
                <span>{sonuclar.length} sonuç</span>
                <span>↑↓ ile seç, ↵ ile git</span>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
