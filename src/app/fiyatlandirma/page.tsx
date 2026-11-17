"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { trialGunKaldi } from "@/store/sirket";
import { PRICING } from "@/lib/pricing";

type Donem = "aylik" | "yillik";

interface AbonelikBilgi {
  sirketAdi:   string;
  isPremium:   boolean;
  trialEndsAt: Date | null;
}

export default function FiyatlandirmaPage() {
  const [bilgi,     setBilgi]     = useState<AbonelikBilgi | null>(null);
  const [yuklendi,  setYuklendi]  = useState(false);
  const [user,      setUser]      = useState<{ email: string } | null>(null);
  const [donem,     setDonem]     = useState<Donem>("yillik");

  useEffect(() => {
    async function yukle() {
      const supabase = createClient();
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) { setYuklendi(true); return; }
      setUser({ email: u.email ?? "" });

      const { data: uyelik } = await supabase
        .from("company_members")
        .select("company_id, companies(name, is_premium, trial_ends_at)")
        .eq("user_id", u.id)
        .eq("status", "active")
        .maybeSingle();

      if (!uyelik) { setYuklendi(true); return; }

      const company = uyelik.companies as unknown as {
        name: string; is_premium: boolean; trial_ends_at: string | null;
      } | null;

      setBilgi({
        sirketAdi:   company?.name ?? "",
        isPremium:   company?.is_premium ?? false,
        trialEndsAt: company?.trial_ends_at ? new Date(company.trial_ends_at) : null,
      });
      setYuklendi(true);
    }
    yukle();
  }, []);

  const gunKaldi   = bilgi ? trialGunKaldi(bilgi.trialEndsAt) : 0;
  const trialBitti = bilgi && !bilgi.isPremium && gunKaldi === 0;
  const trialDevam = bilgi && !bilgi.isPremium && gunKaldi > 0;
  const aylikFiyat = donem === "aylik" ? 299 : 249;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--forest)", color: "#ffffff" }}>

      {/* Navbar */}
      <header
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: "rgba(255,255,255,0.07)" }}
      >
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-black tracking-tight" style={{ color: "var(--leaf)" }}>
            Pilot<span style={{ color: "#ffffff" }}>Sensin</span>
          </span>
        </Link>
        {user
          ? <Link href="/dashboard" className="text-sm px-4 py-2 rounded-lg"
              style={{ background: "var(--mint)", color: "var(--leaf)", border: "1px solid var(--forest-200, #B3E8C8)" }}>
              Uygulamaya Dön
            </Link>
          : <Link href="/giris" className="text-sm px-4 py-2 rounded-lg"
              style={{ background: "rgba(255,255,255,0.05)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.1)" }}>
              Giriş Yap
            </Link>
        }
      </header>

      <main className="flex-1 flex flex-col items-center px-4 py-16 gap-10">

        {/* Başlık */}
        <div className="text-center max-w-xl">
          <h1 className="font-bold mb-3" style={{ fontSize: 40 }}>Şeffaf fiyat, gizli ücret yok.</h1>
          <p style={{ color: "#94a3b8" }}>Tek paket, tüm özellikler. 7 gün ücretsiz dene.</p>
        </div>

        {/* Mevcut durum kartı */}
        {yuklendi && bilgi && (
          <div
            className="w-full max-w-lg rounded-2xl p-5 space-y-2"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <p className="text-xs uppercase tracking-widest" style={{ color: "#64748b" }}>Mevcut Durum</p>
            <p className="font-semibold text-lg">{bilgi.sirketAdi}</p>
            <div className="flex items-center gap-2">
              {bilgi.isPremium ? (
                <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                  style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e" }}>
                  Aktif Abonelik
                </span>
              ) : trialBitti ? (
                <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                  style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}>
                  Deneme Süresi Doldu
                </span>
              ) : trialDevam ? (
                <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                  style={{ background: "var(--mint)", color: "var(--leaf)" }}>
                  {gunKaldi} Gün Deneme Kaldı
                </span>
              ) : null}
            </div>
          </div>
        )}

        {/* Toggle */}
        <div
          className="inline-flex gap-1"
          style={{ padding: 4, background: "rgba(255,255,255,0.06)", borderRadius: 999, border: "0.5px solid rgba(255,255,255,0.1)" }}
        >
          {(["aylik", "yillik"] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDonem(d)}
              style={{
                padding: "6px 18px", fontSize: 13, fontWeight: 500, borderRadius: 999,
                border: "none", cursor: "pointer",
                background: donem === d ? "#ffffff" : "transparent",
                color: donem === d ? "#1F5C44" : "#94a3b8",
                WebkitTextFillColor: donem === d ? "#1F5C44" : "#94a3b8",
                transition: "all 0.15s",
              }}
            >
              {d === "aylik" ? "Aylık" : "Yıllık · 2 ay bedava"}
            </button>
          ))}
        </div>

        {/* Tek fiyat kartı */}
        <div
          className="w-full max-w-lg rounded-2xl relative"
          style={{ background: "#ffffff", border: "2px solid rgba(255,255,255,0.3)", padding: 32 }}
        >
          <div
            className="absolute"
            style={{
              top: -11, left: "50%", transform: "translateX(-50%)",
              background: "#1F5C44", color: "#ffffff",
              fontSize: 10, fontWeight: 600, padding: "4px 14px",
              borderRadius: 999, whiteSpace: "nowrap",
            }}
          >
            EN POPÜLER
          </div>

          <p style={{ fontSize: 12, fontWeight: 600, color: "#1F5C44", letterSpacing: "0.04em", marginBottom: 4 }}>
            {PRICING.packageName.toUpperCase()}
          </p>
          <p style={{ fontSize: 13, color: "#525252", marginBottom: 16 }}>İşletmen için tam paket</p>

          {/* Fiyat */}
          <div style={{ marginBottom: 20 }}>
            <div className="flex items-baseline gap-1">
              <span style={{ fontSize: 48, fontWeight: 700, color: "#0a0a0a", lineHeight: 1 }}>₺{aylikFiyat}</span>
              <span style={{ fontSize: 15, color: "#737373" }}>/ay</span>
            </div>
            {donem === "yillik" && (
              <p style={{ fontSize: 12, color: "#1F5C44", marginTop: 5 }}>
                ₺2.990 yıllık ödenir · 2 ay bedava
              </p>
            )}
          </div>

          {/* CTA */}
          {!user ? (
            <Link
              href="/kayit"
              style={{
                display: "block", textAlign: "center", width: "100%",
                padding: "14px 0", background: "#1F5C44",
                color: "#ffffff", WebkitTextFillColor: "#ffffff",
                fontWeight: 700, borderRadius: 10, fontSize: 15,
                textDecoration: "none", marginBottom: 24,
              }}
            >
              7 Gün Ücretsiz Başla
            </Link>
          ) : bilgi?.isPremium ? (
            <div
              style={{
                display: "block", textAlign: "center", width: "100%",
                padding: "14px 0", background: "rgba(34,197,94,0.1)",
                color: "#22c55e", fontWeight: 600, borderRadius: 10,
                fontSize: 14, border: "1px solid rgba(34,197,94,0.2)",
                marginBottom: 24,
              }}
            >
              Aboneliğiniz Aktif
            </div>
          ) : (
            <a
              href="mailto:destek@pilotsensin.com?subject=Abonelik Talebi"
              style={{
                display: "block", textAlign: "center", width: "100%",
                padding: "14px 0", background: "#1F5C44",
                color: "#ffffff", WebkitTextFillColor: "#ffffff",
                fontWeight: 700, borderRadius: 10, fontSize: 15,
                textDecoration: "none", marginBottom: 24,
              }}
            >
              Pakete Geç
            </a>
          )}

          {/* Özellikler */}
          <ul className="flex flex-col" style={{ gap: 10, listStyle: "none", padding: 0, margin: 0 }}>
            {PRICING.features.map((f) => (
              <li key={f} className="flex items-start gap-2.5">
                <Check style={{ width: 14, height: 14, color: "#1F5C44", flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: 13, color: "#1a1a1a" }}>{f}</span>
              </li>
            ))}
          </ul>

          <p className="text-center" style={{ fontSize: 11, color: "#737373", marginTop: 20 }}>
            Kredi kartı gerekmez · İstediğin zaman iptal
          </p>
        </div>

        {/* SSS */}
        <div className="w-full max-w-lg space-y-3">
          <p className="text-sm font-semibold" style={{ color: "#94a3b8" }}>Sıkça sorulan sorular</p>
          {[
            { s: "Bu bir muhasebe programı mı?", c: "Hayır. PilotSensin bir erken uyarı sistemi. Mali müşavirinizin yerini almaz, ona düzenli sinyaller göndererek işini kolaylaştırır." },
            { s: "İstediğim zaman iptal edebilir miyim?", c: "Evet, aboneliği aylık iptal edebilirsin. Taahhüt yok." },
            { s: "Ekibimi nasıl eklerim?", c: "Ayarlar > Ekip Yönetimi > Üye Davet Et. E-mail ile davet gönderirsin, üye tıklayıp kayıt olur." },
            { s: "Pilot Skoru nasıl hesaplanır?", c: "9 modülün verisinden ağırlıklı ortalama. Nakit Akışı %30, Kar-Zarar %20, Stok %15 ve diğer modüller." },
          ].map(({ s, c }) => (
            <div key={s} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "14px 16px" }}>
              <p className="text-sm font-medium" style={{ color: "#e2e8f0", marginBottom: 4 }}>{s}</p>
              <p className="text-xs" style={{ color: "#64748b", lineHeight: 1.6 }}>{c}</p>
            </div>
          ))}
        </div>

      </main>

      <footer className="text-center py-6 text-xs" style={{ color: "#334155" }}>
        © {new Date().getFullYear()} PilotSensin ·{" "}
        <Link href="/politikalar/gizlilik" className="hover:text-slate-400">Gizlilik</Link>
        {" · "}
        <Link href="/politikalar/kullanim-kosullari" className="hover:text-slate-400">Kullanım Koşulları</Link>
      </footer>
    </div>
  );
}
