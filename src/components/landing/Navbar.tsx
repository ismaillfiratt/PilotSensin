import Link from "next/link";
import { Plane, Menu } from "lucide-react";

export default function Navbar() {
  return (
    <header
      className="sticky top-0 z-30"
      style={{
        background: "#ffffff",
        borderBottom: "0.5px solid var(--border-subtle)",
      }}
    >
      <div
        className="max-w-6xl mx-auto px-6 flex items-center justify-between"
        style={{ height: 56 }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Plane
            className="w-5 h-5 shrink-0"
            style={{ color: "var(--forest)", transform: "rotate(-45deg)" }}
          />
          <span
            className="text-base font-bold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Pilot<span style={{ color: "var(--forest)" }}>Sensin</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          <a
            href="#fiyat"
            className="transition-colors hover:opacity-70"
            style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a", textDecoration: "none" }}
          >
            Fiyat
          </a>
          <Link
            href="/giris"
            className="transition-colors hover:opacity-70"
            style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}
          >
            Giriş
          </Link>
          <Link
            href="/kayit"
            className="rounded-md transition-opacity hover:opacity-90"
            style={{
              background: "#1F5C44",
              color: "#ffffff",
              WebkitTextFillColor: "#ffffff",
              fontWeight: 600,
              fontSize: 14,
              padding: "8px 14px",
              textDecoration: "none",
            }}
          >
            7 gün ücretsiz
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-md transition-colors hover:opacity-70"
          style={{ color: "var(--text-secondary)" }}
          aria-label="Menüyü aç"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
