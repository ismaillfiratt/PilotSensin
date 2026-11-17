"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, Info, X } from "lucide-react";
import { useSirket } from "@/store/sirket";
import { createClient } from "@/utils/supabase/client";
import { aktiviteKaydet } from "@/lib/aktiviteLog";
import { COPILOT_PERMISSIONS } from "@/lib/permissions";

const KART      = "bg-white rounded-xl p-5";
const KART_STIL = { border: "0.5px solid rgba(0,0,0,0.08)" };

const ROZET_YAKINDA = (
  <span
    className="text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0"
    style={{ background: "rgba(180,83,9,0.1)", color: "#B45309" }}
  >
    YAKINDA
  </span>
);

const OZELLIKLER = [
  "Sınırsız ürün ve görev",
  "Sınırsız aktif hedef",
  "Sınırsız nakit işlemi",
  "Sınırsız satış ve gider kaydı",
  "Tüm modüller açık",
  "Acil Durum Fonu yönetimi",
  "Prosedür & SOP yönetimi",
  "Detaylı raporlar",
  "Pilot Skoru ve uyarı motoru",
  "Çöp kutusu + 30 gün veri kurtarma",
  "Email destek",
  "KVKK uyumlu veri saklama",
];

export default function AbonelikPanel() {
  const { companyId, trialEndsAt, maxUye, rol } = useSirket();
  const isPilot = rol === "pilot";
  const router  = useRouter();

  const [ekipSayisi, setEkipSayisi] = useState<number | null>(null);

  // ── Davet modal state ──────────────────────────────────────────────────────
  const [davetModalAcik,   setDavetModalAcik]   = useState(false);
  const [davetEmail,       setDavetEmail]       = useState("");
  const [davetRolId,       setDavetRolId]       = useState<string>("");
  const [davetOnayli,      setDavetOnayli]      = useState(false);
  const [davetYukleniyor,  setDavetYukleniyor]  = useState(false);
  const [davetHata,        setDavetHata]        = useState<string | null>(null);
  const [roller,           setRoller]           = useState<Array<{ id: string; name: string; is_owner: boolean }>>([]);

  useEffect(() => {
    if (!companyId) return;
    const sb = createClient();
    sb.from("company_members")
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("status", "active")
      .then(({ count, error }) => { if (!error) setEkipSayisi(count ?? 0); });

    sb.from("company_roles")
      .select("id, name, is_owner")
      .eq("company_id", companyId)
      .order("created_at")
      .then(({ data }) => {
        const list = (data ?? []) as Array<{ id: string; name: string; is_owner: boolean }>;
        setRoller(list);
        const ilk = list.find((r) => !r.is_owner);
        if (ilk) setDavetRolId(ilk.id);
      });
  }, [companyId]);

  const trialAktif = trialEndsAt !== null && trialEndsAt.getTime() > Date.now();
  const trialGun   = trialEndsAt
    ? Math.ceil((trialEndsAt.getTime() - Date.now()) / 86400000)
    : null;
  const ekstraUye  = Math.max(0, (ekipSayisi ?? 0) - 6);
  const aylikUcret = 299 + ekstraUye * 99;

  // Yeni üye eklenince fiyat hesabı
  const sonrakiUyeSayisi = (ekipSayisi ?? 0) + 1;
  const ekUyeUcreti      = Math.max(0, sonrakiUyeSayisi - 6) * 99;
  const yeniAylikUcret   = 299 + Math.max(0, sonrakiUyeSayisi - 6) * 99;
  const ekstraOdemeVar   = ekUyeUcreti > 0;

  // ── Davet gönder ────────────────────────────────────────────────────────────
  const handleDavetGonder = async () => {
    setDavetHata(null);
    if (!davetEmail || !davetEmail.includes("@")) { setDavetHata("Geçerli bir email gir."); return; }
    if (ekstraOdemeVar && !davetOnayli) { setDavetHata("Ücret artışını onaylamadan davet gönderemezsin."); return; }
    if (!companyId) return;
    setDavetYukleniyor(true);
    const sb = createClient();
    const { data: { session } } = await sb.auth.getSession();
    if (!session) { setDavetYukleniyor(false); return; }
    const email  = davetEmail.toLowerCase().trim();
    const secRol = roller.find((r) => r.id === davetRolId);
    const roleStr = secRol?.is_owner ? "pilot" : "copilot";
    const { error } = await sb.from("invitations").insert({
      company_id:  companyId,
      email,
      role:        roleStr,
      invited_by:  session.user.id,
    });
    if (error) { setDavetHata("Davet gönderilemedi: " + error.message); setDavetYukleniyor(false); return; }
    await sb.from("company_members").upsert({
      company_id:  companyId,
      email,
      role:        roleStr,
      role_id:     davetRolId || null,
      permissions: COPILOT_PERMISSIONS,
      status:      "pending",
    }, { onConflict: "company_id,email" });
    void aktiviteKaydet({
      modul: "profil", eylem: "uye-davet",
      ozet: `${email} adresine davet gönderildi`,
    });
    setEkipSayisi((p) => (p ?? 0) + 1);
    setDavetModalAcik(false);
    setDavetEmail(""); setDavetOnayli(false); setDavetYukleniyor(false);
  };

  return (
    <div className="space-y-4">
      {/* Başlık */}
      <div>
        <p className="label-caps">İŞLETME</p>
        <h2 className="text-xl font-medium text-gray-900 mt-1">Abonelik & Plan</h2>
        <p className="text-sm text-gray-500 mt-1">
          Mevcut plan, ekip kullanımı ve faturalandırma
        </p>
      </div>

      {/* ── KART 1 — Mevcut Plan & Fiyat ── */}
      <div
        className={KART}
        style={{ border: "1.5px solid var(--forest)", background: "rgba(15,61,46,0.03)" }}
      >
        <div className="flex items-start justify-between gap-4">
          {/* Sol */}
          <div>
            <span
              className="inline-block text-[10px] font-semibold px-2.5 py-0.5 rounded-full mb-2"
              style={{
                background: "var(--mint)",
                color: "var(--forest)",
                border: "1px solid var(--forest-200,#B3E8C8)",
              }}
            >
              MEVCUT PLAN
            </span>
            <p className="text-2xl font-medium" style={{ color: "var(--forest)" }}>
              PilotSensin
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              İşletmen için gereken her şey, tek planda
            </p>

            {trialAktif && trialGun !== null && trialGun > 0 ? (
              <div className="mt-2">
                <span
                  className="inline-block text-[10px] font-semibold px-2.5 py-0.5 rounded-full"
                  style={{ background: "rgba(180,83,9,0.1)", color: "#B45309" }}
                >
                  DENEME · {trialGun} gün kaldı
                </span>
                <p className="text-xs text-gray-400 mt-1">
                  Deneme bitince ₺{aylikUcret}/ay ödenir
                </p>
              </div>
            ) : (
              <p className="text-xs text-gray-500 mt-1">
                Aktif abonelik · sonraki yenileme: —
              </p>
            )}
          </div>

          {/* Sağ — fiyat */}
          <div className="text-right shrink-0">
            {trialAktif ? (
              <>
                <p className="text-3xl font-medium" style={{ color: "var(--forest)" }}>
                  Ücretsiz
                </p>
                <p className="text-xs text-gray-400 mt-0.5">deneme süresi</p>
              </>
            ) : (
              <>
                <div className="flex items-baseline gap-1 justify-end">
                  <span
                    className="font-medium"
                    style={{ fontSize: 32, color: "var(--forest)" }}
                  >
                    ₺{ekipSayisi === null ? "—" : aylikUcret}
                  </span>
                  <span className="text-sm text-gray-400">/ay</span>
                </div>
                {ekipSayisi !== null && ekstraUye > 0 && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    ₺299 base + ₺{ekstraUye * 99} ek üye
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── KART 2 — Bu planda neler var? ── */}
      <div className={KART + " space-y-3"} style={KART_STIL}>
        <div>
          <p className="text-sm font-medium text-gray-800">Bu planda neler var?</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Tüm modüller, tüm özellikler — sınırsız
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-1">
          {OZELLIKLER.map((madde) => (
            <div key={madde} className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--forest)" }} />
              <span className="text-xs text-gray-600">{madde}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── KART 3 — Ekip ücretlendirmesi ── */}
      <div className={KART + " space-y-3"} style={KART_STIL}>
        <div>
          <p className="text-sm font-medium text-gray-800">Ekip ücretlendirmesi</p>
          <p className="text-xs text-gray-400 mt-0.5">
            6 kullanıcı plana dahil, sonrası kullanıma göre ücretlendirilir
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Plan base</span>
            <span className="text-gray-600">₺299 / ay</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">6 kullanıcı</span>
            <span style={{ color: "var(--forest)" }}>Dahil</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Her ek üye</span>
            <span className="text-gray-600">+₺99 / ay</span>
          </div>
        </div>

        <div
          className="flex items-center justify-between pt-3"
          style={{ borderTop: "0.5px solid rgba(0,0,0,0.08)" }}
        >
          <span className="text-xs text-gray-600">Şu anki aylık ücret</span>
          <span className="text-sm font-semibold" style={{ color: "var(--forest)" }}>
            {ekipSayisi === null ? "—" : `₺${aylikUcret}/ay`}
          </span>
        </div>

        <div
          className="flex items-start gap-2 rounded-lg p-3"
          style={{ background: "rgba(15,61,46,0.04)" }}
        >
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: "var(--forest)" }} />
          <p className="text-xs text-gray-500 leading-relaxed">
            Ekibine yeni üye davet ettiğinde ücret otomatik güncellenir. 7. üyeden
            itibaren her ay +₺99 eklenir.
          </p>
        </div>

        {isPilot && (
          <div
            className="flex items-center justify-between pt-3"
            style={{ borderTop: "0.5px solid rgba(0,0,0,0.08)" }}
          >
            <div>
              <p className="text-xs text-gray-600 font-medium">Ekibine yeni üye ekle</p>
              {ekstraOdemeVar && (
                <p className="text-xs text-gray-400 mt-0.5">
                  Yeni üye ile aylık ücret ₺{yeniAylikUcret} olacak
                </p>
              )}
            </div>
            <button
              onClick={() => setDavetModalAcik(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-opacity hover:opacity-90"
              style={{ background: "var(--forest)" }}
            >
              + Üye Ekle
            </button>
          </div>
        )}
      </div>

      {/* ── KART 4 — Ekip kullanımı ── */}
      <div className={KART} style={KART_STIL}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="label-caps text-[10px]">AKTİF EKİP ÜYESİ</p>
            <p
              className="font-medium mt-1"
              style={{ fontSize: 28, color: "var(--forest)" }}
            >
              {ekipSayisi === null ? "—" : ekipSayisi}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {ekipSayisi === null
                ? "—"
                : ekstraUye === 0
                ? "6 kullanıcı plana dahil"
                : `6 dahil + ${ekstraUye} ek üye · ${ekstraUye * 99} TL ek/ay`}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isPilot && (
              <button
                onClick={() => setDavetModalAcik(true)}
                className="px-3 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
                style={{ background: "var(--forest)" }}
              >
                + Üye Davet Et
              </button>
            )}
            <button
              onClick={() => router.push("/ekip")}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
              style={{ background: "#fff", border: "0.5px solid rgba(0,0,0,0.15)" }}
            >
              Ekip yönet →
            </button>
          </div>
        </div>
      </div>

      {/* ── KART 5 — Faturalandırma & Ödeme (iskelet) ── */}
      <div className={KART + " space-y-4"} style={{ ...KART_STIL, opacity: 0.7 }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-medium text-gray-800">Faturalandırma</p>
              {ROZET_YAKINDA}
            </div>
            <p className="text-xs text-gray-400">Sonraki yenileme tarihi ve fatura adresi</p>
          </div>
          <div
            className="text-center px-4 py-2 rounded-lg text-xs text-gray-400"
            style={{ border: "1px dashed rgba(0,0,0,0.1)" }}
          >
            Trial süresi bittikten sonra burada faturalandırma detayları görünecek
          </div>
        </div>
        <div className="pt-4 space-y-2" style={{ borderTop: "0.5px solid rgba(0,0,0,0.08)" }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-medium text-gray-800">Ödeme Yöntemi</p>
                {ROZET_YAKINDA}
              </div>
              <p className="text-xs text-gray-400">Kayıtlı kart bilgileri ve ödeme tercihi</p>
            </div>
            <div
              className="text-center px-4 py-2 rounded-lg text-xs text-gray-400"
              style={{ border: "1px dashed rgba(0,0,0,0.1)" }}
            >
              iyzico entegrasyonu hazırlanıyor — şimdilik manuel havale
            </div>
          </div>
        </div>
      </div>

      {/* ── KART 6 — Fatura Geçmişi (iskelet) ── */}
      <div className={KART} style={{ ...KART_STIL, opacity: 0.7 }}>
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-medium text-gray-800">Fatura Geçmişi</p>
          {ROZET_YAKINDA}
        </div>
        <p className="text-xs text-gray-400 mb-3">Geçmiş faturalarını indir</p>
        <div
          className="py-4 text-center rounded-lg text-xs text-gray-400"
          style={{ border: "1px dashed rgba(0,0,0,0.1)" }}
        >
          İlk faturaya geçildiğinde burada listelenir
        </div>
      </div>

      {/* ── Üye Davet Modal ── */}
      {davetModalAcik && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setDavetModalAcik(false); }}
        >
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-sm font-semibold text-gray-900">Yeni Üye Davet Et</p>
                <p className="text-xs text-gray-400 mt-0.5">Email adresine davet linki gönderilir</p>
              </div>
              <button
                onClick={() => { setDavetModalAcik(false); setDavetHata(null); }}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Email */}
              <div>
                <label className="text-xs text-gray-400 font-medium block mb-1.5">
                  Email adresi *
                </label>
                <input
                  type="email"
                  value={davetEmail}
                  onChange={(e) => setDavetEmail(e.target.value)}
                  placeholder="ornek@sirket.com"
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[var(--leaf)] transition-colors text-sm"
                />
              </div>

              {/* Rol */}
              {roller.length > 0 && (
                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-1.5">
                    Rol
                  </label>
                  <select
                    value={davetRolId}
                    onChange={(e) => setDavetRolId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:outline-none focus:border-[var(--leaf)] transition-colors text-sm"
                  >
                    {roller.filter((r) => !r.is_owner).map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Ücret uyarısı */}
              {ekstraOdemeVar && (
                <div
                  className="rounded-xl p-3 space-y-3"
                  style={{ background: "rgba(180,83,9,0.06)", border: "1px solid rgba(180,83,9,0.15)" }}
                >
                  <div className="flex items-start gap-2">
                    <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: "#B45309" }} />
                    <div>
                      <p className="text-xs font-medium" style={{ color: "#B45309" }}>
                        Ücret artışı — onay gerekiyor
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                        {ekipSayisi !== null && ekipSayisi >= 6
                          ? `Mevcut ${ekipSayisi} üyenle aylık ücretin ₺${aylikUcret}. Yeni üye eklenince ₺${yeniAylikUcret}/ay olacak.`
                          : `Yeni üye eklenmesiyle aylık ücret ₺${yeniAylikUcret} olacak.`}
                      </p>
                    </div>
                  </div>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={davetOnayli}
                      onChange={(e) => setDavetOnayli(e.target.checked)}
                      className="mt-0.5 accent-[var(--forest)] w-3.5 h-3.5 shrink-0"
                    />
                    <span className="text-xs text-gray-600">
                      Aylık ücretin <strong>₺{yeniAylikUcret}</strong> olacağını onaylıyorum
                    </span>
                  </label>
                </div>
              )}

              {davetHata && (
                <p className="text-xs text-red-500">{davetHata}</p>
              )}

              {/* Butonlar */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={() => { setDavetModalAcik(false); setDavetHata(null); }}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                  style={{ border: "0.5px solid rgba(0,0,0,0.12)" }}
                >
                  İptal
                </button>
                <button
                  onClick={handleDavetGonder}
                  disabled={davetYukleniyor || (ekstraOdemeVar && !davetOnayli)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ background: "var(--forest)" }}
                >
                  {davetYukleniyor ? "Gönderiliyor..." : "Daveti Gönder"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── KART 7 — Plan iptal (en alt, küçük) ── */}
      <div
        className="bg-white rounded-xl p-4"
        style={{ ...KART_STIL, opacity: 0.6 }}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-700">Planı iptal et</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Mevcut dönem sonuna kadar erişim devam eder
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-gray-400 cursor-not-allowed">İptal et →</span>
            {ROZET_YAKINDA}
          </div>
        </div>
      </div>
    </div>
  );
}
