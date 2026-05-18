"use client";

import { useState, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Home, Package, Wallet, CheckSquare, MoreHorizontal,
  ClipboardCheck, TrendingUp, Shield, Bell, User,
  Settings, Users, LogOut, ChevronRight, MessageCircle, Scale,
  type LucideIcon,
} from "lucide-react";
import { useSirket }      from "@/store/sirket";
import { useBildirimler } from "@/store/bildirimler";
import { createClient }   from "@/utils/supabase/client";

/* ─── Tip tanımları ─── */
interface Sekme {
  key:   string;
  label: string;
  ikon:  LucideIcon;
  href:  string | null;
}

interface SayfaItem {
  label:    string;
  href:     string;
  ikon:     LucideIcon;
}

/* ─── Sabitler ─── */
const PILOT_DAHA: SayfaItem[] = [
  { label: "Kâr-Zarar",           href: "/kar-zarar",    ikon: TrendingUp     },
  { label: "Prosedürler",         href: "/prosedurler",  ikon: ClipboardCheck },
  { label: "Acil Fon",            href: "/acil-fon",     ikon: Shield         },
  { label: "Bildirimler",         href: "/bildirimler",  ikon: Bell           },
  { label: "İletişim & Destek",   href: "/iletisim",     ikon: MessageCircle  },
  { label: "Yasal Bilgiler",      href: "/politikalar",  ikon: Scale          },
  { label: "Profil",              href: "/profil",       ikon: User           },
  { label: "Ayarlar",             href: "/ayarlar",      ikon: Settings       },
  { label: "Ekip",                href: "/ekip",         ikon: Users          },
];

const COPILOT_DAHA: SayfaItem[] = [
  { label: "Bildirimler",        href: "/bildirimler",  ikon: Bell           },
  { label: "İletişim & Destek",  href: "/iletisim",     ikon: MessageCircle  },
  { label: "Yasal Bilgiler",     href: "/politikalar",  ikon: Scale          },
  { label: "Profil",             href: "/profil",       ikon: User           },
  { label: "Ayarlar",            href: "/ayarlar",      ikon: Settings       },
];

export default function MobileNav() {
  const pathname   = usePathname();
  const router     = useRouter();
  const [dahaAcik, setDahaAcik] = useState(false);

  const { rol }       = useSirket();
  const okunmamis     = useBildirimler((s) => s.bildirimler.filter((b) => !b.okundu).length);
  const copilot       = rol === "copilot";

  /* ── 5 sekme, 3. sekme role'e göre değişir ── */
  const sekmeler: Sekme[] = useMemo(() => [
    { key: "dashboard",   label: "Ana",     ikon: Home,           href: "/dashboard"   },
    { key: "stok",        label: "Stok",    ikon: Package,        href: "/stok"        },
    copilot
      ? { key: "prosedurler", label: "Prosedür", ikon: ClipboardCheck, href: "/prosedurler" }
      : { key: "nakit-akisi", label: "Nakit",    ikon: Wallet,         href: "/nakit-akisi" },
    { key: "gorevler",    label: "Görev",   ikon: CheckSquare,    href: "/gorevler"    },
    { key: "daha",        label: "Daha",    ikon: MoreHorizontal, href: null           },
  ], [copilot]);

  const dahaListesi = copilot ? COPILOT_DAHA : PILOT_DAHA;

  /* Aktif sekme tespiti */
  const aktifKey = useMemo(() => {
    const eslesen = sekmeler.find((s) => {
      if (!s.href) return false;
      if (s.href === "/dashboard") return pathname === "/dashboard";
      return pathname.startsWith(s.href);
    });
    if (eslesen) return eslesen.key;
    // Daha listesindeki bir sayfadaysa "daha" aktif
    const dahaEslesen = dahaListesi.some((d) =>
      d.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(d.href)
    );
    return dahaEslesen ? "daha" : "dashboard";
  }, [pathname, sekmeler, dahaListesi]);

  const handleCikis = async () => {
    setDahaAcik(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/giris");
    router.refresh();
  };

  const handleDahaItem = (href: string) => {
    setDahaAcik(false);
    router.push(href);
  };

  return (
    <>
      {/* ── Alt navigasyon çubuğu ── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 h-16 pb-safe bg-[#0e172a]/95 backdrop-blur-lg border-t border-white/10">
        <div className="flex h-full items-stretch">
          {sekmeler.map(({ key, label, ikon: Ikon, href }) => {
            const aktif = aktifKey === key;
            const renk  = aktif ? "#fbc024" : "#64748b";

            if (key === "daha") {
              return (
                <button
                  key="daha"
                  onClick={() => setDahaAcik(true)}
                  className="flex-1 flex flex-col items-center justify-center gap-0.5 min-h-11 active:bg-white/5 transition-colors relative"
                >
                  <Ikon className="w-5.5 h-5.5" style={{ color: renk }} />
                  <span className="text-[10px] font-medium" style={{ color: renk }}>{label}</span>
                  {okunmamis > 0 && (
                    <span className="absolute top-2 right-[calc(50%-18px)] w-2 h-2 rounded-full bg-[#ef4444]" />
                  )}
                </button>
              );
            }

            return (
              <Link
                key={key}
                href={href!}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 min-h-11 active:bg-white/5 transition-colors"
              >
                <Ikon className="w-5.5 h-5.5" style={{ color: renk }} />
                <span className="text-[10px] font-medium" style={{ color: renk }}>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── "Daha" bottom sheet ── */}
      <AnimatePresence>
        {dahaAcik && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 z-40 bg-black/60"
              onClick={() => setDahaAcik(false)}
            />

            {/* Sheet */}
            <motion.div
              key="sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={{ top: 0, bottom: 0.3 }}
              onDragEnd={(_, info) => { if (info.velocity.y > 300 || info.offset.y > 100) setDahaAcik(false); }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-[#0e172a] border-t border-white/10 rounded-t-2xl max-h-[70vh] overflow-y-auto pb-safe"
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              {/* Navigasyon ögeleri */}
              <div className="px-2 pb-2">
                {dahaListesi.map(({ label, href, ikon: Ikon }) => {
                  const aktif = href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(href);
                  return (
                    <button
                      key={href}
                      onClick={() => handleDahaItem(href)}
                      className="w-full flex items-center gap-4 px-4 min-h-14 rounded-xl active:bg-white/5 transition-colors"
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: aktif ? "rgba(251,192,36,0.12)" : "rgba(255,255,255,0.05)",
                        }}
                      >
                        <Ikon className="w-4.5 h-4.5" style={{ color: aktif ? "#fbc024" : "#94a3b8" }} />
                      </div>
                      <span className="flex-1 text-sm font-medium text-left" style={{ color: aktif ? "#fbc024" : "#e2e8f0" }}>
                        {label}
                      </span>
                      <ChevronRight className="w-4 h-4 text-[#475569] shrink-0" />
                    </button>
                  );
                })}

                {/* Ayırıcı + Çıkış */}
                <div className="border-t border-white/8 my-2" />
                <button
                  onClick={handleCikis}
                  className="w-full flex items-center gap-4 px-4 min-h-14 rounded-xl active:bg-red-500/10 transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-red-500/10">
                    <LogOut className="w-4.5 h-4.5 text-[#ef4444]" />
                  </div>
                  <span className="flex-1 text-sm font-medium text-[#ef4444] text-left">Çıkış Yap</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
