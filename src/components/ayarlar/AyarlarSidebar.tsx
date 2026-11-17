"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell, Lock, ShieldCheck, Download, Trash2,
  FileText, HelpCircle, MessageCircle, Package,
  User, LogOut, AlertTriangle, ArrowUpRight,
} from "lucide-react";
import { createClient }  from "@/utils/supabase/client";
import { storesSifirla } from "@/lib/auth-temizlik";

interface Props { aktifTab: string }

type Madde =
  | { key: string;  label: string; icon: React.ElementType; dis?: false }
  | { href: string; label: string; icon: React.ElementType; dis: true };

interface Grup {
  baslik: string;
  maddeler: Madde[];
  tehlike?: boolean;
}

const GRUPLAR: Grup[] = [
  {
    baslik: "TERCİHLER",
    maddeler: [
      { key: "bildirim", label: "Bildirimler", icon: Bell    },
    ],
  },
  {
    baslik: "HESAP & GÜVENLİK",
    maddeler: [
      { key: "sifre",    label: "Şifre",    icon: Lock       },
      { key: "guvenlik", label: "Güvenlik", icon: ShieldCheck },
    ],
  },
  {
    baslik: "VERİ YÖNETİMİ",
    maddeler: [
      { key: "veri-indir", label: "Verilerimi indir", icon: Download },
      { key: "cop-kutusu", label: "Çöp kutusu", icon: Trash2 },
    ],
  },
  {
    baslik: "YASAL",
    maddeler: [
      { key: "yasal", label: "KVKK & Sözleşmeler", icon: FileText },
    ],
  },
  {
    baslik: "YARDIM",
    maddeler: [
      { key: "sss",   label: "Sıkça Sorulan Sorular", icon: HelpCircle    },
      { key: "iletisim", label: "İletişim & Destek", icon: MessageCircle },
      { key: "surum", label: "Sürüm notları",          icon: Package       },
    ],
  },
  {
    baslik: "TEHLİKE",
    tehlike: true,
    maddeler: [
      { key: "tehlike", label: "Hesabı sil", icon: AlertTriangle },
    ],
  },
];

// Mobil tab bar için sadece ?tab= olan maddeler
const MOBIL_TABLAR = GRUPLAR.flatMap(g =>
  g.maddeler.filter((m): m is Extract<Madde, { key: string }> => !("href" in m))
);

export default function AyarlarSidebar({ aktifTab }: Props) {
  const router = useRouter();

  const handleCikis = async () => {
    storesSifirla();
    await createClient().auth.signOut();
    router.push("/giris");
    router.refresh();
  };

  // ── MOBILE ─────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="lg:hidden flex gap-1 overflow-x-auto scrollbar-hide p-1 bg-gray-50 border border-gray-200 rounded-xl mb-2">
        {MOBIL_TABLAR.map(({ key, label, icon: Icon }) => {
          const aktif = aktifTab === key;
          return (
            <Link
              key={key}
              href={`?tab=${key}`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0"
              style={{
                backgroundColor: aktif ? "rgba(15,61,46,0.08)" : "transparent",
                color:           aktif ? "var(--forest)"        : "#94a3b8",
              }}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              {label}
            </Link>
          );
        })}
      </div>

      {/* ── DESKTOP ─────────────────────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col card rounded-2xl overflow-hidden">
        {/* Üst başlık */}
        <div className="px-4 py-4 border-b border-gray-100">
          <p className="label-caps text-[10px]">AYARLAR</p>
          <p className="text-xs text-gray-400 mt-0.5">Bildirim ve hesap tercihleri</p>
        </div>

        {/* Menü grupları */}
        <div className="px-2 py-2 flex-1">
          {GRUPLAR.map(({ baslik, maddeler, tehlike }) => (
            <div key={baslik} className="mb-1">
              <p
                className="text-[10px] uppercase tracking-wider px-3 mt-3 mb-1"
                style={{ color: tehlike ? "#C97676" : "#9ca3af" }}
              >
                {baslik}
              </p>
              {maddeler.map((madde) => {
                const isDis = "href" in madde;
                const aktif = !isDis && aktifTab === madde.key;
                const Icon  = madde.icon;

                const baseStyle: React.CSSProperties = tehlike
                  ? {
                      backgroundColor: aktif ? "rgba(201,118,118,0.08)" : "transparent",
                      color:           "#C97676",
                      fontWeight:      aktif ? 500 : 400,
                    }
                  : {
                      backgroundColor: aktif ? "rgba(15,61,46,0.08)" : "transparent",
                      color:           aktif ? "var(--forest)"        : "#374151",
                      fontWeight:      aktif ? 500 : 400,
                    };

                const iconColor = tehlike
                  ? "#C97676"
                  : aktif ? "var(--forest)" : "#9ca3af";

                const className =
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all" +
                  (tehlike ? " hover:bg-[rgba(201,118,118,0.06)]" : " hover:bg-gray-50");

                if (isDis) {
                  return (
                    <Link key={madde.href} href={madde.href} className={className} style={baseStyle}>
                      <Icon className="w-4 h-4 shrink-0" style={{ color: iconColor }} />
                      <span className="flex-1">{madde.label}</span>
                      <ArrowUpRight className="w-3 h-3 text-gray-400 shrink-0" />
                    </Link>
                  );
                }

                return (
                  <Link key={madde.key} href={`?tab=${madde.key}`} className={className} style={baseStyle}>
                    <Icon className="w-4 h-4 shrink-0" style={{ color: iconColor }} />
                    {madde.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Alt kısım */}
        <div className="px-2 py-2 border-t border-gray-100">
          <Link
            href="/profil"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-all"
          >
            <User className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="flex-1">Profilime git</span>
            <ArrowUpRight className="w-3 h-3 text-gray-400 shrink-0" />
          </Link>
          <button
            onClick={handleCikis}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-all text-left"
          >
            <LogOut className="w-4 h-4 text-gray-400 shrink-0" />
            Çıkış yap
          </button>
        </div>
      </div>
    </>
  );
}
