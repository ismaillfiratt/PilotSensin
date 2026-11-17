"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, Search, User, Settings, LogOut, ChevronDown,
  CheckCheck, ExternalLink, ChevronLeft, Menu,
  CheckCircle2, Circle,
} from "lucide-react";
import { useLayout }      from "@/store/layout";
import { createClient }   from "@/utils/supabase/client";
import { useBildirimler } from "@/store/bildirimler";
import AramaModal         from "@/components/arama/AramaModal";
import UyariRozeti        from "./UyariRozeti";
import { storesSifirla }     from "@/lib/auth-temizlik";

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
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [aramaAcik,   setAramaAcik]   = useState(false);
  const [kullanici,   setKullanici]   = useState<KullaniciBilgi | null>(null);

  const { bildirimler, okunduYap, okunduToggle } = useBildirimler();
  const notifRef                = useRef<HTMLDivElement>(null);
  const { mobileSidebarToggle } = useLayout();

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

  // ── Badge hesabı — sadece kaynak !== "tarama" okunmamışlar ──────────────
  const okunmamisOlaylar = bildirimler.filter((b) =>
    !b.silindi && !b.okundu && b.kaynak !== "tarama"
  );

  const toplamBadge = okunmamisOlaylar.length;

  const badgeRenk =
    okunmamisOlaylar.some((b) => b.tip === "kritik") ? "#EF4444" :
    okunmamisOlaylar.some((b) => b.tip === "uyari")  ? "#F59E0B" :
    okunmamisOlaylar.length > 0                       ? "var(--leaf)" : undefined;

  const handleTumunuOkundu = () => {
    bildirimler
      .filter((b) => !b.silindi && !b.okundu && b.kaynak !== "tarama")
      .forEach((b) => okunduYap(b.id));
  };

  // ── Dropdown son olaylar ───────────────────────────────────────────────────
  const sonOlaylar = bildirimler
    .filter((b) => !b.silindi && b.kaynak !== "tarama")
    .slice(0, 5);

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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setAramaAcik((p) => !p);
        return;
      }
      if (e.key === "/" && !aramaAcik) {
        const target = e.target as HTMLElement;
        const editable = ["INPUT", "TEXTAREA"].includes(target.tagName) || target.isContentEditable;
        if (!editable) { e.preventDefault(); setAramaAcik(true); }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [aramaAcik]);

  const handleCikis = async () => {
    storesSifirla();
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/giris");
    router.refresh();
  };

  const initials = kullanici
    ? ((kullanici.ad[0] ?? kullanici.email[0] ?? "?").toUpperCase())
    : "?";

  const displayName = kullanici
    ? (kullanici.ad || kullanici.email.split("@")[0])
    : "...";

  return (
    <>
      {/* ── Mobile header ── */}
      <header
        className="md:hidden flex items-center justify-between h-14 px-4 shrink-0"
        style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border-color)" }}
      >
        {pathname !== "/dashboard" ? (
          <button
            onClick={() => router.back()}
            className="min-w-11 min-h-11 flex items-center justify-center -ml-1 rounded-xl text-gray-400 active:bg-gray-50 transition-colors"
            aria-label="Geri"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={mobileSidebarToggle}
            className="min-w-11 min-h-11 flex items-center justify-center -ml-1 rounded-xl text-gray-400 active:bg-gray-50 transition-colors"
            aria-label="Menüyü aç"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <Link href="/dashboard" className="font-semibold text-sm text-gray-800 truncate max-w-[160px] text-center">
          {kullanici?.businessAd ?? "—"}
        </Link>

        <Link
          href="/bildirimler"
          className="min-w-11 min-h-11 flex items-center justify-center -mr-1 rounded-xl text-gray-400 active:bg-gray-50 transition-colors relative"
        >
          <Bell className="w-5 h-5" />
          {toplamBadge > 0 && (
            <span
              className="absolute top-2 right-2 min-w-4.5 h-4.5 flex items-center justify-center rounded-full text-white text-[10px] font-bold px-1"
              style={{ backgroundColor: badgeRenk ?? "#EF4444" }}
            >
              {toplamBadge > 9 ? "9+" : toplamBadge}
            </span>
          )}
        </Link>
      </header>

      {/* ── Desktop header ── */}
      <header
        className="hidden md:flex items-center justify-between px-6 py-3 shrink-0"
        style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border-color)" }}
      >
        {/* Sol: işletme adı + breadcrumb */}
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Link href="/dashboard" className="font-medium text-gray-700 hover:text-gray-900 transition-colors">
            {kullanici?.businessAd ?? "—"}
          </Link>
          {pathname !== "/dashboard" && pathname !== "/" && (
            <>
              <span className="text-gray-300">/</span>
              <span className="text-gray-500 capitalize">
                {pathname.split("/").filter(Boolean).pop()?.replace(/-/g, " ")}
              </span>
            </>
          )}
        </div>

        {/* Sağ: arama + bildirim + profil */}
        <div className="flex items-center gap-2">
          {/* Arama — desktop */}
          <button
            onClick={() => setAramaAcik(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-gray-400 text-xs bg-gray-50 border border-gray-200 hover:border-gray-300 hover:text-gray-600 transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Ara...</span>
            <kbd className="ml-2 px-1 py-0.5 rounded text-[10px] bg-gray-100 text-gray-500 font-mono">⌘K</kbd>
          </button>
          <button
            onClick={() => setAramaAcik(true)}
            className="sm:hidden w-9 h-9 flex items-center justify-center rounded-lg bg-gray-50 border border-gray-200 text-gray-500 hover:border-gray-300 transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Uyarı rozeti */}
          <UyariRozeti />

          {/* Bildirimler */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
              className="relative w-9 h-9 flex items-center justify-center rounded-lg bg-gray-50 border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-colors"
            >
              <Bell className="w-4 h-4" />
              {toplamBadge > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 min-w-4.5 h-4.5 flex items-center justify-center rounded-full text-white text-[10px] font-bold px-1"
                  style={{ backgroundColor: badgeRenk ?? "#EF4444" }}
                >
                  {toplamBadge > 9 ? "9+" : toplamBadge}
                </span>
              )}
            </button>

            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-11 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden"
                >
                  <div className="max-h-[420px] overflow-y-auto">

                    {/* ── Son Olaylar ── */}
                    <div className="px-4 pt-2 pb-1 flex items-center justify-between">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                        Son Olaylar
                      </p>
                      {okunmamisOlaylar.length > 0 && (
                        <button
                          onClick={handleTumunuOkundu}
                          className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1"
                        >
                          <CheckCheck className="w-3 h-3" />
                          Tümünü okundu say
                        </button>
                      )}
                    </div>
                    {sonOlaylar.length === 0 ? (
                      <div className="px-4 pb-3 text-xs text-gray-400">Olay kaydı yok</div>
                    ) : (
                      sonOlaylar.map((b) => {
                        const dotColor =
                          b.tip === "kritik" ? "#EF4444" :
                          b.tip === "uyari"  ? "#F59E0B" : "#10B981";
                        return (
                          <div
                            key={b.id}
                            className="flex items-start gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors group"
                          >
                            <span
                              className="mt-1.5 w-2 h-2 rounded-full shrink-0"
                              style={{
                                backgroundColor: b.okundu ? "transparent" : dotColor,
                                border: b.okundu ? "1.5px solid #CBD5E1" : "none",
                              }}
                            />
                            <div
                              className="flex-1 min-w-0 cursor-pointer"
                              onClick={() => okunduYap(b.id)}
                            >
                              <p
                                className="text-xs font-semibold truncate"
                                style={{ color: b.okundu ? "#94A3B8" : dotColor }}
                              >
                                {b.baslik}
                              </p>
                              <p className="text-[11px] text-gray-400 truncate mt-0.5">{b.mesaj}</p>
                              <p className="text-[10px] text-gray-300 mt-0.5">{zaman(b.tarih)}</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => okunduToggle(b.id)}
                                title={b.okundu ? "Okunmadı işaretle" : "Okundu işaretle"}
                                className="w-6 h-6 flex items-center justify-center rounded-md transition-colors"
                                style={{ color: b.okundu ? "#10B981" : "#94A3B8" }}
                              >
                                {b.okundu
                                  ? <CheckCircle2 className="w-3.5 h-3.5" />
                                  : <Circle       className="w-3.5 h-3.5" />}
                              </button>
                              <Link
                                href={b.ilgiliLink ?? MODUL_HREF[b.modul] ?? "/dashboard"}
                                onClick={(e) => { e.stopPropagation(); okunduYap(b.id); setNotifOpen(false); }}
                                className="w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-600 transition-colors"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* ── En alt ── */}
                  <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-between">
                    <Link
                      href="/bildirimler"
                      onClick={() => setNotifOpen(false)}
                      className="text-xs font-medium transition-colors hover:opacity-75"
                      style={{ color: "var(--leaf)" }}
                    >
                      Tüm bildirimleri gör →
                    </Link>
                    {toplamBadge > 0 && (
                      <span className="text-xs font-semibold" style={{ color: badgeRenk }}>
                        {toplamBadge} bekliyor
                      </span>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profil */}
          <div className="relative">
            <button
              onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-gray-50 border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ background: "var(--forest)" }}
              >
                {initials}
              </div>
              <span className="text-sm text-gray-700 font-medium">{displayName}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-11 w-44 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden"
                >
                  {[
                    { icon: User,     label: "Profilim", href: "/profil"  },
                    { icon: Settings, label: "Ayarlar",  href: "/ayarlar" },
                  ].map(({ icon: Icon, label, href }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-colors"
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </Link>
                  ))}
                  <div className="border-t border-gray-100">
                    <button
                      onClick={handleCikis}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
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

      <AramaModal acik={aramaAcik} onKapat={() => setAramaAcik(false)} />
    </>
  );
}
