"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, TrendingUp, BarChart3, Package,
  CheckSquare, ClipboardList, Shield,
  ChevronLeft, ChevronRight, ChevronDown, Plane, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSirket } from "@/store/sirket";
import { MODULLER } from "@/lib/permissions";

const MODUL_ICON: Record<string, React.ElementType> = {
  "dashboard":   LayoutDashboard,
  "nakit-akisi": TrendingUp,
  "kar-zarar":   BarChart3,
  "stok":        Package,
  "gorevler":    CheckSquare,
  "prosedurler": ClipboardList,
  "acil-fon":    Shield,
  "ekip":        Users,
};

interface Props { mobile?: boolean; }

export default function Sidebar({ mobile = false }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [acikSekmeler, setAcikSekmeler] = useState<Set<string>>(new Set());
  const pathname     = usePathname();
  const { rol, rolAdi, permissions } = useSirket();

  const gorunenModuller = MODULLER.filter(({ key }) => {
    if (rol === "pilot") return true;
    return permissions?.modules[key as keyof NonNullable<typeof permissions>["modules"]] === true;
  });

  // Aktif sayfa bir alt sekmedeyse parent'ı otomatik aç
  useEffect(() => {
    for (const m of MODULLER) {
      if (m.altSekmeler?.some((s) => pathname.startsWith(s.href))) {
        setAcikSekmeler((prev) => {
          if (prev.has(m.key)) return prev;
          const next = new Set(prev);
          next.add(m.key);
          return next;
        });
      }
    }
  }, [pathname]);

  const sekmeAcKapat = (key: string) => {
    setAcikSekmeler((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const genislik = mobile ? 256 : collapsed ? 72 : 220;

  return (
    <motion.aside
      animate={{ width: genislik }}
      transition={{ duration: 0.22, ease: "easeInOut" }}
      className="relative flex flex-col h-full shrink-0"
      style={{ background: "var(--bg-sidebar)", borderRight: "1px solid rgba(255,255,255,0.08)" }}
    >
      {/* Logo */}
      <Link
        href="/dashboard"
        className="flex items-center gap-3 px-4 py-5 hover:bg-white/5 transition-colors"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/15 shrink-0">
          <Plane className="w-4 h-4 text-white rotate-45" />
        </div>
        {(!collapsed || mobile) && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-bold text-sm text-white tracking-wide truncate"
          >
            Pilot Sensin
          </motion.span>
        )}
      </Link>

      {/* Rol rozeti */}
      {(!collapsed || mobile) && rolAdi && (
        <div className="px-3 pt-3 pb-1">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-white/70">
            {rol === "pilot" ? "✈" : "🧭"} {rolAdi}
          </span>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {gorunenModuller.map((modul) => {
          const { key, label, altSekmeler } = modul;
          const Icon    = MODUL_ICON[key] ?? LayoutDashboard;
          const href    = `/${key}`;
          const active  = pathname === href || pathname.startsWith(href + "/");
          const acik    = acikSekmeler.has(key);
          const hasAlt  = !!altSekmeler?.length;

          return (
            <div key={key}>
              <div className={cn(
                "flex items-center gap-1 rounded-lg transition-all duration-150 group",
                active
                  ? "bg-white/15 text-white"
                  : "text-white/55 hover:bg-white/8 hover:text-white/85"
              )}>
                <Link
                  href={href}
                  title={collapsed && !mobile ? label : undefined}
                  className="flex-1 flex items-center gap-3 px-3 py-2.5 text-sm font-medium min-w-0"
                >
                  <Icon
                    className={cn(
                      "w-5 h-5 shrink-0 transition-colors",
                      active ? "text-white" : "text-white/55 group-hover:text-white/85"
                    )}
                  />
                  {(!collapsed || mobile) && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="truncate flex-1"
                    >
                      {label}
                    </motion.span>
                  )}
                  {active && !hasAlt && (!collapsed || mobile) && (
                    <motion.div
                      layoutId="active-pill"
                      className="w-1.5 h-1.5 rounded-full bg-white/60"
                    />
                  )}
                </Link>

                {hasAlt && (!collapsed || mobile) && (
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); sekmeAcKapat(key); }}
                    aria-label={acik ? `${label} alt sekmelerini gizle` : `${label} alt sekmelerini göster`}
                    aria-expanded={acik}
                    className="shrink-0 w-7 h-7 mr-1.5 flex items-center justify-center rounded-md hover:bg-white/10 transition-colors"
                  >
                    <motion.span
                      animate={{ rotate: acik ? 180 : 0 }}
                      transition={{ duration: 0.18, ease: "easeInOut" }}
                      className="flex items-center justify-center"
                    >
                      <ChevronDown className={cn(
                        "w-3.5 h-3.5 transition-colors",
                        active ? "text-white/80" : "text-white/50 group-hover:text-white/80"
                      )} />
                    </motion.span>
                  </button>
                )}
              </div>

              {/* Alt sekmeler */}
              {hasAlt && (!collapsed || mobile) && (
                <AnimatePresence initial={false}>
                  {acik && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="mt-0.5 ml-3 pl-4 py-0.5 space-y-0.5 border-l border-white/10">
                        {altSekmeler!.map((alt) => {
                          const altActive = pathname === alt.href || pathname.startsWith(alt.href + "/");
                          return (
                            <Link
                              key={alt.key}
                              href={alt.href}
                              className={cn(
                                "block px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-150",
                                altActive
                                  ? "bg-white/12 text-white"
                                  : "text-white/50 hover:bg-white/6 hover:text-white/85"
                              )}
                            >
                              {alt.label}
                            </Link>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          );
        })}
      </nav>

      {/* Yasal linkler — sadece açık halde */}
      {(!collapsed || mobile) && (
        <div className="px-4 py-3 shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-[9px] font-medium text-white/40 uppercase tracking-wider mb-1.5">Yasal</p>
          <div className="space-y-1">
            <Link href="/politikalar" className="block text-[11px] text-white/60 hover:text-white transition-colors">
              Tüm yasal belgeler →
            </Link>
            {[
              { href: "/politikalar/kvkk",              label: "KVKK" },
              { href: "/politikalar/gizlilik",           label: "Gizlilik" },
              { href: "/politikalar/kullanim-kosullari", label: "Kullanım Koşulları" },
              { href: "/politikalar/cerez",              label: "Çerez Politikası" },
            ].map(({ href, label }) => (
              <Link key={href} href={href}
                className="block text-[10px] text-white/40 hover:text-white/70 transition-colors truncate">
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Collapse button — desktop only */}
      {!mobile && (
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-1/2 -right-3.5 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center z-50 bg-white border border-gray-200 shadow-sm transition-shadow hover:shadow-md"
          style={{ color: "var(--forest)" }}
          title={collapsed ? "Genişlet" : "Daralt"}
        >
          {collapsed
            ? <ChevronRight className="w-3.5 h-3.5" />
            : <ChevronLeft  className="w-3.5 h-3.5" />}
        </button>
      )}
    </motion.aside>
  );
}
