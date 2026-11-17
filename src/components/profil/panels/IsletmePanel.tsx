"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useSirket } from "@/store/sirket";
import { aktiviteKaydet } from "@/lib/aktiviteLog";
import { SEKTORLER }      from "@/lib/sektorler";

// ── Sabitler ──────────────────────────────────────────────────────────────────
const CALISANLAR = ["1-5", "6-10", "11-25", "26-50", "50+"];
const E_FATURA = ["yok", "e-fatura", "e-arsiv"] as const;
type EFatura = typeof E_FATURA[number];

interface Form {
  name:           string;
  sector:         string;
  employee_range: string;
  tax_no:         string;
  tax_office:     string;
  vat_payer:      boolean;
  e_invoice_type: EFatura;
  address_line:   string;
  neighborhood:   string;
  district:       string;
  city:           string;
  postal_code:    string;
  contact_email:  string;
  contact_phone:  string;
  website:        string;
}

const BOŞ: Form = {
  name: "", sector: "", employee_range: "1-5",
  tax_no: "", tax_office: "", vat_payer: false, e_invoice_type: "yok",
  address_line: "", neighborhood: "", district: "", city: "", postal_code: "",
  contact_email: "", contact_phone: "", website: "",
};

// ── Mesaj stili ───────────────────────────────────────────────────────────────
interface Mesaj { tip: "basari" | "hata" | "uyari"; metin: string }
const MESAJ_STIL: Record<Mesaj["tip"], { bg: string; color: string }> = {
  basari: { bg: "rgba(16,185,129,0.08)",  color: "#047857" },
  hata:   { bg: "rgba(201,118,118,0.08)", color: "#C97676" },
  uyari:  { bg: "rgba(245,158,11,0.08)",  color: "#B45309" },
};

// ── Stil yardımcıları ─────────────────────────────────────────────────────────
const KART = "bg-white rounded-xl p-5";
const KART_STIL = { border: "0.5px solid rgba(0,0,0,0.08)" };
const LBL = "block text-[11px] text-gray-500 mb-1";
const inputCls = (readonly = false) =>
  `w-full px-3 py-2 rounded-lg text-[13px] text-gray-800 placeholder-gray-400 focus:outline-none transition-colors border`
  + (readonly ? " bg-gray-50 cursor-not-allowed text-gray-500" : "");

