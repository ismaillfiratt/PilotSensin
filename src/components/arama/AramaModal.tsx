"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Search, X, ArrowRight,
  Compass, Package, Wallet, CheckSquare, ClipboardList,
  ShoppingCart, TrendingDown, Shield, Banknote, Bell,
  User, Receipt, FileText, Trash2,
} from "lucide-react";
import {
  ara, aramaIndeksiOlustur,
  type AramaSonucu, type AramaSonucTip,
} from "@/lib/arama-data";
import { useStok }             from "@/store/stok";
import { useNakit }            from "@/store/nakit";
import { useGorevler }         from "@/store/gorevler";
import { useProsedurler }      from "@/store/prosedurler";
import { useSatislar }         from "@/store/satislar";
import { useIsletmeGiderleri } from "@/store/isletmeGiderleri";
import { useAcilFon }          from "@/store/acilFon";
import { useBildirimler }      from "@/store/bildirimler";
import { useKdvHavuzu }        from "@/store/kdvHavuzu";
import { useSirket }           from "@/store/sirket";
import { createClient }        from "@/utils/supabase/client";

// ── İkon haritası ─────────────────────────────────────────────────────────────

const TIP_IKON: Record<AramaSonucTip, typeof Search> = {
  "sayfa":      Compass,
  "stok":       Package,
  "nakit":      Wallet,
  "gorev":      CheckSquare,
  "prosedur":   ClipboardList,
  "checklist":  CheckSquare,
  "satis":      ShoppingCart,
  "gider":      TrendingDown,
  "acil-hedef": Shield,
  "acil-islem": Banknote,
  "bildirim":   Bell,
  "profil":     User,
  "kdv":        Receipt,
  "belge":      FileText,
  "silinmis":   Trash2,
  "urun":       Package,
};

// Grup öncelik sırası
const GRUP_SIRA = [
  "Sayfalar", "Stok", "Görevler", "Nakit", "Satışlar", "Giderler",
  "Prosedürler", "Kontrol Listesi", "Acil Fon Hedefleri", "Acil Fon İşlemleri",
  "Bildirimler", "Profil", "İşletme", "KDV", "Belgeler", "Sıkça Sorulan Sorular",
];
const GRUP_MAX = 5;

// ── Highlight yardımcısı ──────────────────────────────────────────────────────

function HighlightedText({
  text,
  pos,
}: {
  text: string;
  pos?: { baslangic: number; uzunluk: number };
}) {
  if (!pos || pos.uzunluk === 0) return <span>{text}</span>;
  const before = text.slice(0, pos.baslangic);
  const match  = text.slice(pos.baslangic, pos.baslangic + pos.uzunluk);
  const after  = text.slice(pos.baslangic + pos.uzunluk);
  return (
    <span>
      {before}
      <span style={{
        color: "var(--forest)", fontWeight: 600,
        backgroundColor: "var(--forest-100)", padding: "0 2px", borderRadius: "3px",
      }}>{match}</span>
      {after}
    </span>
  );
}

// ── Ana bileşen ───────────────────────────────────────────────────────────────

interface Props { acik: boolean; onKapat: () => void }

