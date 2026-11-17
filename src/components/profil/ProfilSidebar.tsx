"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User, ShieldCheck, Building2, CreditCard,
  History, Settings, LogOut,
} from "lucide-react";
import { createClient }  from "@/utils/supabase/client";
import { useSirket }     from "@/store/sirket";
import { storesSifirla } from "@/lib/auth-temizlik";

interface Props { aktifTab: string }

interface KullaniciBilgi { ad: string; email: string }

const GRUPLAR = [
  {
    baslik: "HESAP",
    maddeler: [
      { key: "kisisel",  label: "Kişisel Bilgiler", icon: User        },
      { key: "guvenlik", label: "Hesap Güvenliği",  icon: ShieldCheck },
    ],
  },
  {
    baslik: "İŞLETME",
    maddeler: [
      { key: "isletme",  label: "İşletme Bilgileri", icon: Building2   },
      { key: "abonelik", label: "Abonelik & Plan",    icon: CreditCard  },
    ],
  },
  {
    baslik: "AKTİVİTE",
    maddeler: [
      { key: "aktivite", label: "Aktivitelerim", icon: History },
    ],
  },
];

export default function ProfilSidebar({ aktifTab }: Props) {
  const router = useRouter();
  const { rol, sirketAdi } = useSirket();
  const [kullanici, setKullanici] = useState<KullaniciBilgi | null>(null);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (!data.user) return;
      const m = data.user.user_metadata ?? {};
      setKullanici({ ad: m.ad ?? "", email: data.user.email ?? "" });
    });
  }, []);

  const initials = kullanici
    ? (kullanici.ad[0] ?? kullanici.email[0] ?? "?").toUpperCase()
    : "?";
  const displayName = kullanici
    ? kullanici.ad || kullanici.email.split("@")[0]
    : "—";
  const altYazi = rol === "pilot" ? `Pilot · ${sirketAdi ?? "İşletmem"}` : `Co-Pilot · ${sirketAdi ?? "İşletmem"}`;

  const handleCikis = async () => {
    storesSifirla();
    await createClient().auth.signOut();
    router.push("/giris");
    router.refresh();
  };

  // ── MOBILE: yatay tab bar ──────────────────────────────────────────────────
  const mobileTablar = GRUPLAR.flatMap(g => g.maddeler);

  return (
    <>
      {/* MOBILE — yatay scroll tab bar */}
      <div className="lg:hidden flex gap-1 overflow-x-auto scrollbar-hide p-1 bg-gray-50 border border-gray-200 rounded-xl mb-2">
        {mobileTablar.map(({ key, label, icon: Icon }) => {
          const aktif = aktifTab === key;
          return (
            <Link
              key={key}
              href={`?tab=${key}`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0"
              style={{
                backgroundColor: aktif ? "rgba(15,61,46,0.08)" : "transparent",
                color:           aktif ? "var(--forest)"       : "#94a3b8",
              }}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              {label}
            </Link>
          );
        })}
      </div>

      {/* DESKTOP — dikey sidebar */}
      <div className="hidden lg:flex flex-col gap-0 card rounded-2xl overflow-hidden">
        {/* Kullanıcı kartı */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold text-white"
            style={{ backgroundColor: "var(--forest)" }}>
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
            <p className="text-[10px] text-gray-500 truncate">{altYazi}</p>
          </div>
        </div>

        {/* Menü grupları */}
        <div className="px-2 py-2 flex-1">
          {GRUPLAR.map(({ baslik, maddeler }) => (
            <div key={baslik} className="mb-1">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 px-3 mt-3 mb-1">{baslik}</p>
              {maddeler.map(({ key, label, icon: Icon }) => {
                const aktif = aktifTab === key;
                return (
                  <Link
                    key={key}
                    href={`?tab=${key}`}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all"
                    style={{
                      backgroundColor: aktif ? "rgba(15,61,46,0.08)" : "transparent",
                      color:           aktif ? "var(--forest)"        : "#374151",
                      fontWeight:      aktif ? 500 : 400,
                    }}
                  >
                    <Icon className="w-4 h-4 shrink-0" style={{ color: aktif ? "var(--forest)" : "#9ca3af" }} />
                    {label}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Alt kısım — Ayarlar + Çıkış */}
        <div className="px-2 py-2 border-t border-gray-100">
          <Link href="/ayarlar"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-all">
            <Settings className="w-4 h-4 text-gray-400 shrink-0" />
            Ayarlar
          </Link>
          <button onClick={handleCikis}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-all text-left">
            <LogOut className="w-4 h-4 text-gray-400 shrink-0" />
            Çıkış Yap
          </button>
        </div>
      </div>
    </>
  );
}
