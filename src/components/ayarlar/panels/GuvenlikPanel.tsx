"use client";

import { useState, useEffect } from "react";
import { useRouter }           from "next/navigation";
import { ArrowUpRight, Loader2, Monitor } from "lucide-react";
import { createClient }        from "@/utils/supabase/client";
import { storesSifirla }       from "@/lib/auth-temizlik";

const KART      = "bg-white rounded-xl p-5";
const KART_STIL = { border: "0.5px solid rgba(0,0,0,0.08)" };

interface OturumKaydi {
  session_id: string;
  updated_at: string;
  user_agent: string;
  ip:         string;
  is_current: boolean;
}

function parseUserAgent(ua: string): string {
  let browser = "Bilinmeyen";
  let os      = "Bilinmeyen";
  if      (ua.includes("Edg"))     browser = "Edge";
  else if (ua.includes("Chrome"))  browser = "Chrome";
  else if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Safari"))  browser = "Safari";
  if      (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac"))     os = "macOS";
  else if (ua.includes("Linux"))   os = "Linux";
  return `${browser} · ${os}`;
}

function relativeTarih(isoStr: string): string {
  const ms   = Date.now() - new Date(isoStr).getTime();
  const dk   = Math.floor(ms / 60_000);
  const saat = Math.floor(dk / 60);
  const gun  = Math.floor(saat / 24);
  if (dk < 1)    return "Az önce";
  if (dk < 60)   return `${dk} dk önce`;
  if (saat < 24) return `${saat} saat önce`;
  if (gun < 7)   return `${gun} gün önce`;
  return new Date(isoStr).toLocaleDateString("tr-TR");
}

export default function GuvenlikPanel() {
  const router = useRouter();

  const [mfaAktif,         setMfaAktif]         = useState<boolean | null>(null);
  const [sonGiris,         setSonGiris]          = useState<string | null>(null);
  const [oturumlar,        setOturumlar]         = useState<OturumKaydi[]>([]);
  const [oturumYukl,       setOturumYukl]        = useState(true);
  const [oturumHata,       setOturumHata]        = useState<string | null>(null);
  const [tumCikisYukl,     setTumCikisYukl]      = useState(false);

  useEffect(() => {
    const sb = createClient();

    sb.auth.mfa.listFactors().then(({ data }) => {
      setMfaAktif(data?.totp?.some((f) => f.status === "verified") ?? false);
    });

    sb.auth.getUser().then(({ data }) => {
      setSonGiris(data.user?.last_sign_in_at ?? null);
    });

    // Aktif oturumları çek
    (async () => {
      const { data, error } = await sb.rpc("get_aktif_oturumlar");
      if (error) setOturumHata(error.message);
      else setOturumlar((data as OturumKaydi[]) ?? []);
      setOturumYukl(false);
    })();
  }, []);

  const handleTumCikis = async () => {
    if (!window.confirm("Tüm cihazlardan çıkış yapılacak. Şu anki tarayıcın dahil. Devam edilsin mi?")) return;
    setTumCikisYukl(true);
    storesSifirla();
    const { error } = await createClient().auth.signOut({ scope: "global" });
    if (error) { alert("Çıkış başarısız: " + error.message); setTumCikisYukl(false); return; }
    window.location.href = "/giris";
  };

  return (
    <div className="space-y-4">

      {/* Panel başlık */}
      <div>
        <p className="label-caps">HESAP & GÜVENLİK</p>
        <h2 className="text-xl font-medium text-gray-900 mt-1">Güvenlik Özeti</h2>
        <p className="text-sm text-gray-500 mt-1">2FA durumu, son giriş ve oturum yönetimi</p>
      </div>

      {/* ── KART 1 — 2FA Durumu ── */}
      <div className={KART + " flex items-center justify-between gap-4"} style={KART_STIL}>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-gray-800">İki Faktörlü Doğrulama</p>
            {mfaAktif === null ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">kontrol ediliyor...</span>
            ) : mfaAktif ? (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: "rgba(16,185,129,0.12)", color: "#047857" }}>AÇIK ✓</span>
            ) : (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: "rgba(180,83,9,0.1)", color: "#B45309" }}>KAPALI</span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">Authenticator uygulamasıyla ek güvenlik katmanı</p>
        </div>
        <button onClick={() => router.push("/profil?tab=guvenlik")}
          className="shrink-0 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
          style={{ background: "#fff", border: "0.5px solid rgba(0,0,0,0.15)" }}>
          Yönet →
        </button>
      </div>

      {/* ── KART 2 — Son Giriş ── */}
      <div className={KART} style={KART_STIL}>
        <p className="text-sm font-medium text-gray-800 mb-1">Son Giriş</p>
        {sonGiris ? (
          <>
            <p className="text-base font-medium text-gray-700">{relativeTarih(sonGiris)}</p>
            <p className="text-xs text-gray-400 mt-0.5">{new Date(sonGiris).toLocaleString("tr-TR")}</p>
          </>
        ) : (
          <p className="text-sm text-gray-400">—</p>
        )}
      </div>

      {/* ── KART 3 — Aktif Oturumlar ── */}
      <div className={KART + " space-y-3"} style={KART_STIL}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-gray-800">Aktif Oturumlar</p>
            <p className="text-xs text-gray-400 mt-0.5">Hesabına giriş yapan cihazlar</p>
          </div>
          {!oturumYukl && oturumlar.length > 0 && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: "rgba(16,185,129,0.1)", color: "#047857" }}>
              {oturumlar.length} aktif
            </span>
          )}
        </div>

        {oturumYukl && (
          <div className="py-4 flex items-center justify-center gap-2 text-xs text-gray-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />Yükleniyor...
          </div>
        )}

        {!oturumYukl && oturumHata && (
          <p className="text-xs text-center py-2" style={{ color: "#C97676" }}>
            Oturumlar yüklenemedi
          </p>
        )}

        {!oturumYukl && !oturumHata && oturumlar.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-3">Aktif oturum bulunamadı.</p>
        )}

        {!oturumYukl && !oturumHata && oturumlar.length > 0 && (
          <div className="space-y-1.5">
            {oturumlar.map((s) => (
              <div key={s.session_id}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg"
                style={{
                  background: s.is_current ? "rgba(15,61,46,0.04)" : "rgba(0,0,0,0.02)",
                  border: "0.5px solid rgba(0,0,0,0.06)",
                }}>
                <Monitor className="w-3.5 h-3.5 shrink-0"
                  style={{ color: s.is_current ? "#047857" : "#94a3b8" }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-medium text-gray-700 truncate">
                      {parseUserAgent(s.user_agent)}
                    </p>
                    {s.is_current && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
                        style={{ background: "rgba(16,185,129,0.12)", color: "#047857" }}>
                        BU OTURUM
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    IP: {s.ip} · {relativeTarih(s.updated_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── KART 4 — Hesap Aksiyonları ── */}
      <div className={KART + " space-y-1"} style={KART_STIL}>
        <p className="text-sm font-medium text-gray-800 mb-3">Diğer güvenlik ayarları</p>

        <button onClick={handleTumCikis} disabled={tumCikisYukl}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50">
          <span>{tumCikisYukl ? "Çıkış yapılıyor..." : "Tüm cihazlardan çıkış yap"}</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        </button>

        <button onClick={() => router.push("/ayarlar?tab=tehlike")}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all hover:bg-[rgba(201,118,118,0.06)]"
          style={{ color: "#C97676" }}>
          <span>Hesabı sil</span>
          <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
        </button>
      </div>

    </div>
  );
}