export default function IsletmePanel() {
  const { companyId, sirketAdi, rol } = useSirket();
  const isPilot  = rol === "pilot";
  const readonly = !isPilot;

  const [form,          setForm]          = useState<Form>(BOŞ);
  const [yukleniyor,    setYukleniyor]    = useState(true);
  const [kaydediyor,    setKaydediyor]    = useState(false);
  const [mesaj,         setMesaj]         = useState<Mesaj | null>(null);
  const [logoUrl,       setLogoUrl]       = useState<string | null>(null);
  const [logoYukleniyor, setLogoYukleniyor] = useState(false);
  const origRef    = useRef<Form>(BOŞ);
  const mesajTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const gosterMesaj = (m: Mesaj, sureSn = 4) => {
    setMesaj(m);
    if (mesajTimer.current) clearTimeout(mesajTimer.current);
    if (m.tip !== "hata") mesajTimer.current = setTimeout(() => setMesaj(null), sureSn * 1000);
  };

  // ── Veri yükle ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!companyId) { setYukleniyor(false); return; }
    createClient()
      .from("companies")
      .select("name,sector,employee_range,tax_no,tax_office,vat_payer,e_invoice_type,address_line,neighborhood,district,city,postal_code,contact_email,contact_phone,website,logo_url")
      .eq("id", companyId)
      .single()
      .then(({ data }) => {
        const d = (data ?? {}) as Record<string, unknown>;
        const loaded: Form = {
          name:           (d.name           as string)  ?? "",
          sector:         (d.sector         as string)  ?? "",
          employee_range: (d.employee_range as string)  ?? "1-5",
          tax_no:         (d.tax_no         as string)  ?? "",
          tax_office:     (d.tax_office     as string)  ?? "",
          vat_payer:      (d.vat_payer      as boolean) ?? false,
          e_invoice_type: ((d.e_invoice_type as string) ?? "yok") as EFatura,
          address_line:   (d.address_line   as string)  ?? "",
          neighborhood:   (d.neighborhood   as string)  ?? "",
          district:       (d.district       as string)  ?? "",
          city:           (d.city           as string)  ?? "",
          postal_code:    (d.postal_code    as string)  ?? "",
          contact_email:  (d.contact_email  as string)  ?? "",
          contact_phone:  (d.contact_phone  as string)  ?? "",
          website:        (d.website        as string)  ?? "",
        };
        setForm(loaded);
        origRef.current = loaded;
        setLogoUrl((d.logo_url as string) ?? null);
        setYukleniyor(false);
      });
  }, [companyId]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  // ── Dirty + disabled ────────────────────────────────────────────────────────
  const degisti   = JSON.stringify(form) !== JSON.stringify(origRef.current);
  const adDolu    = form.name.trim() !== "";
  const kaydetDis = !adDolu || !degisti || kaydediyor || readonly;

  // ── Logo yükle ──────────────────────────────────────────────────────────────
  const handleLogoYukle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !companyId) return;
    if (rol !== "pilot") { gosterMesaj({ tip: "hata", metin: "Sadece Pilot işletme logosunu düzenleyebilir." }); return; }
    if (file.size > 2 * 1024 * 1024) { gosterMesaj({ tip: "hata", metin: "Dosya 2 MB'tan büyük olamaz." }); return; }
    if (!["image/png", "image/jpeg", "image/jpg", "image/svg+xml"].includes(file.type)) {
      gosterMesaj({ tip: "hata", metin: "Sadece PNG, JPG veya SVG kabul edilir." }); return;
    }
    setLogoYukleniyor(true);
    const sb  = createClient();
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
    const filePath = `${companyId}/${Date.now()}.${ext}`;

    // Eski logoyu sil
    if (logoUrl) {
      try {
        const oldPath = new URL(logoUrl).pathname.split("/company-logos/")[1];
        if (oldPath) await sb.storage.from("company-logos").remove([oldPath]);
      } catch { /* URL parse hatası — atla */ }
    }

    const { error: uploadErr } = await sb.storage
      .from("company-logos")
      .upload(filePath, file, { contentType: file.type, upsert: false });
    if (uploadErr) { gosterMesaj({ tip: "hata", metin: "Yükleme başarısız: " + uploadErr.message }); setLogoYukleniyor(false); return; }

    const { data: { publicUrl } } = sb.storage.from("company-logos").getPublicUrl(filePath);

    const { error: updateErr } = await sb.from("companies").update({ logo_url: publicUrl }).eq("id", companyId);
    if (updateErr) { gosterMesaj({ tip: "hata", metin: "Logo bağlanamadı: " + updateErr.message }); setLogoYukleniyor(false); return; }

    setLogoUrl(publicUrl);
    setLogoYukleniyor(false);
    gosterMesaj({ tip: "basari", metin: "Logo güncellendi ✓" }, 3);
    void aktiviteKaydet({ modul: "profil", eylem: "logo-guncelle", ozet: "İşletme logosunu güncelledi" });
    // input'u sıfırla — aynı dosya tekrar seçilebilsin
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleLogoKaldir = async () => {
    if (!logoUrl || !companyId) return;
    if (!window.confirm("Logoyu kaldırmak istediğinden emin misin?")) return;
    setLogoYukleniyor(true);
    const sb = createClient();
    try {
      const oldPath = new URL(logoUrl).pathname.split("/company-logos/")[1];
      if (oldPath) await sb.storage.from("company-logos").remove([oldPath]);
    } catch { /* URL parse hatası — atla */ }
    await sb.from("companies").update({ logo_url: null }).eq("id", companyId);
    setLogoUrl(null);
    setLogoYukleniyor(false);
    gosterMesaj({ tip: "basari", metin: "Logo kaldırıldı" }, 3);
  };

  // ── Kaydet ──────────────────────────────────────────────────────────────────
  const handleKaydet = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (kaydetDis || !companyId) return;
    setKaydediyor(true);

    // Web sitesi https:// ekle
    let website = form.website.trim();
    if (website && !/^https?:\/\//i.test(website)) website = `https://${website}`;

    const { error } = await createClient()
      .from("companies")
      .update({
        name:           form.name.trim(),
        sector:         form.sector         || null,
        employee_range: form.employee_range || null,
        tax_no:         form.tax_no         || null,
        tax_office:     form.tax_office     || null,
        vat_payer:      form.vat_payer,
        e_invoice_type: form.e_invoice_type,
        address_line:   form.address_line   || null,
        neighborhood:   form.neighborhood   || null,
        district:       form.district       || null,
        city:           form.city           || null,
        postal_code:    form.postal_code    || null,
        contact_email:  form.contact_email  || null,
        contact_phone:  form.contact_phone  || null,
        website:        website             || null,
      })
      .eq("id", companyId);

    setKaydediyor(false);
    if (error) {
      gosterMesaj({ tip: "hata", metin: `Güncellenemedi: ${error.message}` });
    } else {
      const yeni = { ...form, website };
      origRef.current = yeni;
      setForm(yeni);
      gosterMesaj({ tip: "basari", metin: "Bilgiler güncellendi" }, 3);
      void aktiviteKaydet({ modul: "profil", eylem: "isletme-guncelle", ozet: "İşletme bilgilerini güncelledi" });
    }
  };

  const logoHarf = (sirketAdi ?? form.name)?.[0]?.toUpperCase() ?? "İ";
  // logoHarf kullanımı: logo yokken avatar baş harf

  // ── Skeleton ────────────────────────────────────────────────────────────────
  if (yukleniyor) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 bg-gray-100 rounded-lg" />
      {[1,2,3,4,5].map(i => <div key={i} className="h-32 bg-gray-50 rounded-xl" style={KART_STIL} />)}
    </div>
  );

  return (
    <form onSubmit={handleKaydet}>
      <div className="space-y-4">
        {/* Başlık */}
        <div>
          <p className="label-caps">İŞLETME</p>
          <h2 className="text-xl font-medium text-gray-900 mt-1">İşletme Bilgileri</h2>
          <p className="text-sm text-gray-500 mt-1">Logo, adres, vergi ve iletişim bilgileri</p>
        </div>

        {/* Co-Pilot uyarısı */}
        {readonly && (
          <div className="px-3.5 py-2 rounded-lg text-xs font-medium"
            style={{ backgroundColor: MESAJ_STIL.uyari.bg, color: MESAJ_STIL.uyari.color }}>
            Sadece Pilot işletme bilgilerini düzenleyebilir.
          </div>
        )}

        {/* Banner */}
        {mesaj && (
          <div className="px-3.5 py-2 rounded-lg text-xs font-medium"
            style={{ backgroundColor: MESAJ_STIL[mesaj.tip].bg, color: MESAJ_STIL[mesaj.tip].color }}>
            {mesaj.metin}
          </div>
        )}

        {/* KART 1 — Logo */}
        <div className={KART + " flex items-center gap-4"} style={KART_STIL}>
          {/* Preview */}
          <div className="w-20 h-20 rounded-xl flex items-center justify-center shrink-0 overflow-hidden bg-gray-50"
            style={{ border: "0.5px solid rgba(0,0,0,0.08)" }}>
            {logoUrl ? (
              <img src={logoUrl} alt="İşletme logosu" className="w-full h-full object-contain" />
            ) : (
              <span className="text-2xl font-bold" style={{ color: "var(--forest)" }}>{logoHarf}</span>
            )}
          </div>

          {/* Bilgi + butonlar */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800">İşletme Logosu</p>
            <p className="text-xs text-gray-400 mt-0.5">PNG, JPG veya SVG · Max 2 MB · Önerilen: 256×256 px</p>
            <div className="flex items-center gap-2 mt-3">
              <input ref={fileInputRef} type="file"
                accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                onChange={handleLogoYukle} className="hidden" />
              <button type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={logoYukleniyor || !isPilot}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-opacity disabled:opacity-50"
                style={{ background: "var(--forest)" }}>
                {logoYukleniyor
                  ? <><Loader2 className="w-3 h-3 animate-spin" />Yükleniyor...</>
                  : (logoUrl ? "Değiştir" : "Logo Yükle")}
              </button>
              {logoUrl && isPilot && (
                <button type="button" onClick={handleLogoKaldir} disabled={logoYukleniyor}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                  style={{ color: "#C97676", border: "0.5px solid rgba(201,118,118,0.25)" }}>
                  Kaldır
                </button>
              )}
            </div>
          </div>
        </div>

        {/* KART 2 — Temel Bilgiler */}
        <div className={KART + " space-y-4"} style={KART_STIL}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className={LBL}>İşletme Adı *</label>
              <input value={form.name} onChange={e => set("name", e.target.value)}
                readOnly={readonly} placeholder="İşletme adı"
                className={inputCls(readonly)}
                style={{ borderColor: "rgba(0,0,0,0.1)" }}
                onFocus={e => !readonly && (e.target.style.borderColor = "var(--forest)")}
                onBlur={e  => (e.target.style.borderColor = "rgba(0,0,0,0.1)")}
              />
            </div>
            <div>
              <label className={LBL}>Sektör</label>
              <select value={form.sector} onChange={e => set("sector", e.target.value)}
                disabled={readonly}
                className={inputCls(readonly)}
                style={{ borderColor: "rgba(0,0,0,0.1)" }}>
                <option value="">Sektör seç</option>
                {SEKTORLER.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="lg:w-1/2">
            <label className={LBL}>Çalışan Sayısı</label>
            <select value={form.employee_range} onChange={e => set("employee_range", e.target.value)}
              disabled={readonly}
              className={inputCls(readonly)}
              style={{ borderColor: "rgba(0,0,0,0.1)" }}>
              {CALISANLAR.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* KART 3 — Vergi Bilgileri */}
        <div className={KART + " space-y-4"} style={KART_STIL}>
          <p className="text-sm font-medium text-gray-800">Vergi Bilgileri</p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className={LBL}>Vergi No</label>
              <input value={form.tax_no}
                onChange={e => set("tax_no", e.target.value.replace(/[^0-9]/g, "").slice(0, 11))}
                readOnly={readonly} placeholder="1234567890"
                className={inputCls(readonly)}
                style={{ borderColor: "rgba(0,0,0,0.1)" }}
                onFocus={e => !readonly && (e.target.style.borderColor = "var(--forest)")}
                onBlur={e  => (e.target.style.borderColor = "rgba(0,0,0,0.1)")}
              />
            </div>
            <div>
              <label className={LBL}>Vergi Dairesi</label>
              <input value={form.tax_office} onChange={e => set("tax_office", e.target.value)}
                readOnly={readonly} placeholder="Bağlı vergi dairesi"
                className={inputCls(readonly)}
                style={{ borderColor: "rgba(0,0,0,0.1)" }}
                onFocus={e => !readonly && (e.target.style.borderColor = "var(--forest)")}
                onBlur={e  => (e.target.style.borderColor = "rgba(0,0,0,0.1)")}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="vat" checked={form.vat_payer}
              onChange={e => set("vat_payer", e.target.checked)}
              disabled={readonly}
              className="w-4 h-4 rounded accent-(--forest)" />
            <label htmlFor="vat" className="text-sm text-gray-700 cursor-pointer select-none">KDV Mükellefi</label>
          </div>
          <div>
            <label className={LBL}>E-Fatura Tipi</label>
            <div className="flex items-center gap-4 mt-1">
              {([["yok", "Yok"], ["e-fatura", "e-Fatura"], ["e-arsiv", "e-Arşiv"]] as [EFatura, string][]).map(([val, lbl]) => (
                <label key={val} className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input type="radio" value={val} checked={form.e_invoice_type === val}
                    onChange={() => set("e_invoice_type", val)}
                    disabled={readonly}
                    className="accent-(--forest)" />
                  <span className="text-sm text-gray-700">{lbl}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              E-Fatura/e-Arşiv mükellefiyseniz işlemler buna göre raporlanır
            </p>
          </div>
        </div>

        {/* KART 4 — Adres */}
        <div className={KART + " space-y-4"} style={KART_STIL}>
          <p className="text-sm font-medium text-gray-800">Adres</p>
          <div>
            <label className={LBL}>Adres Satırı</label>
            <input value={form.address_line} onChange={e => set("address_line", e.target.value)}
              readOnly={readonly} placeholder="Cadde, bina no, daire"
              className={inputCls(readonly)}
              style={{ borderColor: "rgba(0,0,0,0.1)" }}
              onFocus={e => !readonly && (e.target.style.borderColor = "var(--forest)")}
              onBlur={e  => (e.target.style.borderColor = "rgba(0,0,0,0.1)")}
            />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className={LBL}>Mahalle</label>
              <input value={form.neighborhood} onChange={e => set("neighborhood", e.target.value)}
                readOnly={readonly} placeholder="Mahalle"
                className={inputCls(readonly)} style={{ borderColor: "rgba(0,0,0,0.1)" }}
                onFocus={e => !readonly && (e.target.style.borderColor = "var(--forest)")}
                onBlur={e  => (e.target.style.borderColor = "rgba(0,0,0,0.1)")}
              />
            </div>
            <div>
              <label className={LBL}>İlçe</label>
              <input value={form.district} onChange={e => set("district", e.target.value)}
                readOnly={readonly} placeholder="İlçe"
                className={inputCls(readonly)} style={{ borderColor: "rgba(0,0,0,0.1)" }}
                onFocus={e => !readonly && (e.target.style.borderColor = "var(--forest)")}
                onBlur={e  => (e.target.style.borderColor = "rgba(0,0,0,0.1)")}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className={LBL}>Şehir</label>
              <input value={form.city} onChange={e => set("city", e.target.value)}
                readOnly={readonly} placeholder="İl / Şehir"
                className={inputCls(readonly)} style={{ borderColor: "rgba(0,0,0,0.1)" }}
                onFocus={e => !readonly && (e.target.style.borderColor = "var(--forest)")}
                onBlur={e  => (e.target.style.borderColor = "rgba(0,0,0,0.1)")}
              />
            </div>
            <div>
              <label className={LBL}>Posta Kodu</label>
              <input value={form.postal_code} onChange={e => set("postal_code", e.target.value)}
                readOnly={readonly} placeholder="34000"
                className={inputCls(readonly)} style={{ borderColor: "rgba(0,0,0,0.1)" }}
                onFocus={e => !readonly && (e.target.style.borderColor = "var(--forest)")}
                onBlur={e  => (e.target.style.borderColor = "rgba(0,0,0,0.1)")}
              />
            </div>
          </div>
        </div>

        {/* KART 5 — İletişim & Web Sitesi */}
        <div className={KART + " space-y-4"} style={KART_STIL}>
          <p className="text-sm font-medium text-gray-800">İletişim & Web Sitesi</p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className={LBL}>İletişim Emaili</label>
              <input type="email" value={form.contact_email} onChange={e => set("contact_email", e.target.value)}
                readOnly={readonly} placeholder="info@isletme.com"
                className={inputCls(readonly)} style={{ borderColor: "rgba(0,0,0,0.1)" }}
                onFocus={e => !readonly && (e.target.style.borderColor = "var(--forest)")}
                onBlur={e  => (e.target.style.borderColor = "rgba(0,0,0,0.1)")}
              />
            </div>
            <div>
              <label className={LBL}>İletişim Telefonu</label>
              <input type="tel" value={form.contact_phone} onChange={e => set("contact_phone", e.target.value)}
                readOnly={readonly} placeholder="+90 5xx xxx xx xx"
                className={inputCls(readonly)} style={{ borderColor: "rgba(0,0,0,0.1)" }}
                onFocus={e => !readonly && (e.target.style.borderColor = "var(--forest)")}
                onBlur={e  => (e.target.style.borderColor = "rgba(0,0,0,0.1)")}
              />
            </div>
          </div>
          <div>
            <label className={LBL}>Web Sitesi</label>
            <input value={form.website} onChange={e => set("website", e.target.value)}
              readOnly={readonly} placeholder="https://..."
              className={inputCls(readonly)} style={{ borderColor: "rgba(0,0,0,0.1)" }}
              onFocus={e => !readonly && (e.target.style.borderColor = "var(--forest)")}
              onBlur={e  => (e.target.style.borderColor = "rgba(0,0,0,0.1)")}
            />
          </div>
        </div>

        {/* Kaydet */}
        {!readonly && (
          <div className="flex justify-end">
            <button type="submit" disabled={kaydetDis}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
              style={{ backgroundColor: "var(--forest)" }}>
              {kaydediyor && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {kaydediyor ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        )}
      </div>
    </form>
  );
}
