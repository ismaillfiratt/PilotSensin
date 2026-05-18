"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Search, User, Settings, LogOut, ChevronDown, Store, CheckCheck, ExternalLink, ChevronLeft, Menu, CheckCircle2, Circle } from "lucide-react";
import { useLayout } from "@/store/layout";
import { useNakit }    from "@/store/nakit";
import { useGorevler } from "@/store/gorevler";
import { useStok }     from "@/store/stok";
import { nakitSkoru, gorevSkoru, stokSkoru, prosedurSkoru, acilFonSkoru, pilotSkoru } from "@/lib/pilot-score";
import { useProsedurler } from "@/store/prosedurler";
import { useAcilFon }     from "@/store/acilFon";
import { createClient } from "@/utils/supabase/client";
import { useBildirimler } from "@/store/bildirimler";
import { useSirket } from "@/store/sirket";
import AramaModal from "@/components/arama/AramaModal";

const MODUL_HREF: Record<string, string> = {
  "stok":        "/stok",
  "nakit-akisi": "/nakit-akisi",
  "kar-zarar":   "/kar-zarar",
  "gorevler":    "/gorevler",
  "prosedurler": "/prosedurler",
  "acil-fon":    "/acil-fon",
  "sistem":      "/dashboard",
};

function zaman(iso: string) {
  const fark = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (fark < 1)    return "Az önce";
  if (fark < 60)   return `${fark}dk`;
  if (fark < 1440) return `${Math.floor(fark / 60)}sa`;
  return `${Math.floor(fark / 1440)}g`;
}

interface KullaniciBilgi {
  ad: string;
  soyad: string;
  businessAd: string;
  email: string;
}

