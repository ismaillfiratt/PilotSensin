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

  const genislik = mobile ? 256 : collapsed ? 64 : 220;

  return (
    <motion.aside
      animate={{ width: genislik }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="relative flex flex-col h-full shrink-0"
      style={{ background: "var(--bg-secondary)", borderRight: "1px solid var(--border-subtle)", transition: "background 0.25s ease" }}
    >
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-3 px-4 py-5 border-b border-[rgba(251,192,36,0.1)] hover:opacity-80 transition-opacity">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#fbc024] shrink-0">
          <Plane className="w-4 h-4 text-[#0e172a] rotate-45" />
        </div>
        {(!collapsed || mobile) && (
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-bold text-base text-white tracking-wide">
            Pilot Sensin
          </motion.span>
        )}
      </Link>

      {/* Rol rozeti */}
      {(!collapsed || mobile) && rolAdi && (
        <div className="px-4 pt-3 pb-1">
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
            style={
              rol === "pilot"
                ? { background: "rgba(251,192,36,0.15)", color: "#fbc024", border: "1px solid rgba(251,192,36,0.3)" }
                : { background: "rgba(148,163,184,0.1)", color: "#94a3b8", border: "1px solid rgba(148,163,184,0.2)" }
            }
          >
            {rol === "pilot" ? "✈" : "🧭"} {rolAdi}
          </span>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto overflow-x-hidden">
        {gorunenModuller.map(({ key, label }) => {
          const Icon   = MODUL_ICON[key] ?? LayoutDashboard;
          const href   = `/${key}`;
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={key}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                active
                  ? "bg-[rgba(251,192,36,0.15)] text-[#fbc024] border border-[rgba(251,192,36,0.3)]"
                  : "text-[#94a3b8] hover:bg-[rgba(251,192,36,0.08)] hover:text-white"
              )}
            >
              <Icon className={cn("w-5 h-5 shrink-0 transition-colors", active ? "text-[#fbc024]" : "text-[#94a3b8] group-hover:text-white")} />
              {(!collapsed || mobile) && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="truncate">
                  {label}
                </motion.span>
              )}
              {active && (!collapsed || mobile) && (
                <motion.div layoutId="active-indicator" className="ml-auto w-1.5 h-1.5 rounded-full bg-[#fbc024]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Yasal linkler */}
      {(!collapsed || mobile) && (
        <div className="px-3 pb-3 border-t" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="flex items-center gap-1.5 pt-3 pb-1">
            <Scale className="w-3 h-3 text-[#64748b]" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#64748b]">Yasal</span>
          </div>
          <div className="space-y-0.5">
            <Link href="/politikalar" className="block text-[11px] text-[#fbc024] hover:text-[#d9a61f] transition-colors py-0.5 font-semibold">
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
              <Link key={href} href={href} className="block text-[11px] text-[#64748b] hover:text-[#94a3b8] transition-colors py-0.5 truncate">
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Collapse button — sadece desktop */}
      {!mobile && (
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-1/2 -right-4 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-all z-50 shadow-lg"
          style={{
            background: "#fbc024",
            color: "#0e172a",
            border: "2px solid #0e172a",
            boxShadow: "0 0 0 2px #fbc024, 0 4px 12px rgba(251,192,36,0.5)",
          }}
          title={collapsed ? "Genişlet" : "Daralt"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4 font-black" /> : <ChevronLeft className="w-4 h-4 font-black" />}
        </button>
      )}
    </motion.aside>
  );
}
