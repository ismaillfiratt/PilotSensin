"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Search, User, Settings, LogOut, ChevronDown, Store, CheckCheck, ExternalLink } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useBildirimler } from "@/store/bildirimler";
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
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen]     = useState(false);
  const [aramaAcik, setAramaAcik]     = useState(false);
  const [kullanici, setKullanici]     = useState<KullaniciBilgi | null>(null);

  const { bildirimler, okunduYap, tumunuOkunduYap } = useBildirimler();

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
      <header className="flex items-center justify-between px-6 py-3 shrink-0" style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border-subtle)", transition: "background 0.25s ease" }}>
        {/* Sol: işletme adı */}
        <div className="flex items-center gap-2">
          <Store className="w-4 h-4 text-[#94a3b8]" />
          {kullanici ? (
            <span className="text-white font-semibold text-sm">{kullanici.businessAd}</span>
          ) : (
            <span className="w-28 h-4 rounded bg-[rgba(255,255,255,0.06)] animate-pulse" />
          )}
          <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold bg-[rgba(251,192,36,0.15)] text-[#fbc024] border border-[rgba(251,192,36,0.3)]">
            Skor: 72
          </span>
        </div>

        {/* Sağ: arama + bildirim + profil */}
        <div className="flex items-center gap-3">
          {/* Arama butonu */}
          <button
            onClick={() => setAramaAcik(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[rgba(251,192,36,0.1)] text-[#94a3b8] text-xs hover:border-[rgba(251,192,36,0.3)] hover:text-white transition-colors"
            style={{ background: "var(--bg-card)" }}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Ara...</span>
            <kbd className="ml-2 px-1 py-0.5 rounded text-[10px] bg-[rgba(251,192,36,0.1)] text-[#fbc024]">⌘K</kbd>
          </button>

          {/* Bildirimler */}
          <div className="relative">
            <button
              onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
              className="relative flex items-center justify-center w-8 h-8 rounded-lg border border-[rgba(251,192,36,0.1)] text-[#94a3b8] hover:border-[rgba(251,192,36,0.3)] hover:text-white transition-colors"
              style={{ background: "var(--bg-card)" }}
            >
              <Bell className="w-4 h-4" />
              {okunmamis.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[#ef4444] text-white text-[10px] font-bold px-1 pulse-yellow">
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
                  <div className="max-h-72 overflow-y-auto divide-y divide-[rgba(255,255,255,0.04)]">
                    {bildirimler.length === 0 ? (
                      <div className="py-8 text-center text-xs text-[#94a3b8]">Bildirim yok</div>
                    ) : (
                      bildirimler.slice(0, 6).map((b) => (
                        <div
                          key={b.id}
                          onClick={() => okunduYap(b.id)}
                          className="flex items-start gap-3 px-4 py-3 hover:bg-[rgba(251,192,36,0.04)] cursor-pointer transition-colors"
                        >
                          <span
                            className="mt-1.5 w-2 h-2 rounded-full shrink-0"
                            style={{
                              backgroundColor: b.okundu ? "transparent" : (b.tip === "kritik" ? "#ef4444" : b.tip === "uyari" ? "#fbc024" : "#94a3b8"),
                              border: b.okundu ? "1.5px solid rgba(148,163,184,0.3)" : "none",
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-semibold truncate ${b.okundu ? "text-[#94a3b8]" : "text-white"}`}>
                              {b.baslik}
                            </p>
                            <p className="text-[11px] text-[#94a3b8] truncate mt-0.5">{b.mesaj}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-[10px] text-[#94a3b8]">{zaman(b.tarih)}</span>
                            <Link
                              href={MODUL_HREF[b.modul] ?? "/dashboard"}
                              onClick={(e) => { e.stopPropagation(); okunduYap(b.id); setNotifOpen(false); }}
                              className="text-[#94a3b8] hover:text-[#fbc024] transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>
                      ))
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
