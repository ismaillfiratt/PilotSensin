"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Copy, Check, Monitor } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { aktiviteKaydet } from "@/lib/aktiviteLog";
import { storesSifirla } from "@/lib/auth-temizlik";

// ── Tipler ────────────────────────────────────────────────────────────────────
type MfaDurum = "yukleniyor" | "idle" | "enrolling" | "verifying" | "active" | "kapatOnay" | "kapatiliyor";
interface Mesaj  { tip: "basari" | "hata" | "bilgi"; metin: string }
interface AktifFaktor { id: string; createdAt: string }
interface EnrolData   { factorId: string; qrSvg: string; secret: string }
interface OturumKaydi {
  session_id: string;
  created_at: string;
  updated_at: string;
  user_agent: string;
  ip:         string;
  is_current: boolean;
}

// ── Stil sabitleri ─────────────────────────────────────────────────────────────
const MESAJ_STIL: Record<Mesaj["tip"], { bg: string; color: string }> = {
  basari: { bg: "rgba(16,185,129,0.08)",  color: "#047857" },
  hata:   { bg: "rgba(201,118,118,0.08)", color: "#C97676" },
  bilgi:  { bg: "rgba(15,61,46,0.05)",    color: "#0F3D2E" },
};

const KART = "bg-white rounded-xl p-5 space-y-3";
const KART_STIL = { border: "0.5px solid rgba(0,0,0,0.08)" };

