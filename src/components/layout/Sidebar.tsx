"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  TrendingUp,
  BarChart3,
  Package,
  CheckSquare,
  ClipboardList,
  Shield,
  Scale,
  ChevronLeft,
  ChevronRight,
  Plane,
} from "lucide-react";
import { cn } from "@/lib/utils";

const modules = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/nakit-akisi", icon: TrendingUp, label: "Nakit Akışı" },
  { href: "/kar-zarar", icon: BarChart3, label: "Kar-Zarar" },
  { href: "/stok", icon: Package, label: "Stok Yönetimi" },
  { href: "/gorevler", icon: CheckSquare, label: "Görevler" },
  { href: "/prosedurler", icon: ClipboardList, label: "Prosedürler" },
  { href: "/acil-fon", icon: Shield, label: "Acil Durum Fonu" },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 220 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="relative flex flex-col h-full overflow-hidden shrink-0"
      style={{ background: "var(--bg-secondary)", borderRight: "1px solid var(--border-subtle)", transition: "background 0.25s ease" }}
    >
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-3 px-4 py-5 border-b border-[rgba(251,192,36,0.1)] hover:opacity-80 transition-opacity">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#fbc024] shrink-0">
          <Plane className="w-4 h-4 text-[#0e172a] rotate-45" />
        </div>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="font-bold text-base text-white tracking-wide"
          >
            Pilot Sensin
          </motion.span>
        )}
      </Link>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {modules.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                active
                  ? "bg-[rgba(251,192,36,0.15)] text-[#fbc024] border border-[rgba(251,192,36,0.3)]"
                  : "text-[#94a3b8] hover:bg-[rgba(251,192,36,0.08)] hover:text-white"
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5 shrink-0 transition-colors",
                  active ? "text-[#fbc024]" : "text-[#94a3b8] group-hover:text-white"
                )}
              />
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="truncate"
                >
                  {label}
                </motion.span>
              )}
              {active && !collapsed && (
                <motion.div
                  layoutId="active-indicator"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-[#fbc024]"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Yasal linkler */}
      {!collapsed && (
        <div className="px-3 pb-3 border-t" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="flex items-center gap-1.5 pt-3 pb-1">
            <Scale className="w-3 h-3 text-[#64748b]" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#64748b]">
              Yasal
            </span>
          </div>
          <div className="space-y-0.5">
            {[
              { href: "/politikalar/kvkk",              label: "KVKK" },
              { href: "/politikalar/gizlilik",          label: "Gizlilik" },
              { href: "/politikalar/kullanim-kosullari", label: "Kullanım Koşulları" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="block text-[11px] text-[#64748b] hover:text-[#94a3b8] transition-colors py-0.5 truncate"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Collapse button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute top-1/2 -right-3 transform -translate-y-1/2 w-6 h-6 rounded-full border border-[rgba(251,192,36,0.3)] flex items-center justify-center text-[#fbc024] hover:bg-[#fbc024] hover:text-[#0e172a] transition-colors z-10"
        style={{ background: "var(--bg-secondary)" }}
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3" />
        ) : (
          <ChevronLeft className="w-3 h-3" />
        )}
      </button>
    </motion.aside>
  );
}