export default function AramaModal({ acik, onKapat }: Props) {
  const router = useRouter();

  // Tüm store'lar
  const { urunler }                                          = useStok();
  const { islemler: nakitIslemler }                          = useNakit();
  const { gorevler }                                         = useGorevler();
  const { prosedurler, checklist }                           = useProsedurler();
  const { kayitlar: satisKayitlari }                         = useSatislar();
  const { giderler: isletmeGiderleri }                       = useIsletmeGiderleri();
  const { hedefler: acilFonHedefler, islemler: acilFonIslemler } = useAcilFon();
  const { bildirimler }                                      = useBildirimler();
  const { kayitlar: kdvKayitlar }                            = useKdvHavuzu();
  const { sirketAdi }                                        = useSirket();

  // Profil async — bir kez yükle
  const [profilBilgi, setProfilBilgi] = useState<{ ad?: string; email?: string }>({});
  useEffect(() => {
    if (!acik) return;
    (async () => {
      const { data: { user } } = await createClient().auth.getUser();
      if (user) setProfilBilgi({
        email: user.email,
        ad:    (user.user_metadata?.ad as string) ?? undefined,
      });
    })();
  }, [acik]);

  const [sorgu,         setSorgu]         = useState("");
  const [debouncedSorgu, setDebouncedSorgu] = useState("");
  const [secili,        setSecili]        = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce 200ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSorgu(sorgu), 200);
    return () => clearTimeout(t);
  }, [sorgu]);

  // Kapatınca temizle
  useEffect(() => {
    if (!acik) { setSorgu(""); setDebouncedSorgu(""); }
    else        setTimeout(() => inputRef.current?.focus(), 50);
  }, [acik]);

  // İndeks
  const indeks = useMemo(
    () => aramaIndeksiOlustur({
      stokUrunler:      urunler,
      nakitIslemler,
      gorevler,
      prosedurler,
      checklist,
      satisKayitlari,
      isletmeGiderleri,
      acilFonHedefler,
      acilFonIslemler,
      bildirimler,
      kdvKayitlar,
      kullaniciEmail: profilBilgi.email,
      kullaniciAd:    profilBilgi.ad,
      sirketAdi,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [urunler, nakitIslemler, gorevler, prosedurler, checklist, satisKayitlari,
     isletmeGiderleri, acilFonHedefler, acilFonIslemler, bildirimler, kdvKayitlar,
     profilBilgi, sirketAdi]
  );

  const sonuclar = useMemo(
    () => ara(debouncedSorgu, indeks),
    [debouncedSorgu, indeks]
  );

  useEffect(() => setSecili(0), [sonuclar]);

  // Scroll to active
  useEffect(() => {
    document.querySelector('[data-arama-aktif="true"]')
      ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [secili]);

  // Gruplandır + sırala
  const siraliGruplar = useMemo(() => {
    const map: Record<string, AramaSonucu[]> = {};
    sonuclar.forEach((s) => {
      if (!map[s.modulAdi]) map[s.modulAdi] = [];
      map[s.modulAdi].push(s);
    });
    return Object.entries(map).sort(([a], [b]) => {
      const ai = GRUP_SIRA.indexOf(a);
      const bi = GRUP_SIRA.indexOf(b);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });
  }, [sonuclar]);

  // Navigasyon
  const git = useCallback(
    (sonuc: AramaSonucu) => { router.push(sonuc.href); onKapat(); },
    [router, onKapat]
  );

  useEffect(() => {
    if (!acik) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape")    { onKapat(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setSecili((p) => Math.min(p + 1, sonuclar.length - 1)); }
      if (e.key === "ArrowUp")   { e.preventDefault(); setSecili((p) => Math.max(p - 1, 0)); }
      if (e.key === "Enter" && sonuclar[secili]) { e.preventDefault(); git(sonuclar[secili]); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [acik, sonuclar, secili, git, onKapat]);

  // ── JSX ──────────────────────────────────────────────────────────────────

  return (
    <AnimatePresence>
      {acik && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="hidden md:block fixed inset-0 z-[99]"
            style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
            onClick={onKapat}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[100] flex flex-col arama-modal md:inset-auto md:block md:left-1/2 md:top-[12vh] md:-translate-x-1/2 md:w-full md:max-w-xl"
            style={{ background: "var(--bg-card)" }}
          >
            <div
              className="arama-modal flex flex-col h-full md:h-auto md:overflow-hidden"
              style={{
                background:   "var(--bg-card)",
                border:       "0.5px solid var(--border-strong)",
                borderRadius: "16px",
                boxShadow:    "0 24px 60px rgba(0,0,0,0.4)",
              }}
            >

              {/* Input */}
              <div
                className="flex items-center gap-3 px-4 shrink-0"
                style={{
                  borderBottom: "0.5px solid var(--border-default)",
                  padding: "18px 16px",
                }}
              >
                <Search className="w-5 h-5 shrink-0" style={{ color: "var(--text-secondary)" }} />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Ara..."
                  value={sorgu}
                  onChange={(e) => setSorgu(e.target.value)}
                  className="flex-1 bg-transparent focus:outline-none"
                  style={{ color: "var(--text-primary)", fontSize: "16px", fontWeight: 400 }}
                />
                {sorgu ? (
                  <button
                    onClick={() => setSorgu("")}
                    className="transition-colors"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={onKapat}
                    className="md:hidden min-w-11 min-h-11 flex items-center justify-center rounded-xl transition-colors"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <kbd
                  className="hidden md:inline"
                  style={{
                    padding: "2px 6px", borderRadius: "4px",
                    background: "var(--bg-elevated)", border: "0.5px solid var(--border-default)",
                    color: "var(--text-secondary)", fontSize: "10px",
                  }}
                >
                  ESC
                </kbd>
              </div>

              {/* Sonuçlar */}
              <div className="flex-1 overflow-y-auto" style={{ maxHeight: "400px" }}>

                {/* Boş sorgu */}
                {sorgu.length < 2 && (
                  <div className="px-5 py-12 text-center">
                    <Search className="w-10 h-10 mx-auto mb-4" style={{ color: "var(--text-tertiary)", opacity: 0.4 }} />
                    <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Aramak için yazmaya başla</p>
                    <p style={{ color: "var(--text-tertiary)", fontSize: "12px", marginTop: "6px" }}>
                      Stok, görev, müşteri, belge — her şey aranabilir
                    </p>
                    <div className="flex items-center justify-center gap-4 mt-6" style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
                      {[["↑↓", "gez"], ["↵", "aç"], ["ESC", "kapat"]].map(([k, l]) => (
                        <span key={k} className="flex items-center gap-1">
                          <kbd style={{
                            padding: "2px 5px", borderRadius: "4px",
                            background: "var(--bg-elevated)", border: "0.5px solid var(--border-default)",
                            color: "var(--text-secondary)", fontSize: "10px",
                          }}>{k}</kbd>
                          {l}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sonuç yok */}
                {sorgu.length >= 2 && sonuclar.length === 0 && (
                  <div className="px-5 py-12 text-center">
                    <Search className="w-10 h-10 mx-auto mb-4" style={{ color: "var(--text-tertiary)", opacity: 0.4 }} />
                    <p style={{ color: "var(--text-primary)", fontSize: "14px", fontWeight: 500 }}>
                      Sonuç bulunamadı
                    </p>
                    <p style={{ color: "var(--text-secondary)", fontSize: "12px", marginTop: "6px" }}>
                      &ldquo;{sorgu}&rdquo; için hiçbir kayıt yok
                    </p>
                  </div>
                )}

                {/* Sonuç listesi */}
                {sorgu.length >= 2 && sonuclar.length > 0 && (
                  <div className="py-2">
                    {siraliGruplar.map(([grupAdi, items]) => {
                      const goster  = items.slice(0, GRUP_MAX);
                      const fazla   = items.length - GRUP_MAX;

                      return (
                        <div key={grupAdi} className="mb-1">
                          {/* Grup başlığı — gri caps, sticky */}
                          <div
                            className="px-4 py-2 flex items-center gap-2 sticky top-0 z-[1]"
                            style={{ background: "var(--bg-card)" }}
                          >
                            <span
                              className="text-[10px] font-semibold uppercase tracking-[0.12em]"
                              style={{ color: "var(--text-tertiary)" }}
                            >
                              {grupAdi}
                            </span>
                            <span style={{ color: "var(--text-tertiary)", fontSize: "10px" }}>
                              {items.length}
                            </span>
                          </div>

                          {/* Satırlar */}
                          {goster.map((sonuc) => {
                            const globalIdx = sonuclar.indexOf(sonuc);
                            const aktif     = globalIdx === secili;
                            const RowIcon   = TIP_IKON[sonuc.tip];
                            return (
                              <button
                                key={sonuc.id}
                                data-arama-aktif={aktif ? "true" : undefined}
                                onClick={() => git(sonuc)}
                                onMouseEnter={() => setSecili(globalIdx)}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                                style={{
                                  background:  aktif ? "var(--bg-elevated)" : "transparent",
                                  borderLeft:  aktif ? "2px solid var(--forest)" : "2px solid transparent",
                                }}
                              >
                                <RowIcon className="w-4 h-4 shrink-0" style={{ color: "var(--text-tertiary)" }} />
                                <div className="flex-1 min-w-0">
                                  <p className="truncate" style={{ color: "var(--text-primary)", fontSize: "14px", fontWeight: 500 }}>
                                    <HighlightedText text={sonuc.baslik} pos={sonuc.eslesmePoz} />
                                    {sonuc.silindi && (
                                      <span
                                        className="ml-2 font-normal"
                                        style={{
                                          fontSize: "10px", padding: "0 5px", borderRadius: "4px",
                                          background: "var(--bg-secondary)", color: "var(--text-tertiary)",
                                        }}
                                      >
                                        ÇÖPTE
                                      </span>
                                    )}
                                  </p>
                                  {(sonuc.altYazi || sonuc.altBilgi) && (
                                    <p className="truncate" style={{ color: "var(--text-secondary)", fontSize: "12px", marginTop: "2px" }}>
                                      {sonuc.altYazi ?? sonuc.altBilgi}
                                    </p>
                                  )}
                                </div>
                                {aktif && (
                                  <ArrowRight className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--forest)" }} />
                                )}
                              </button>
                            );
                          })}

                          {/* Fazla sonuç notu */}
                          {fazla > 0 && (
                            <p className="px-4 py-1.5" style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
                              + {fazla} sonuç daha — daha spesifik arama yap
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div
                className="hidden md:flex items-center justify-between gap-3 shrink-0"
                style={{
                  borderTop: "0.5px solid var(--border-default)",
                  background: "var(--bg-card)",
                  padding: "10px 16px",
                }}
              >
                <div className="flex items-center gap-3" style={{ fontSize: "10px", color: "var(--text-tertiary)" }}>
                  {[["↑↓", "seç"], ["↵", "aç"], ["ESC", "kapat"]].map(([k, l]) => (
                    <span key={k} className="flex items-center gap-1">
                      <kbd style={{
                        padding: "2px 6px", borderRadius: "4px",
                        background: "var(--bg-elevated)", border: "0.5px solid var(--border-default)",
                        color: "var(--text-secondary)", fontSize: "10px",
                      }}>{k}</kbd>
                      {l}
                    </span>
                  ))}
                </div>
                {sorgu.length >= 2 && sonuclar.length > 0 && (
                  <span style={{ fontSize: "10px", color: "var(--text-tertiary)" }}>
                    {sonuclar.length} sonuç
                  </span>
                )}
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
