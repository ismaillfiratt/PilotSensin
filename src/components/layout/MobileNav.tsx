"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, TrendingUp, Package,
  CheckSquare, Shield, Settings,
} from "lucide-react";

const NAV = [
  { href: "/dashboard",   icon: LayoutDashboard, label: "Ana Sayfa" },
  { href: "/nakit-akisi", icon: TrendingUp,       label: "Nakit"    },
  { href: "/stok",        icon: Package,          label: "Stok"     },
  { href: "/gorevler",    icon: CheckSquare,      label: "Görevler" },
  { href: "/acil-fon",    icon: Shield,           label: "Fon"      },
  { href: "/ayarlar",     icon: Settings,         label: "Ayarlar"  },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around px-2 py-2 border-t"
      style={{ background: "var(--bg-secondary)", borderColor: "var(--border-subtle)" }}
    >
      {NAV.map(({ href, icon: Icon, label }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all min-w-0"
            style={{ color: active ? "#fbc024" : "var(--text-muted)" }}
          >
            <div
              className="w-8 h-8 flex items-center justify-center rounded-xl transition-all"
              style={{ backgroundColor: active ? "rgba(251,192,36,0.15)" : "transparent" }}
            >
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-medium truncate">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
