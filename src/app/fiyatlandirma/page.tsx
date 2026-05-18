"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { aylikTutar, trialGunKaldi } from "@/store/sirket";

interface AbonelikBilgi {
  sirketAdi:      string;
  isPremium:      boolean;
  trialEndsAt:    Date | null;
  aktifCoPilot:   number;
}

export default function FiyatlandirmaPage() {
  const [bilgi,    setBilgi]    = useState<AbonelikBilgi | null>(null);
  const [yuklendi, setYuklendi] = useState(false);
  const [user,     setUser]     = useState<{ email: string } | null>(null);

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

      // Aktif co-pilot sayısı
      const { count } = await supabase
        .from("company_members")
        .select("id", { count: "exact", head: true })
        .eq("company_id", uyelik.company_id)
        .eq("role", "copilot")
        .eq("status", "active");

      setBilgi({
        sirketAdi:    company?.name ?? "",
        isPremium:    company?.is_premium ?? false,
        trialEndsAt:  company?.trial_ends_at ? new Date(company.trial_ends_at) : null,
        aktifCoPilot: count ?? 0,
      });
      setYuklendi(true);
    }
    yukle();
  }, []);

  const tutar        = bilgi ? aylikTutar(bilgi.aktifCoPilot) : 499;
  const gunKaldi     = bilgi ? trialGunKaldi(bilgi.trialEndsAt) : 0;
  const trialBitti   = bilgi && !bilgi.isPremium && gunKaldi === 0;
  const trialDevam   = bilgi && !bilgi.isPremium && gunKaldi > 0;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0e172a", color: "#ffffff" }}>

      {/* Navbar */}
      <header className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: "rgba(255,255,255,0.07)" }}>
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-black tracking-tight" style={{ color: "#fbc024" }}>
            Pilot<span style={{ color: "#ffffff" }}>Sensin</span>
          </span>
        </Link>
        {user
          ? <Link href="/dashboard" className="text-sm px-4 py-2 rounded-lg"
              style={{ background: "rgba(251,192,36,0.1)", color: "#fbc024", border: "1px solid rgba(251,192,36,0.25)" }}>
              Uygulamaya Dön
            </Link>
          : <Link href="/giris" className="text-sm px-4 py-2 rounded-lg"
              style={{ background: "rgba(255,255,255,0.05)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.1)" }}>
              Giriş Yap
            </Link>
        }
      </header>

      <main className="flex-1 flex flex-col items-center px-4 py-16 gap-12">

        {/* Başlık */}
        <div className="text-center max-w-xl">
          <h1 className="text-3xl font-bold mb-3">Fiyatlandırma</h1>
          <p style={{ color: "#64748b" }}>
            Tek plan, şeffaf fiyat. İlk 7 gün kredi kartı olmadan ücretsiz.
          </p>
        </div>

        {/* Mevcut durum kartı */}
        {yuklendi && bilgi && (
          <div className="w-full max-w-lg rounded-2xl p-6 space-y-3"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(251,192,36,0.2)" }}>
            <p className="text-xs uppercase tracking-widest" style={{ color: "#475569" }}>Mevcut Durum</p>
            <p className="font-semibold text-lg">{bilgi.sirketAdi}</p>
            <div className="flex items-center gap-2">
              {bilgi.isPremium ? (
                <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                  style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e" }}>Premium</span>
              ) : trialBitti ? (
                <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                  style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}>Deneme Süresi Doldu</span>
              ) : (
                <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                  style={{ background: "rgba(251,192,36,0.15)", color: "#fbc024" }}>
                  {gunKaldi} Gün Deneme Kaldı
                </span>
              )}
            </div>
          </div>
        )}

        {/* Fiyat kartı */}
        <div className="w-full max-w-lg rounded-2xl overflow-hidden"
          style={{ border: "1px solid rgba(251,192,36,0.35)" }}>

          {/* Başlık şerit */}
          <div className="px-8 pt-8 pb-6"
            style={{ background: "rgba(251,192,36,0.06)" }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "#fbc024" }}>İşletme Paketi</p>
                <h2 className="text-4xl font-black" style={{ color: "#fbc024" }}>
                  499 <span className="text-lg font-semibold" style={{ color: "#94a3b8" }}>TL/ay</span>
                </h2>
              </div>
              {trialDevam && (
                <span className="text-xs px-2.5 py-1 rounded-full font-semibold mt-1"
                  style={{ background: "rgba(251,192,36,0.15)", color: "#fbc024" }}>
                  7 Gün Ücretsiz
                </span>
              )}
            </div>
            <p className="text-sm mt-3" style={{ color: "#64748b" }}>
              İlk 3 çalışan (Co-Pilot) dahildir.
              Her ek Co-Pilot için aylık +100 TL.
            </p>
          </div>

          {/* Özellikler */}
          <div className="px-8 py-6 space-y-3" style={{ background: "rgba(255,255,255,0.02)" }}>
            {[
              "Nakit akışı ve işlem takibi",
              "KDV mahsuplaşma hesaplama",
              "Kâr-zarar analizi",
              "Stok ve hareket yönetimi",
              "Görev ve SOP kütüphanesi",
              "Acil durum fonu modülü",
              "Pilot / Co-Pilot rol kısıtlama",
              "Gerçek zamanlı bildirimler",
            ].map((f) => (
              <div key={f} className="flex items-center gap-3 text-sm" style={{ color: "#94a3b8" }}>
                <span style={{ color: "#fbc024", fontWeight: 700 }}>✓</span>
                {f}
              </div>
            ))}
          </div>

          {/* Hesaplayıcı */}
          {bilgi && (
            <div className="px-8 py-5" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.01)" }}>
              <p className="text-xs mb-3" style={{ color: "#475569" }}>Aylık tahmini tutarınız</p>
              <div className="flex items-center justify-between text-sm" style={{ color: "#64748b" }}>
                <span>Sabit paket</span><span>499 TL</span>
              </div>
              {bilgi.aktifCoPilot > 3 && (
                <div className="flex items-center justify-between text-sm mt-1" style={{ color: "#64748b" }}>
                  <span>{bilgi.aktifCoPilot - 3} ek Co-Pilot × 100 TL</span>
                  <span>+{(bilgi.aktifCoPilot - 3) * 100} TL</span>
                </div>
              )}
              <div className="flex items-center justify-between font-bold mt-3 pt-3"
                style={{ borderTop: "1px solid rgba(255,255,255,0.06)", color: "#fbc024" }}>
                <span>Toplam</span>
                <span>{tutar} TL/ay</span>
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="px-8 pb-8 pt-4">
            {!user ? (
              <Link href="/kayit"
                className="w-full block text-center py-3.5 rounded-xl font-bold text-base transition-all"
                style={{ background: "#fbc024", color: "#0e172a" }}>
                7 Gün Ücretsiz Başla
              </Link>
            ) : bilgi?.isPremium ? (
              <div className="w-full text-center py-3.5 rounded-xl font-semibold text-sm"
                style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}>
                Premium Aboneliğiniz Aktif
              </div>
            ) : (
              <a href="mailto:destek@pilotsensin.com?subject=Premium Abonelik Talebi"
                className="w-full block text-center py-3.5 rounded-xl font-bold text-base transition-all"
                style={{ background: "#fbc024", color: "#0e172a" }}>
                Pakete Geç — Destek ile İletişime Geç
              </a>
            )}
            <p className="text-center text-xs mt-3" style={{ color: "#334155" }}>
              Kredi kartı gerekmez · İstediğiniz zaman iptal
            </p>
          </div>
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
