"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { aktiviteKaydet } from "@/lib/aktiviteLog";
import { useSirket } from "@/store/sirket";

interface Mesaj { tip: "basari" | "hata" | "bilgi"; metin: string }

const MESAJ_STIL: Record<Mesaj["tip"], { bg: string; color: string }> = {
  basari: { bg: "rgba(16,185,129,0.08)",  color: "#047857" },
  hata:   { bg: "rgba(201,118,118,0.08)", color: "#C97676" },
  bilgi:  { bg: "rgba(15,61,46,0.05)",    color: "#0F3D2E" },
};

function initials(adSoyad: string, email: string) {
  const parts = adSoyad.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return email.slice(0, 2).toUpperCase();
}

export default function KisiselPanel() {
  const router = useRouter();
  const { companyId, rol } = useSirket();
  const isPilot = rol === "pilot";

  const [ad,       setAd]       = useState("");
  const [soyad,    setSoyad]    = useState("");
  const [telefon,  setTelefon]  = useState("");
  const [email,    setEmail]    = useState("");
  const [onaylandi, setOnaylandi] = useState(false);

  const origRef = useRef({ ad: "", soyad: "", telefon: "" });

  const [yukleniyor,       setYukleniyor]       = useState(false);
  const [mesaj,            setMesaj]            = useState<Mesaj | null>(null);
  const [emailAcik,        setEmailAcik]        = useState(false);
  const [yeniEmail,        setYeniEmail]        = useState("");
  const [emailYukleniyor,  setEmailYukleniyor]  = useState(false);

  const [logoUrl,          setLogoUrl]          = useState<string | null>(null);
  const [logoYukleniyor,   setLogoYukleniyor]   = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mesajRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gosterMesaj = (m: Mesaj, sureSn = 4) => {
    setMesaj(m);
    if (mesajRef.current) clearTimeout(mesajRef.current);
    if (m.tip !== "hata") {
      mesajRef.current = setTimeout(() => setMesaj(null), sureSn * 1000);
    }
  };

  // ── Kullanıcıyı yükle ──────────────────────────────────────────────────────
  useEffect(() => {
    const sb = createClient();
    sb.auth.getUser().then(({ data, error }) => {
      if (error || !data.user) {
        gosterMesaj({ tip: "hata", metin: "Oturum süresi dolmuş, yönlendiriliyorsunuz..." });
        setTimeout(() => router.push("/giris"), 2000);
        return;
      }
      const u  = data.user;
      const m  = u.user_metadata ?? {};
      const fn = (m.full_name ?? "") as string;
      const parts = fn.trim().split(/\s+/).filter(Boolean);
      const adVal    = parts[0]   ?? "";
      const soyadVal = parts.slice(1).join(" ");
      const telVal   = (u.phone ?? m.phone ?? "") as string;

      setAd(adVal); setSoyad(soyadVal); setTelefon(telVal);
      setEmail(u.email ?? "");
      setOnaylandi(!!u.email_confirmed_at);
      origRef.current = { ad: adVal, soyad: soyadVal, telefon: telVal };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Şirket logosunu yükle ─────────────────────────────────────────────────
  useEffect(() => {
    if (!companyId) return;
    createClient()
      .from("companies").select("logo_url").eq("id", companyId).single()
      .then(({ data }) => { if (data) setLogoUrl((data.logo_url as string) ?? null); });
  }, [companyId]);

  // ── Dirty / disabled kontrol ───────────────────────────────────────────────
  const dolu    = ad.trim() !== "" && soyad.trim() !== "";
  const degisti = ad !== origRef.current.ad
               || soyad !== origRef.current.soyad
               || telefon !== origRef.current.telefon;
  const kaydetDisabled = !dolu || !degisti || yukleniyor;

  // ── Logo yükle ────────────────────────────────────────────────────────────
  const handleLogoYukle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !companyId) return;
    if (!isPilot) { gosterMesaj({ tip: "hata", metin: "Sadece Pilot logo değiştirebilir." }); return; }
    if (file.size > 2 * 1024 * 1024) { gosterMesaj({ tip: "hata", metin: "Dosya 2 MB'tan büyük olamaz." }); return; }
    if (!["image/png", "image/jpeg", "image/jpg", "image/svg+xml"].includes(file.type)) {
      gosterMesaj({ tip: "hata", metin: "Sadece PNG, JPG veya SVG kabul edilir." }); return;
    }
    setLogoYukleniyor(true);
    const sb  = createClient();
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
    const filePath = `${companyId}/${Date.now()}.${ext}`;
    if (logoUrl) {
      try {
        const oldPath = new URL(logoUrl).pathname.split("/company-logos/")[1];
        if (oldPath) await sb.storage.from("company-logos").remove([oldPath]);
      } catch { /* URL parse hatası — atla */ }
    }
    const { error: uploadErr } = await sb.storage
      .from("company-logos").upload(filePath, file, { contentType: file.type, upsert: false });
    if (uploadErr) { gosterMesaj({ tip: "hata", metin: "Yükleme başarısız: " + uploadErr.message }); setLogoYukleniyor(false); return; }
    const { data: { publicUrl } } = sb.storage.from("company-logos").getPublicUrl(filePath);
    const { error: updateErr } = await sb.from("companies").update({ logo_url: publicUrl }).eq("id", companyId);
    if (updateErr) { gosterMesaj({ tip: "hata", metin: "Logo bağlanamadı: " + updateErr.message }); setLogoYukleniyor(false); return; }
    setLogoUrl(publicUrl);
    setLogoYukleniyor(false);
    gosterMesaj({ tip: "basari", metin: "Profil fotoğrafı güncellendi ✓" }, 3);
    void aktiviteKaydet({ modul: "profil", eylem: "logo-guncelle", ozet: "Profil fotoğrafını güncelledi" });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleLogoKaldir = async () => {
    if (!logoUrl || !companyId) return;
    if (!window.confirm("Fotoğrafı kaldırmak istediğinden emin misin?")) return;
    setLogoYukleniyor(true);
    const sb = createClient();
    try {
      const oldPath = new URL(logoUrl).pathname.split("/company-logos/")[1];
      if (oldPath) await sb.storage.from("company-logos").remove([oldPath]);
    } catch { /* URL parse hatası — atla */ }
    await sb.from("companies").update({ logo_url: null }).eq("id", companyId);
    setLogoUrl(null);
    setLogoYukleniyor(false);
    gosterMesaj({ tip: "basari", metin: "Fotoğraf kaldırıldı" }, 3);
  };

  // ── Kaydet ────────────────────────────────────────────────────────────────
  const handleKaydet = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (kaydetDisabled) return;
    setYukleniyor(true);
    const { error } = await createClient().auth.updateUser({
      data: {
        full_name: `${ad.trim()} ${soyad.trim()}`.trim(),
        phone:     telefon.trim() || null,
      },
    });
    setYukleniyor(false);
    if (error) {
      gosterMesaj({ tip: "hata", metin: `Güncellenemedi: ${error.message}` });
    } else {
      origRef.current = { ad: ad.trim(), soyad: soyad.trim(), telefon: telefon.trim() };
      gosterMesaj({ tip: "basari", metin: "Bilgiler güncellendi" }, 3);
      void aktiviteKaydet({ modul: "profil", eylem: "guncelle", ozet: "Kişisel bilgilerini güncelledi" });
    }
  };

  // ── Email değiştir ─────────────────────────────────────────────────────────
  const handleEmailDegistir = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!yeniEmail.trim()) return;
    setEmailYukleniyor(true);
    const { error } = await createClient().auth.updateUser({ email: yeniEmail.trim() });
    setEmailYukleniyor(false);
    if (error) {
      gosterMesaj({ tip: "hata", metin: `Güncellenemedi: ${error.message}` });
    } else {
      setEmailAcik(false);
      setYeniEmail("");
      gosterMesaj({ tip: "bilgi", metin: `Onay linki ${yeniEmail.trim()} adresine gönderildi. Onaylamadan email değişmez.` }, 8);
    }
  };

  const inputCls = "w-full px-3 py-2 rounded-lg text-[13px] text-gray-800 placeholder-gray-400 focus:outline-none transition-colors"
    + " border focus:border-[var(--forest)]";
  const labelCls = "block text-[11px] text-gray-500 mb-1";

  const fullName = `${ad.trim()} ${soyad.trim()}`.trim();

  return (
    <div className="space-y-4">
      {/* Başlık */}
      <div>
        <p className="label-caps">HESAP</p>
        <h2 className="text-xl font-medium text-gray-900 mt-1">Kişisel Bilgiler</h2>
        <p className="text-sm text-gray-500 mt-1">
          Hesabınla ilgili temel bilgiler. Email değiştirme onay gerektirir.
        </p>
      </div>

      {/* Banner */}
      {mesaj && (
        <div className="px-3.5 py-2 rounded-lg text-xs font-medium"
          style={{ backgroundColor: MESAJ_STIL[mesaj.tip].bg, color: MESAJ_STIL[mesaj.tip].color }}>
          {mesaj.metin}
        </div>
      )}

      {/* Profil fotoğrafı */}
      <div className="bg-white rounded-xl p-5 flex items-center gap-4" style={{ border: "0.5px solid rgba(0,0,0,0.08)" }}>
        {/* Avatar */}
        <div className="w-16 h-16 rounded-full flex items-center justify-center shrink-0 overflow-hidden"
          style={{ backgroundColor: logoUrl ? "transparent" : "var(--forest)" }}>
          {logoUrl
            ? <img src={logoUrl} alt="Profil" className="w-full h-full object-cover" />
            : <span className="text-lg font-bold text-white">{initials(fullName, email)}</span>
          }
        </div>

        {/* Bilgi + butonlar */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800">Profil fotoğrafı</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {isPilot ? "PNG, JPG veya SVG · Max 2 MB" : "Görüntüleme — değiştirmek için Pilot gerekli"}
          </p>
          {isPilot && (
            <div className="flex items-center gap-2 mt-3">
              <input ref={fileInputRef} type="file"
                accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                onChange={handleLogoYukle} className="hidden" />
              <button type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={logoYukleniyor}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-opacity disabled:opacity-50"
                style={{ background: "var(--forest)" }}>
                {logoYukleniyor
                  ? <><Loader2 className="w-3 h-3 animate-spin" />Yükleniyor...</>
                  : (logoUrl ? "Değiştir" : "Fotoğraf Yükle")}
              </button>
              {logoUrl && (
                <button type="button" onClick={handleLogoKaldir} disabled={logoYukleniyor}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                  style={{ color: "#C97676", border: "0.5px solid rgba(201,118,118,0.25)" }}>
                  Kaldır
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleKaydet}
        className="bg-white rounded-xl p-5 space-y-4" style={{ border: "0.5px solid rgba(0,0,0,0.08)" }}>

        {/* Ad + Soyad */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Ad *</label>
            <input
              value={ad} onChange={e => setAd(e.target.value)}
              placeholder="Adın"
              className={inputCls}
              style={{ borderColor: "rgba(0,0,0,0.1)" }}
            />
          </div>
          <div>
            <label className={labelCls}>Soyad *</label>
            <input
              value={soyad} onChange={e => setSoyad(e.target.value)}
              placeholder="Soyadın"
              className={inputCls}
              style={{ borderColor: "rgba(0,0,0,0.1)" }}
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className={labelCls}>Email</label>
          <input
            value={email} readOnly
            className={inputCls + " bg-gray-50 cursor-not-allowed text-gray-500"}
            style={{ borderColor: "rgba(0,0,0,0.08)" }}
          />
          <div className="flex items-center justify-between mt-1.5">
            <span className="flex items-center gap-1 text-[11px]"
              style={{ color: onaylandi ? "#047857" : "#B45309" }}>
              {onaylandi
                ? <><CheckCircle2 className="w-3 h-3" /> Doğrulanmış</>
                : <><AlertCircle  className="w-3 h-3" /> Email henüz doğrulanmadı</>}
            </span>
            {!emailAcik && (
              <button type="button" onClick={() => setEmailAcik(true)}
                className="text-[11px] text-gray-400 hover:text-(--forest) transition-colors">
                değiştir →
              </button>
            )}
          </div>

          {/* Inline email değiştir formu */}
          {emailAcik && (
            <div className="mt-3 p-3 rounded-lg bg-gray-50 border border-gray-200 space-y-2">
              <label className={labelCls}>Yeni Email Adresi</label>
              <input
                type="email" value={yeniEmail} onChange={e => setYeniEmail(e.target.value)}
                placeholder="yeni@email.com"
                className={inputCls}
                style={{ borderColor: "rgba(0,0,0,0.1)" }}
              />
              <div className="flex items-center gap-2 pt-1">
                <button type="button"
                  onClick={handleEmailDegistir}
                  disabled={!yeniEmail.trim() || emailYukleniyor}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "var(--forest)" }}>
                  {emailYukleniyor && <Loader2 className="w-3 h-3 animate-spin" />}
                  Onay Gönder
                </button>
                <button type="button" onClick={() => { setEmailAcik(false); setYeniEmail(""); }}
                  className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
                  İptal
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Telefon */}
        <div>
          <label className={labelCls}>Telefon</label>
          <input
            type="tel" value={telefon} onChange={e => setTelefon(e.target.value)}
            placeholder="+90 5xx xxx xx xx"
            className={inputCls}
            style={{ borderColor: "rgba(0,0,0,0.1)" }}
          />
        </div>

        {/* Kaydet */}
        <div className="flex justify-end pt-1">
          <button type="submit" disabled={kaydetDisabled}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: "var(--forest)" }}>
            {yukleniyor && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {yukleniyor ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </form>
    </div>
  );
}