// ── Bileşen ────────────────────────────────────────────────────────────────────
export default function GuvenlikPanel() {
  const [durum,       setDurum]       = useState<MfaDurum>("yukleniyor");
  const [aktifFaktor, setAktifFaktor] = useState<AktifFaktor | null>(null);
  const [enrol,       setEnrol]       = useState<EnrolData | null>(null);
  const [kod,         setKod]         = useState("");
  const [mesaj,       setMesaj]       = useState<Mesaj | null>(null);
  const [kopyalandi,  setKopyalandi]  = useState(false);
  const kodRef = useRef<HTMLInputElement>(null);
  const mesajTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router      = useRouter();
  const [oturumlar,          setOturumlar]          = useState<OturumKaydi[]>([]);
  const [oturumYukl,         setOturumYukl]         = useState(true);
  const [oturumHata,         setOturumHata]         = useState<string | null>(null);
  const [tumCikisYukleniyor, setTumCikisYukleniyor] = useState(false);

  const gosterMesaj = (m: Mesaj, sureSn = 4) => {
    setMesaj(m);
    if (mesajTimer.current) clearTimeout(mesajTimer.current);
    if (m.tip !== "hata") mesajTimer.current = setTimeout(() => setMesaj(null), sureSn * 1000);
  };

  // ── Oturum yardımcıları ─────────────────────────────────────────────────────
  function parseUserAgent(ua: string | null): string {
    if (!ua) return "Bilinmeyen cihaz";
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

  async function yukleOturumlar() {
    setOturumYukl(true);
    setOturumHata(null);
    const { data, error } = await createClient().rpc("get_aktif_oturumlar");
    if (error) {
      setOturumHata("Oturumlar yüklenemedi: " + error.message);
    } else {
      setOturumlar((data as OturumKaydi[]) ?? []);
    }
    setOturumYukl(false);
  }

  const handleTekCikis = async (sessionId: string) => {
    await createClient().rpc("revoke_session", { session_id_param: sessionId });
    await yukleOturumlar();
  };

  const handleTumCikislar = async () => {
    if (!window.confirm("Tüm cihazlardan çıkış yapılacak. Şu anki tarayıcın dahil. Devam edilsin mi?")) return;
    setTumCikisYukleniyor(true);
    storesSifirla();
    const { error } = await createClient().auth.signOut({ scope: "global" });
    if (error) {
      gosterMesaj({ tip: "hata", metin: "Çıkış başarısız: " + error.message });
      setTumCikisYukleniyor(false);
      return;
    }
    window.location.href = "/giris";
  };

  // ── Faktörleri yükle ────────────────────────────────────────────────────────
  useEffect(() => {
    createClient().auth.mfa.listFactors().then(({ data, error }) => {
      if (error) { setDurum("idle"); return; }
      const dogrulandi = data?.totp?.find(f => f.status === "verified");
      if (dogrulandi) {
        setAktifFaktor({ id: dogrulandi.id, createdAt: dogrulandi.created_at });
        setDurum("active");
      } else {
        setDurum("idle");
      }
    });
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void yukleOturumlar(); }, []);

  // ── 2FA Kayıt Başlat ────────────────────────────────────────────────────────
  const handleAktifEt = async () => {
    setMesaj(null);
    setDurum("enrolling");

    const sb = createClient();

    // Tüm mevcut TOTP faktörleri temizle (unverified takılıları da dahil)
    const { data: liste } = await sb.auth.mfa.listFactors();
    for (const f of liste?.totp ?? []) {
      await sb.auth.mfa.unenroll({ factorId: f.id });
    }

    let enrollSonuc = await sb.auth.mfa.enroll({ factorType: "totp" });

    // "already exists" hatası gelirse: bir kez daha agresif temizlik + retry
    if (enrollSonuc.error?.message?.toLowerCase().includes("already exists")) {
      const { data: liste2 } = await sb.auth.mfa.listFactors();
      for (const f of liste2?.totp ?? []) {
        await sb.auth.mfa.unenroll({ factorId: f.id });
      }
      // Kısa bekleme — Supabase backend'in senkronize olması için
      await new Promise((r) => setTimeout(r, 600));
      enrollSonuc = await sb.auth.mfa.enroll({ factorType: "totp" });
    }

    const { data, error } = enrollSonuc;

    if (error) {
      let mesajMetni = "Bilinmeyen hata oluştu.";
      const msg = error.message?.toLowerCase() ?? "";
      if (msg.includes("not enabled") || msg.includes("mfa is not")) {
        mesajMetni = "2FA Supabase'de aktif değil. Dashboard'dan açılması gerekiyor.";
      } else if (msg.includes("limit") || msg.includes("max")) {
        mesajMetni = "Maksimum faktör sayısına ulaşıldı. Önce mevcut 2FA'yı kapat.";
      } else if (msg.includes("already exists")) {
        mesajMetni = "Önceki kayıt temizlenemedi. Sayfayı yenileyip tekrar dene.";
      } else if (error.message) {
        mesajMetni = error.message;
      }
      gosterMesaj({ tip: "hata", metin: mesajMetni }, 8);
      setDurum("idle");
      return;
    }

    if (!data || !data.totp?.qr_code) {
      gosterMesaj({ tip: "hata", metin: "QR kod alınamadı. Sayfayı yenileyip tekrar dene." }, 8);
      setDurum("idle");
      return;
    }

    setEnrol({ factorId: data.id, qrSvg: data.totp.qr_code, secret: data.totp.secret ?? "" });
    setKod("");
    setTimeout(() => kodRef.current?.focus(), 100);
    void aktiviteKaydet({ modul: "profil", eylem: "2fa-enroll-start", ozet: "İki faktörlü doğrulama kurulumunu başlattı" });
  };

  // ── Doğrula ve Aktif Et ─────────────────────────────────────────────────────
  const handleVerify = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!enrol || kod.length !== 6) return;
    setDurum("verifying");
    const sb = createClient();
    const { data: ch, error: chErr } = await sb.auth.mfa.challenge({ factorId: enrol.factorId });
    if (chErr || !ch) {
      gosterMesaj({ tip: "hata", metin: chErr?.message ?? "Challenge alınamadı." });
      setDurum("enrolling");
      return;
    }
    const { data, error } = await sb.auth.mfa.verify({ factorId: enrol.factorId, challengeId: ch.id, code: kod });
    if (error || !data) {
      gosterMesaj({ tip: "hata", metin: "Kod yanlış. Tekrar dene." });
      setKod("");
      setDurum("enrolling");
      setTimeout(() => kodRef.current?.focus(), 50);
      return;
    }
    // Başarılı
    const { data: liste } = await sb.auth.mfa.listFactors();
    const dogrulandi = liste?.totp?.find(f => f.status === "verified");
    setAktifFaktor(dogrulandi ? { id: dogrulandi.id, createdAt: dogrulandi.created_at } : { id: enrol.factorId, createdAt: new Date().toISOString() });
    setEnrol(null);
    setDurum("active");
    gosterMesaj({ tip: "basari", metin: "2FA aktif edildi ✓" }, 4);
    void aktiviteKaydet({ modul: "profil", eylem: "2fa-aktif", ozet: "İki faktörlü doğrulamayı aktif etti" });
  };

  // ── Kayıt İptal ─────────────────────────────────────────────────────────────
  const handleIptal = async () => {
    if (enrol) await createClient().auth.mfa.unenroll({ factorId: enrol.factorId });
    setEnrol(null); setKod(""); setMesaj(null); setDurum("idle");
  };

  // ── 2FA Kapat ───────────────────────────────────────────────────────────────
  const handleKapatOnayla = async () => {
    if (!aktifFaktor) return;
    setDurum("kapatiliyor");
    const { error } = await createClient().auth.mfa.unenroll({ factorId: aktifFaktor.id });
    if (error) {
      gosterMesaj({ tip: "hata", metin: error.message });
      setDurum("kapatOnay");
      return;
    }
    setAktifFaktor(null);
    setDurum("idle");
    gosterMesaj({ tip: "bilgi", metin: "2FA kapatıldı." }, 4);
    void aktiviteKaydet({ modul: "profil", eylem: "2fa-kapali", ozet: "İki faktörlü doğrulamayı kapattı" });
  };

  // ── Kopyala ─────────────────────────────────────────────────────────────────
  const kopyala = (metin: string) => {
    navigator.clipboard.writeText(metin);
    setKopyalandi(true);
    setTimeout(() => setKopyalandi(false), 2000);
  };

  const aktif        = durum === "active";
  const enrollAcik   = durum === "enrolling" || durum === "verifying";
  const dogrulaYukl  = durum === "verifying";
  const kapatiliyor  = durum === "kapatiliyor";
  const kapatOnay    = durum === "kapatOnay";

  return (
    <div className="space-y-4">
      {/* Başlık */}
      <div>
        <p className="label-caps">HESAP</p>
        <h2 className="text-xl font-medium text-gray-900 mt-1">Hesap Güvenliği</h2>
        <p className="text-sm text-gray-500 mt-1">Şifre, iki faktörlü doğrulama ve oturum yönetimi</p>
      </div>

      {/* Banner */}
      {mesaj && (
        <div className="px-3.5 py-2 rounded-lg text-xs font-medium"
          style={{ backgroundColor: MESAJ_STIL[mesaj.tip].bg, color: MESAJ_STIL[mesaj.tip].color }}>
          {mesaj.metin}
        </div>
      )}

      {/* ── KART 1 — Şifre ── */}
      <div className={KART} style={KART_STIL}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-800">Şifre</p>
            <p className="text-xs text-gray-400 mt-0.5">Hesabını korumak için güçlü bir şifre kullan</p>
          </div>
          <Link href="/ayarlar"
            className="shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            style={{ border: "0.5px solid rgba(0,0,0,0.12)" }}>
            Şifreyi değiştir →
          </Link>
        </div>
      </div>

      {/* ── KART 2 — 2FA ── */}
      <div className={KART} style={KART_STIL}>
        {/* Üst satır: durum + buton */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium text-gray-800">İki Faktörlü Doğrulama (2FA)</p>
              {durum === "yukleniyor" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
              ) : (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={aktif
                    ? { background: "rgba(16,185,129,0.12)", color: "#047857" }
                    : { background: "rgba(201,118,118,0.1)", color: "#C97676" }}>
                  {aktif ? "AÇIK ✓" : "KAPALI"}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Authenticator uygulamasıyla hesabını ek bir güvenlik katmanıyla koru
            </p>
            {aktif && aktifFaktor && (
              <p className="text-[11px] text-gray-400 mt-1">
                TOTP · {new Date(aktifFaktor.createdAt).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" })}'den beri aktif
              </p>
            )}
          </div>

          {durum !== "yukleniyor" && (
            aktif ? (
              <button onClick={() => setDurum("kapatOnay")} disabled={kapatiliyor}
                className="shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                style={{ background: "rgba(201,118,118,0.1)", color: "#C97676", border: "0.5px solid #C97676" }}>
                2FA'yı kapat
              </button>
            ) : (
              !enrollAcik && (
                <button onClick={handleAktifEt}
                  className="shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-medium text-white transition-all hover:opacity-90"
                  style={{ backgroundColor: "var(--forest)" }}>
                  2FA'yı aktif et
                </button>
              )
            )
          )}
        </div>

        {/* Kapatma onayı */}
        {kapatOnay && (
          <div className="rounded-lg p-4 space-y-3"
            style={{ background: "rgba(201,118,118,0.06)", border: "0.5px solid rgba(201,118,118,0.25)" }}>
            <p className="text-sm text-gray-700">
              2FA'yı kapatmak hesabını daha az güvenli yapar. Devam etmek istiyor musun?
            </p>
            <div className="flex items-center gap-2">
              <button onClick={handleKapatOnayla} disabled={kapatiliyor}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium text-white transition-all disabled:opacity-50"
                style={{ backgroundColor: "#C97676" }}>
                {kapatiliyor && <Loader2 className="w-3 h-3 animate-spin" />}
                {kapatiliyor ? "Kapatılıyor..." : "Evet, kapat"}
              </button>
              <button onClick={() => setDurum("active")}
                className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
                İptal
              </button>
            </div>
          </div>
        )}

        {/* Kayıt akışı */}
        {enrollAcik && enrol && (
          <form onSubmit={handleVerify} className="space-y-4 pt-1">
            <div className="h-px bg-gray-100" />

            {/* QR Kod */}
            <div>
              <p className="text-sm font-medium text-gray-800 mb-3">
                1. Authenticator uygulamasıyla QR kodu tara
              </p>
              <div className="flex flex-col items-center gap-2">
                <div className="rounded-xl p-4" style={{ background: "#FFFFFF", border: "0.5px solid rgba(0,0,0,0.1)" }}>
                  {enrol.qrSvg ? (
                    <img
                      src={enrol.qrSvg}
                      alt="2FA QR Kodu"
                      width={180}
                      height={180}
                      style={{ display: "block", width: 180, height: 180 }}
                    />
                  ) : (
                    <div
                      style={{ width: 180, height: 180 }}
                      className="flex items-center justify-center text-xs text-gray-400 text-center"
                    >
                      QR kod yüklenemedi.<br />Manuel kodu kullan ↓
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-gray-400 text-center">
                  Önerilen uygulamalar:
                  <span className="font-medium text-gray-600"> Google Authenticator</span> ·
                  <span className="font-medium text-gray-600"> Authy</span> ·
                  <span className="font-medium text-gray-600"> 1Password</span>
                </p>
              </div>
            </div>

            {/* Secret */}
            <div>
              <p className="text-xs text-gray-400 mb-1.5">Veya manuel kod gir:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 rounded-md text-[11px] font-mono text-gray-700 tracking-widest break-all"
                  style={{ background: "rgba(0,0,0,0.03)", border: "0.5px solid rgba(0,0,0,0.08)" }}>
                  {enrol.secret}
                </code>
                <button type="button" onClick={() => kopyala(enrol.secret)}
                  className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 transition-colors"
                  style={{ border: "0.5px solid rgba(0,0,0,0.1)" }}>
                  {kopyalandi ? <Check className="w-3.5 h-3.5 text-[#047857]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Kod input */}
            <div>
              <p className="text-sm font-medium text-gray-800 mb-2">2. Uygulamadaki 6 haneli kodu gir:</p>
              <input
                ref={kodRef}
                type="text" inputMode="numeric" maxLength={6}
                value={kod}
                onChange={e => setKod(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="123456"
                className="w-full text-center text-2xl font-mono rounded-xl focus:outline-none transition-colors"
                style={{
                  padding: "14px 12px",
                  letterSpacing: "0.4em",
                  border: "0.5px solid rgba(0,0,0,0.12)",
                }}
                onFocus={e => (e.target.style.borderColor = "var(--forest)")}
                onBlur={e  => (e.target.style.borderColor = "rgba(0,0,0,0.12)")}
              />
            </div>

            {/* Butonlar */}
            <div className="flex items-center gap-3">
              <button type="submit"
                disabled={kod.length !== 6 || dogrulaYukl}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                style={{ backgroundColor: "var(--forest)" }}>
                {dogrulaYukl && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {dogrulaYukl ? "Doğrulanıyor..." : "Doğrula ve aktif et"}
              </button>
              <button type="button" onClick={handleIptal}
                className="text-sm text-gray-400 hover:text-gray-700 transition-colors shrink-0">
                İptal
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ── KART 3 — Aktif Oturumlar ── */}
      <div className={KART} style={KART_STIL}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-gray-800">Aktif Oturumlar</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Hesabına giriş yapan cihazlar — şüpheli görürsen tüm çıkışları başlat
            </p>
          </div>
          {!oturumYukl && oturumlar.length > 1 && (
            <button
              onClick={handleTumCikislar}
              disabled={tumCikisYukleniyor}
              className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
              style={{ background: "rgba(201,118,118,0.08)", color: "#C97676", border: "0.5px solid rgba(201,118,118,0.3)" }}>
              {tumCikisYukleniyor ? "Çıkış yapılıyor..." : "Tüm cihazlardan çıkış"}
            </button>
          )}
        </div>

        {oturumYukl && (
          <div className="py-5 flex items-center justify-center gap-2 text-xs text-gray-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />Oturumlar yükleniyor...
          </div>
        )}

        {!oturumYukl && oturumHata && (
          <div className="px-3 py-2 rounded-lg text-xs"
            style={{ background: "rgba(201,118,118,0.08)", color: "#C97676" }}>
            {oturumHata}
          </div>
        )}

        {!oturumYukl && !oturumHata && oturumlar.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-4">Aktif oturum bulunamadı.</p>
        )}

        {!oturumYukl && !oturumHata && oturumlar.length > 0 && (
          <div className="space-y-2">
            {oturumlar.map((s) => {
              const ms      = Date.now() - new Date(s.updated_at).getTime();
              const dakika  = Math.floor(ms / 60_000);
              const saat    = Math.floor(ms / 3_600_000);
              const gun     = Math.floor(ms / 86_400_000);
              const zamanMt = dakika < 1 ? "Az önce" : dakika < 60 ? `${dakika}dk önce` : saat < 24 ? `${saat}sa önce` : `${gun}g önce`;
              return (
                <div key={s.session_id}
                  className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5"
                  style={{
                    background: s.is_current ? "rgba(15,61,46,0.04)" : "transparent",
                    border: "0.5px solid rgba(0,0,0,0.06)",
                  }}>
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <Monitor className="w-3.5 h-3.5 shrink-0 mt-0.5"
                      style={{ color: s.is_current ? "#047857" : "#94a3b8" }} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-xs font-medium text-gray-800 truncate">
                          {parseUserAgent(s.user_agent)}
                        </p>
                        {s.is_current && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
                            style={{ background: "rgba(16,185,129,0.12)", color: "#047857" }}>
                            BU OTURUM
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        IP: {s.ip} · Son aktiflik: {zamanMt}
                      </p>
                    </div>
                  </div>
                  {!s.is_current && (
                    <button onClick={() => handleTekCikis(s.session_id)}
                      className="shrink-0 text-xs text-gray-400 hover:text-red-500 transition-colors whitespace-nowrap"
                      style={{ border: "0.5px solid rgba(0,0,0,0.1)", padding: "3px 10px", borderRadius: 6 }}>
                      Çıkış
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!oturumYukl && oturumlar.length <= 1 && (
          <div className="pt-2" style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
            <button onClick={handleTumCikislar} disabled={tumCikisYukleniyor}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50">
              {tumCikisYukleniyor ? "Çıkış yapılıyor..." : "Tüm cihazlardan çıkış yap →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
