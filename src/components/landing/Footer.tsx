import Link from "next/link";
import { Plane } from "lucide-react";

const GRUPLAR = [
  {
    baslik: "SİSTEM",
    linkler: [
      { href: "/dashboard", label: "Dashboard"    },
      { href: "#",          label: "Modüller"     },
      { href: "#",          label: "Fiyat"        },
      { href: "#",          label: "SSS"          },
    ],
  },
  {
    baslik: "ŞİRKET",
    linkler: [
      { href: "/iletisim",  label: "İletişim"     },
      { href: "/giris",     label: "Giriş yap"    },
      { href: "/kayit",     label: "Ücretsiz dene"},
    ],
  },
  {
    baslik: "YASAL",
    linkler: [
      { href: "/politikalar/kvkk",              label: "KVKK"               },
      { href: "/politikalar/gizlilik",           label: "Gizlilik"           },
      { href: "/politikalar/kullanim-kosullari", label: "Kullanım Koşulları" },
      { href: "/politikalar/cerez",              label: "Çerez Politikası"   },
    ],
  },
  {
    baslik: "SOSYAL",
    linkler: [
      { href: "#", label: "X (Twitter)" },
      { href: "#", label: "LinkedIn"    },
      { href: "#", label: "Instagram"   },
    ],
  },
] as const;

export default function Footer() {
  return (
    <footer style={{ background: "#0a0a0a", width: "100%" }}>
      <div className="max-w-6xl mx-auto">

        {/* Üst band — marka */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
            padding: "40px 32px 24px 32px",
            borderBottom: "0.5px solid #262626",
          }}
        >
          <Plane
            size={56}
            style={{
              color: "#f5f5f5",
              transform: "rotate(-45deg)",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: 56,
              fontWeight: 600,
              color: "#f5f5f5",
              letterSpacing: "-0.04em",
              lineHeight: 1,
            }}
          >
            PİLOT SENSİN
          </span>
        </div>

        {/* Orta band — linkler */}
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5"
          style={{
            padding: "24px 32px",
            borderBottom: "0.5px solid #262626",
          }}
        >
          {GRUPLAR.map(({ baslik, linkler }) => (
            <div key={baslik}>
              <p
                style={{
                  fontSize: 11,
                  color: "#737373",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  margin: "0 0 8px 0",
                  fontWeight: 500,
                }}
              >
                {baslik}
              </p>
              <ul className="flex flex-col gap-1" style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {linkler.map(({ href, label }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      style={{
                        color: "#d4d4d4",
                        fontSize: 12,
                        textDecoration: "none",
                      }}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Alt band — copyright */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between"
          style={{
            padding: "14px 32px",
            gap: 4,
          }}
        >
          <span style={{ fontSize: 11, color: "#737373" }}>© 2026 PilotSensin</span>
          <span style={{ fontSize: 11, color: "#737373" }}>Türkiye&apos;de yapıldı</span>
        </div>

      </div>
    </footer>
  );
}
