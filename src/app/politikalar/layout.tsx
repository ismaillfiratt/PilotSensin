import Link from "next/link";
import { Plane } from "lucide-react";

export default function PolitikalarLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}
    >
      {/* Minimal header */}
      <header
        className="sticky top-0 z-10 border-b flex items-center justify-between px-6 py-3"
        style={{ background: "var(--bg-secondary)", borderColor: "var(--border-subtle)" }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#fbc024] flex items-center justify-center">
            <Plane className="w-3.5 h-3.5 text-[#0e172a] rotate-45" />
          </div>
          <span className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
            Pilot Sensin
          </span>
        </div>
        <Link
          href="/ayarlar"
          className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
          style={{
            color: "var(--text-secondary)",
            borderColor: "var(--border-subtle)",
          }}
        >
          ← Geri Dön
        </Link>
      </header>

      {/* İçerik */}
      <div className="max-w-3xl mx-auto px-6 py-10">{children}</div>

      {/* Footer */}
      <footer
        className="border-t text-center py-4 text-xs"
        style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}
      >
        © {new Date().getFullYear()} Pilot Sensin · Tüm hakları saklıdır
      </footer>
    </div>
  );
}
