"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard, TrendingUp, BarChart3, Package,
  CheckSquare, ClipboardList, Shield, Scale,
  ChevronLeft, ChevronRight, Plane, Users,
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
  const pathname     = usePathname();
  const { rol, rolAdi, permissions } = useSirket();

  const gorunenModuller = MODULLER.filter(({ key }) => {
    if (rol === "pilot") return true;
    return permissions?.modules[key] === true;
  });

  const genislik = mobile ? 256 : collapsed ? 72 : 220;

  return (
    <motion.aside
      animate={{ width: genislik }}
      transition={{ duration: 0.22, ease: "easeInOut" }}
      className="relative flex flex-col h-full shrink-0"
      style={{ background: "var(--forest)", borderRight: "1px solid rgba(255,255,255,0.08)" }}
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
        {gorunenModuller.map(({ key, label }) => {
          const Icon   = MODUL_ICON[key] ?? LayoutDashboard;
          const href   = `/${key}`;
          const active = pathname === href || pathname.startsWith(href + "/");

          return (
            <Link
              key={key}
              href={href}
              title={collapsed && !mobile ? label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group",
                active
                  ? "bg-white/15 text-white"
                  : "text-white/55 hover:bg-white/8 hover:text-white/85"
              )}
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
                  className="truncate"
                >
                  {label}
                </motion.span>
              )}
              {active && (!collapsed || mobile) && (
                <motion.div
                  layoutId="active-pill"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Yasal linkler */}
      {(!collapsed || mobile) && (
        <div className="px-3 pb-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-1.5 pt-3 pb-1">
            <Scale className="w-3 h-3 text-white/30" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-white/30">Yasal</span>
          </div>
          <div className="space-y-0.5">
            <Link
              href="/politikalar"
              className="block text-[11px] text-white/55 hover:text-white/80 transition-colors py-0.5 font-semibold"
            >
              Tüm Yasal Belgeler →
            </Link>
            {[
              { href: "/politikalar/kvkk",               label: "KVKK"               },
              { href: "/politikalar/gizlilik",            label: "Gizlilik"           },
              { href: "/politikalar/kullanim-kosullari",  label: "Kullanım Koşulları" },
              { href: "/politikalar/cerez",               label: "Çerez"              },
              { href: "/politikalar/iade-iptal",          label: "İade & İptal"       },
              { href: "/politikalar/sla",                 label: "SLA"                },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="block text-[11px] text-white/30 hover:text-white/55 transition-colors py-0.5 truncate"
              >
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