export default function Topbar() {
  const router   = useRouter();
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen]     = useState(false);
  const [aramaAcik, setAramaAcik]     = useState(false);
  const [kullanici, setKullanici]     = useState<KullaniciBilgi | null>(null);

  const { bildirimler, okunduYap, okunduToggle, tumunuOkunduYap } = useBildirimler();
  const { sirketAdi } = useSirket();
  const notifRef = useRef<HTMLDivElement>(null);
  const { islemler }                   = useNakit();
  const { gorevler }                   = useGorevler();
  const { urunler }                    = useStok();
  const { prosedurler, checklist }     = useProsedurler();
  const { islemler: fonIslemler, hedefler: fonHedefler } = useAcilFon();
  const { mobileSidebarToggle }        = useLayout();

  const genelSkor = pilotSkoru([
    nakitSkoru(islemler),
    gorevSkoru(gorevler),
    stokSkoru(urunler),
    prosedurSkoru(prosedurler, checklist),
    acilFonSkoru(fonIslemler, fonHedefler),
  ]);

  const skorRenk = genelSkor >= 80 ? "#22c55e" : genelSkor >= 60 ? "#fbc024" : "#ef4444";

  // Kullanıcı bilgilerini Supabase'den çek
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      const m = data.user.user_metadata ?? {};
      setKullanici({
        ad:         m.ad         ?? "",
        soyad:      m.soyad      ?? "",
        businessAd: m.businessAd ?? "İşletmem",
        email:      data.user.email ?? "",
      });
    });
  }, []);
  const okunmamis = bildirimler.filter((b) => !b.okundu);

  // Bildirim paneli dışına tıklanınca kapat
  useEffect(() => {
    if (!notifOpen) return;
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [notifOpen]);

  // ⌘K / Ctrl+K kısayolu
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setAramaAcik((p) => !p);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleCikis = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/giris");
    router.refresh();
  };

  return (
    <>
      {/* ── Mobile header (md:hidden) ── */}
      <header
        className="md:hidden flex items-center justify-between h-14 px-4 shrink-0"
        style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border-subtle)" }}
      >
        {/* Sol: geri butonu (dashboard dışı) veya spacer */}
        {pathname !== "/dashboard" ? (
          <button
            onClick={() => router.back()}
            className="min-w-11 min-h-11 flex items-center justify-center -ml-1 rounded-xl text-[#94a3b8] active:bg-white/5 transition-colors"
            aria-label="Geri"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={mobileSidebarToggle}
            className="min-w-11 min-h-11 flex items-center justify-center -ml-1 rounded-xl text-[#94a3b8] active:bg-white/5 transition-colors"
            aria-label="Menüyü aç"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Orta: işletme adı */}
        <Link href="/dashboard" className="flex items-center gap-1.5">
          <Store className="w-4 h-4 text-[#94a3b8]" />
          <span className="text-white font-semibold text-sm">{sirketAdi || "PilotSensin"}</span>
        </Link>

        {/* Sağ: bildirim */}
        <Link
          href="/bildirimler"
          className="min-w-11 min-h-11 flex items-center justify-center -mr-1 rounded-xl text-[#94a3b8] active:bg-white/5 transition-colors relative"
        >
          <Bell className="w-5 h-5" />
          {okunmamis.length > 0 && (
            <span className="absolute top-2 right-2 min-w-4.5 h-4.5 flex items-center justify-center rounded-full bg-[#ef4444] text-white text-[10px] font-bold px-1">
              {okunmamis.length > 9 ? "9+" : okunmamis.length}
            </span>
          )}
        </Link>
      </header>

      {/* ── Desktop header (hidden md:flex) ── */}
      <header className="hidden md:flex items-center justify-between px-6 py-3 shrink-0" style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border-subtle)", transition: "background 0.25s ease" }}>
        {/* Sol: işletme adı */}
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Store className="w-4 h-4 text-[#94a3b8]" />
            {sirketAdi ? (
              <span className="text-white font-semibold text-sm">{sirketAdi}</span>
            ) : (
              <span className="w-28 h-4 rounded bg-[rgba(255,255,255,0.06)] animate-pulse" />
            )}
          </Link>
          <span
            className="hidden sm:inline ml-2 px-2 py-0.5 rounded-full text-xs font-bold border"
            style={{
              color:           skorRenk,
              borderColor:     `${skorRenk}60`,
              backgroundColor: `${skorRenk}18`,
            }}
          >
            Skor: %{genelSkor}
          </span>
        </div>

        {/* Sağ: arama + bildirim + profil */}
        <div className="flex items-center gap-3">
          {/* Arama butonu — desktop */}
          <button
            onClick={() => setAramaAcik(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[rgba(251,192,36,0.1)] text-[#94a3b8] text-xs hover:border-[rgba(251,192,36,0.3)] hover:text-white transition-colors"
            style={{ background: "var(--bg-card)" }}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Ara...</span>
            <kbd className="ml-2 px-1 py-0.5 rounded text-[10px] bg-[rgba(251,192,36,0.1)] text-[#fbc024]">⌘K</kbd>
          </button>
          {/* Arama ikonu — mobil */}
          <button
            onClick={() => setAramaAcik(true)}
            className="sm:hidden w-8 h-8 flex items-center justify-center rounded-lg border border-[rgba(251,192,36,0.1)] text-[#94a3b8] hover:text-white transition-colors"
            style={{ background: "var(--bg-card)" }}
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Bildirimler */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
              className="relative flex items-center justify-center w-8 h-8 rounded-lg border border-[rgba(251,192,36,0.1)] text-[#94a3b8] hover:border-[rgba(251,192,36,0.3)] hover:text-white transition-colors"
              style={{ background: "var(--bg-card)" }}
            >
              <Bell className="w-4 h-4" />
              {okunmamis.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-4.5 h-4.5 flex items-center justify-center rounded-full bg-[#ef4444] text-white text-[10px] font-bold px-1 pulse-yellow">
                  {okunmamis.length > 9 ? "9+" : okunmamis.length}
                </span>
              )}
            </button>

            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-10 w-80 glass-card rounded-xl shadow-2xl z-50 overflow-hidden"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(255,255,255,0.06)]">
                    <span className="text-sm font-semibold text-white">Bildirimler</span>
                    <div className="flex items-center gap-2">
                      {okunmamis.length > 0 && (
                        <button
                          onClick={tumunuOkunduYap}
                          className="text-xs text-[#94a3b8] hover:text-[#fbc024] transition-colors flex items-center gap-1"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          Okundu say
                        </button>
                      )}
                      <span className="text-xs text-[#fbc024] font-bold">
                        {okunmamis.length} yeni
                      </span>
                    </div>
                  </div>

                  {/* Liste */}
                  <div className="max-h-80 overflow-y-auto divide-y divide-[rgba(255,255,255,0.04)]">
                    {bildirimler.length === 0 ? (
                      <div className="py-8 text-center text-xs text-[#94a3b8]">Bildirim yok</div>
                    ) : (
                      bildirimler.slice(0, 8).map((b) => {
                        const dotColor = b.tip === "kritik" ? "#ef4444" : b.tip === "uyari" ? "#fbc024" : "#22c55e";
                        return (
                          <div key={b.id} className="flex items-start gap-3 px-4 py-3 hover:bg-[rgba(251,192,36,0.04)] transition-colors group">
                            {/* Durum noktası */}
                            <span className="mt-1.5 w-2 h-2 rounded-full shrink-0 flex-none"
                              style={{
                                backgroundColor: b.okundu ? "transparent" : dotColor,
                                border: b.okundu ? `1.5px solid rgba(148,163,184,0.3)` : "none",
                              }} />
                            {/* İçerik */}
                            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => okunduYap(b.id)}>
                              <p className="text-xs font-semibold truncate"
                                style={{ color: b.okundu ? "#64748b" : dotColor }}>
                                {b.baslik}
                              </p>
                              <p className="text-[11px] text-[#64748b] truncate mt-0.5">{b.mesaj}</p>
                              <p className="text-[10px] text-[#475569] mt-0.5">{zaman(b.tarih)}</p>
                            </div>
                            {/* Aksiyonlar */}
                            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              {/* Okundu toggle */}
                              <button onClick={() => okunduToggle(b.id)}
                                title={b.okundu ? "Okunmadı işaretle" : "Okundu işaretle"}
                                className="w-6 h-6 flex items-center justify-center rounded-md transition-colors"
                                style={{ color: b.okundu ? "#22c55e" : "#94a3b8" }}>
                                {b.okundu
                                  ? <CheckCircle2 className="w-3.5 h-3.5" />
                                  : <Circle className="w-3.5 h-3.5" />
                                }
                              </button>
                              {/* Modüle git */}
                              <Link href={b.ilgiliLink ?? MODUL_HREF[b.modul] ?? "/dashboard"}
                                onClick={(e) => { e.stopPropagation(); okunduYap(b.id); setNotifOpen(false); }}
                                className="w-6 h-6 flex items-center justify-center rounded-md text-[#94a3b8] hover:text-[#fbc024] transition-colors">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Footer */}
                  <div className="px-4 py-2.5 border-t border-[rgba(255,255,255,0.06)]">
                    <Link
                      href="/bildirimler"
                      onClick={() => setNotifOpen(false)}
                      className="text-xs text-[#fbc024] hover:underline font-medium"
                    >
                      Tüm bildirimleri gör →
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profil */}
          <div className="relative">
            <button
              onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-[rgba(251,192,36,0.1)] hover:border-[rgba(251,192,36,0.3)] transition-colors"
              style={{ background: "var(--bg-card)" }}
            >
              <div className="w-6 h-6 rounded-full bg-[#fbc024] flex items-center justify-center text-[#0e172a] text-xs font-bold">
                {kullanici ? (kullanici.ad[0] ?? "?").toUpperCase() : "?"}
              </div>
              <span className="text-sm text-white">
                {kullanici ? (kullanici.ad || kullanici.email.split("@")[0]) : "..."}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[#94a3b8]" />
            </button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-10 w-44 glass-card rounded-xl shadow-2xl z-50 overflow-hidden"
                >
                  {[
                    { icon: User,     label: "Profilim", href: "/profil"  },
                    { icon: Settings, label: "Ayarlar",  href: "/ayarlar" },
                  ].map(({ icon: Icon, label, href }) => (
                    <Link key={href} href={href} onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-[#94a3b8] hover:bg-[rgba(251,192,36,0.08)] hover:text-white transition-colors">
                      <Icon className="w-4 h-4" />
                      {label}
                    </Link>
                  ))}
                  <div className="border-t border-[rgba(251,192,36,0.1)]">
                    <button onClick={handleCikis}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-[#ef4444] hover:bg-[rgba(239,68,68,0.08)] transition-colors">
                      <LogOut className="w-4 h-4" />
                      Çıkış Yap
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Arama modali */}
      <AramaModal acik={aramaAcik} onKapat={() => setAramaAcik(false)} />
    </>
  );
}
