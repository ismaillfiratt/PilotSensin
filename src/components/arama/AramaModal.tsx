"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ArrowRight, Package, TrendingUp, CheckSquare, ClipboardList, BarChart3 } from "lucide-react";
import { useRouter } from "next/navigation";
import { ara, aramaIndeksiOlustur, TIP_ETIKET, TIP_RENK, type AramaSonucu, type AramaSonucTip } from "@/lib/arama-data";
import { useStok }        from "@/store/stok";
import { useNakit }       from "@/store/nakit";
import { useGorevler }    from "@/store/gorevler";
import { useProsedurler } from "@/store/prosedurler";
import { useSatislar }    from "@/store/satislar";

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
  const router = useRouter();

  const { urunler }                 = useStok();
  const { islemler }                = useNakit();
  const { gorevler }                = useGorevler();
  const { prosedurler }             = useProsedurler();
  const { kayitlar: satisKayitlari } = useSatislar();

  const [sorgu, setSorgu]       = useState("");
  const [sonuclar, setSonuclar] = useState<AramaSonucu[]>([]);
  const [secili, setSecili]     = useState(0);
  const inputRef                = useRef<HTMLInputElement>(null);

  // Arama indeksini store verilerinden oluştur
  const indeks = useMemo(
    () => aramaIndeksiOlustur({ stokUrunler: urunler, nakitIslemler: islemler, gorevler, prosedurler, satisKayitlari }),
    [urunler, islemler, gorevler, prosedurler, satisKayitlari]
  );

  // Arama yap
  useEffect(() => {
    setSonuclar(ara(sorgu, indeks));
    setSecili(0);
  }, [sorgu, indeks]);

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
    (sonuc: AramaSonucu) => { router.push(sonuc.href); onKapat(); },
    [router, onKapat]
  );

  // Klavye navigasyonu
  useEffect(() => {
    if (!acik) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape")    { onKapat(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setSecili((p) => Math.min(p + 1, sonuclar.length - 1)); }
      if (e.key === "ArrowUp")   { e.preventDefault(); setSecili((p) => Math.max(p - 1, 0)); }
      if (e.key === "Enter" && sonuclar[secili]) { git(sonuclar[secili]); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [acik, sonuclar, secili, git, onKapat]);

  // Sonuçları tipe göre grupla
  const gruplar = sonuclar.reduce<Record<string, AramaSonucu[]>>((acc, s) => {
    const etiket = TIP_ETIKET[s.tip];
    if (!acc[etiket]) acc[etiket] = [];
    acc[etiket].push(s);
    return acc;
  }, {});

  return (
    <AnimatePresence>
      {acik && (
        <>
          {/* Backdrop — desktop only */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="hidden md:block fixed inset-0 bg-black/60 backdrop-blur-sm z-[99]"
            onClick={onKapat}
          />

          {/* Modal — full screen mobile, centered desktop */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[100] flex flex-col bg-white md:inset-auto md:bg-transparent md:block md:left-1/2 md:top-[10vh] md:-translate-x-1/2 md:w-full md:max-w-xl"
          >
          <div className="flex flex-col h-full md:h-auto md:card md:rounded-2xl md:overflow-hidden md:shadow-2xl">
            {/* Input */}
            <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-200 shrink-0">
              <Search className="w-5 h-5 text-gray-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Ürün, görev, prosedür, işlem ara..."
                value={sorgu}
                onChange={(e) => setSorgu(e.target.value)}
                className="flex-1 bg-transparent text-gray-800 placeholder-gray-400 text-base focus:outline-none"
              />
              {sorgu ? (
                <button onClick={() => setSorgu("")} className="text-gray-400 active:text-gray-800 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <button onClick={onKapat} className="md:hidden min-w-11 min-h-11 flex items-center justify-center rounded-xl text-gray-400 active:bg-white/5 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
              <kbd className="hidden md:inline px-2 py-1 rounded-lg text-[10px] bg-gray-50 text-gray-400 border border-gray-200">
                ESC
              </kbd>
            </div>

            {/* Sonuçlar */}
            <div className="max-h-[60vh] overflow-y-auto">
              {sorgu.length < 2 ? (
                <div className="px-5 py-8 text-center">
                  <p className="text-sm text-gray-400">En az 2 karakter gir</p>
                  <div className="flex items-center justify-center gap-4 mt-4 text-[10px] text-gray-400">
                    <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-gray-50 border border-gray-200">↑↓</kbd> seç</span>
                    <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-gray-50 border border-gray-200">↵</kbd> git</span>
                    <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-gray-50 border border-gray-200">ESC</kbd> kapat</span>
                  </div>
                </div>
              ) : sonuclar.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <Search className="w-8 h-8 text-gray-400 mx-auto mb-3 opacity-40" />
                  <p className="text-sm text-gray-400">
                    <span className="text-gray-800 font-medium">&ldquo;{sorgu}&rdquo;</span> için sonuç bulunamadı
                  </p>
                </div>
              ) : (
                <div className="py-2">
                  {Object.entries(gruplar).map(([grup, items]) => {
                    const Icon = TIP_IKON[items[0].tip];
                    const renk = TIP_RENK[items[0].tip];
                    return (
                      <div key={grup}>
                        <div className="flex items-center gap-2 px-4 py-2">
                          <Icon className="w-3.5 h-3.5" style={{ color: renk }} />
                          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: renk }}>
                            {grup}
                          </span>
                        </div>
                        {items.map((sonuc) => {
                          const idx   = sonuclar.indexOf(sonuc);
                          const aktif = idx === secili;
                          return (
                            <button
                              key={sonuc.id}
                              onClick={() => git(sonuc)}
                              onMouseEnter={() => setSecili(idx)}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                              style={{ backgroundColor: aktif ? "var(--mint)" : "transparent" }}
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-white font-medium truncate">{sonuc.baslik}</p>
                                <p className="text-xs text-gray-400 truncate mt-0.5">{sonuc.altBilgi}</p>
                              </div>
                              {aktif && <ArrowRight className="w-4 h-4 text-[var(--leaf)] shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {sonuclar.length > 0 && (
              <div className="px-4 py-2.5 border-t border-gray-200 flex items-center justify-between text-[11px] text-gray-400">
                <span>{sonuclar.length} sonuç</span>
                <span>↑↓ ile seç, ↵ ile git</span>
              </div>
            )}
          </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
