"use client";

import Link from "next/link";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { useBildirimler } from "@/store/bildirimler";

const MODUL_HREF: Record<string, string> = {
  "stok":        "/stok",
  "nakit-akisi": "/nakit-akisi",
  "kar-zarar":   "/kar-zarar",
  "gorevler":    "/gorevler",
  "prosedurler": "/prosedurler",
  "acil-fon":    "/acil-fon",
  "sistem":      "/dashboard",
};

export default function AlertMarquee() {
  const { bildirimler, okunduYap } = useBildirimler();

  const aktif = bildirimler.filter(
    (b) => !b.okundu && (b.tip === "kritik" || b.tip === "uyari")
  );

  if (aktif.length === 0) {
    return (
      <div
        className="flex items-center h-9 overflow-hidden shrink-0 px-4 gap-2"
        style={{ background: "var(--bg-secondary)", borderTop: "1px solid var(--border-subtle)", transition: "background 0.25s ease" }}
      >
        <CheckCircle className="w-3.5 h-3.5 text-[#22c55e]" />
        <span className="text-xs text-[#94a3b8]">Aktif uyarı yok</span>
      </div>
    );
  }

  const doubled = [...aktif, ...aktif];

  return (
    <div
      className="flex items-center h-9 overflow-hidden shrink-0"
      style={{ background: "var(--bg-secondary)", borderTop: "1px solid var(--border-subtle)", transition: "background 0.25s ease" }}
    >
      <div className="flex items-center gap-1 px-3 shrink-0 border-r border-[rgba(251,192,36,0.15)] h-full">
        <AlertTriangle className="w-3.5 h-3.5 text-[#fbc024]" />
        <span className="text-[10px] font-bold text-[#fbc024] uppercase tracking-widest">
          Uyarılar
        </span>
        <span className="ml-1 text-[10px] font-bold bg-[#ef4444] text-white rounded-full w-4 h-4 flex items-center justify-center">
          {aktif.length}
        </span>
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="marquee-track flex gap-12 whitespace-nowrap">
          {doubled.map((b, i) => (
            <Link
              key={`${b.id}-${i}`}
              href={MODUL_HREF[b.modul] ?? "/dashboard"}
              onClick={() => okunduYap(b.id)}
              className={`text-xs font-medium hover:underline ${
                b.tip === "kritik" ? "text-[#ef4444]" : "text-[#fbc024]"
              }`}
            >
              {b.tip === "kritik" ? "🔴" : "🟡"} {b.baslik}: {b.mesaj}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
