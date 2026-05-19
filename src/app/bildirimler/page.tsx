"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, CheckCheck, Trash2, AlertTriangle, Info,
  ExternalLink, CheckCircle2, Circle, BellOff, BellRing,
  ChevronDown, SlidersHorizontal, Calendar, Shield,
} from "lucide-react";
import Link from "next/link";
import { useBildirimler, type BildirimTip, type BildirimModul } from "@/store/bildirimler";
import { useSirket } from "@/store/sirket";
import { createClient } from "@/utils/supabase/client";
import { onaylaSil } from "@/lib/onay";
import { useGeriAl } from "@/store/geriAl";
import { trBugun, trOncekiGun, trGunBaslangici, trGunSonu } from "@/lib/tarih";

/* ── Sabitler ── */
const TIP_CONFIG: Record<BildirimTip, { renk: string; bg: string; etiket: string }> = {
  kritik: { renk: "#ef4444", bg: "rgba(239,68,68,0.10)",  etiket: "Kritik"      },
  uyari:  { renk: "var(--leaf)", bg: "var(--mint)", etiket: "Uyarı"       },
  bilgi:  { renk: "#94a3b8", bg: "rgba(148,163,184,0.10)", etiket: "Bilgi"      },
  basari: { renk: "#22c55e", bg: "rgba(34,197,94,0.10)",  etiket: "Başarı"      },
};
const MODUL_ETIKET: Record<BildirimModul, string> = {
  "stok":"Stok","nakit-akisi":"Nakit Akışı","kar-zarar":"Kar-Zarar",
  "gorevler":"Görevler","prosedurler":"Prosedürler","acil-fon":"Acil Fon",
  "sistem":"Sistem","ekip":"Ekip",
};
const MODUL_HREF: Record<BildirimModul, string> = {
  "stok":"/stok","nakit-akisi":"/nakit-akisi","kar-zarar":"/kar-zarar",
  "gorevler":"/gorevler","prosedurler":"/prosedurler","acil-fon":"/acil-fon",
  "sistem":"/dashboard","ekip":"/ayarlar",
};
const SESSIZ_SECENEKLER = [
  { label: "1 Saat",  dakika: 60   },
  { label: "8 Saat",  dakika: 480  },
  { label: "24 Saat", dakika: 1440 },
  { label: "Süresiz", dakika: null },
] as const;

type TarihMod   = "tumu" | "bugun" | "hafta" | "ay" | "ozel";
type KaynakMod  = "tumu" | "sistem";

interface SistemBildirim {
  id: string; baslik: string; mesaj: string;
  tip: string; hedef: string;
  admin_email: string | null; olusturma: string;
  dismissed: boolean;
}

/* ── Yardımcılar ── */
function zaman(iso: string) {
  const fark = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (fark < 1)    return "Az önce";
  if (fark < 60)   return `${fark}dk önce`;
  if (fark < 1440) return `${Math.floor(fark / 60)}sa önce`;
  return `${Math.floor(fark / 1440)}g önce`;
}
function sessizKalanSure(bitis: string | null): string {
  if (!bitis) return "Süresiz";
  const kalan = Math.max(0, Math.ceil((new Date(bitis).getTime() - Date.now()) / 60000));
  if (kalan < 60) return `${kalan}dk kaldı`;
  return `${Math.ceil(kalan / 60)}sa kaldı`;
}

/* ── Sayfa ── */
export default function BildirimlerPage() {
  const {
    bildirimler, okunduYap, okunduToggle, tumunuOkunduYap, sil, tumunuSil,
    sessizModu, sessizBitis, sessizeAl, sessizModuAc,
  } = useBildirimler();

  const { rol } = useSirket();

  /* Filtre */
  const [kaynak,         setKaynak]         = useState<KaynakMod>("tumu");
  const [tipFiltre,      setTipFiltre]       = useState<"tumu" | BildirimTip>("tumu");
  const [modulFiltre,    setModulFiltre]     = useState<"tumu" | BildirimModul>("tumu");
  const [sadeceOkunmayan,setSadeceOkunmayan] = useState(false);
  const [tarihMod,       setTarihMod]        = useState<TarihMod>("tumu");
  const [ozelBas,        setOzelBas]         = useState(trOncekiGun(6));
  const [ozelBit,        setOzelBit]         = useState(trBugun());
  const [sessizDropdown, setSessizDropdown]  = useState(false);

  /* Sistem bildirimleri */
  const [sistemBildirimler, setSistemBildirimler] = useState<SistemBildirim[]>([]);

  useEffect(() => {
    async function yukle() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("system_notifications")
        .select("*, notification_read_states!left(dismissed_popup, is_read)")
        .order("olusturma", { ascending: false });

      if (!data) return;

      const hedefUyuyor = (hedef: string) =>
        hedef === "tumu" ||
        (hedef === "pilot"   && rol === "pilot")   ||
        (hedef === "copilot" && rol === "copilot");

      setSistemBildirimler(
        data
          .filter((b) => hedefUyuyor(b.hedef))
          .map((b) => {
            const rs = Array.isArray(b.notification_read_states)
              ? b.notification_read_states[0]
              : b.notification_read_states;
            return { ...b, dismissed: rs?.dismissed_popup === true };
          })
      );
    }
    yukle();
  }, [rol]);

  async function sistemOkunduYap(notifId: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("notification_read_states").upsert(
      { user_id: user.id, notification_id: notifId, is_read: true },
      { onConflict: "user_id,notification_id" }
    );
    setSistemBildirimler((prev) => prev.map((b) => b.id === notifId ? { ...b, dismissed: true } : b));
  }

  /* Tarih aralığı */
  const { basT, bitisT } = useMemo(() => {
    const bg = trBugun();
    switch (tarihMod) {
      case "bugun": return { basT: trGunBaslangici(bg),             bitisT: trGunSonu(bg)             };
      case "hafta": return { basT: trGunBaslangici(trOncekiGun(6)), bitisT: trGunSonu(bg)             };
      case "ay":    return { basT: trGunBaslangici(trOncekiGun(29)),bitisT: trGunSonu(bg)             };
      case "ozel":  return { basT: trGunBaslangici(ozelBas),        bitisT: trGunSonu(ozelBit)        };
      default:      return { basT: null, bitisT: null };
    }
  }, [tarihMod, ozelBas, ozelBit]);

  const filtrelenmis = useMemo(() => {
    return bildirimler.filter((b) => {
      if (tipFiltre !== "tumu" && b.tip !== tipFiltre) return false;
      if (modulFiltre !== "tumu" && b.modul !== modulFiltre) return false;
      if (sadeceOkunmayan && b.okundu) return false;
      if (basT && bitisT) { const t = new Date(b.tarih); if (t < basT || t > bitisT) return false; }
      return true;
    });
  }, [bildirimler, tipFiltre, modulFiltre, sadeceOkunmayan, basT, bitisT]);

  const okunmamis = bildirimler.filter((b) => !b.okundu).length;
  const herhangiFiltre = tipFiltre !== "tumu" || modulFiltre !== "tumu" || sadeceOkunmayan || tarihMod !== "tumu";

  const handleBildirimSil = async (b: { id: string; baslik: string }) => {
    const { onaylandi } = await onaylaSil({ tip: "bildirim", isim: b.baslik });
    if (!onaylandi) return;
    await sil(b.id);
    useGeriAl.getState().goster({
      mesaj: `"${b.baslik}" silindi.`,
      sureMs: 10000,
      geriAlFn: async () => { useBildirimler.getState().geriAl(b.id); },
    });
  };

  const handleTumunuSil = async () => {
    const { onaylandi } = await onaylaSil({ tip: "bildirim", isim: `Tüm ${bildirimler.length} bildirim` });
    if (!onaylandi) return;
    tumunuSil();
  };

  return (
    <div className="max-w-6xl mx-auto px-2">

      {/* Hero */}
      <section className="space-y-2 py-6">
        <p className="label-caps">ERKEN UYARI MERKEZİ</p>
        <div className="flex items-baseline gap-3">
          <span className="hero-number">{okunmamis > 0 ? okunmamis : bildirimler.length}</span>
          <span className="text-lg text-gray-400">{okunmamis > 0 ? "okunmamış" : "bildirim"}</span>
        </div>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {bildirimler.length} uygulama · {sistemBildirimler.length} sistem bildirimi
        </p>
      </section>

      <hr className="section-rule" />

      {/* ── Filtre + Aksiyon Paneli ── */}
      <div className="card rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div />
          {/* Sessiz mod */}
          <div className="relative">
            {sessizModu ? (
              <button onClick={sessizModuAc}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border"
                style={{ backgroundColor: "rgba(148,163,184,0.15)", borderColor: "rgba(148,163,184,0.35)", color: "#94a3b8" }}>
                <BellRing className="w-4 h-4" />
                Sesi Aç
                <span className="text-[11px] bg-[rgba(0,0,0,0.2)] px-1.5 py-0.5 rounded-md text-gray-500">
                  {sessizKalanSure(sessizBitis)}
                </span>
              </button>
            ) : (
              <button onClick={() => setSessizDropdown(!sessizDropdown)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-400 hover:border-[var(--forest-200, #B3E8C8)] hover:text-[var(--leaf)]">
                <BellOff className="w-4 h-4" />Sessize Al
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${sessizDropdown ? "rotate-180" : ""}`} />
              </button>
            )}
            <AnimatePresence>
              {sessizDropdown && !sessizModu && (
                <motion.div initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }} transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 z-20 min-w-40 card rounded-xl p-1 shadow-xl">
                  {SESSIZ_SECENEKLER.map(({ label, dakika }) => (
                    <button key={label} onClick={() => { sessizeAl(dakika); setSessizDropdown(false); }}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-[var(--mint)] hover:text-[var(--leaf)] transition-colors">
                      {label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Sessiz banner */}
        <AnimatePresence>
          {sessizModu && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center justify-between px-4 py-3 rounded-xl bg-[rgba(148,163,184,0.08)] border border-[rgba(148,163,184,0.2)]">
              <div className="flex items-center gap-2.5">
                <BellOff className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-800">Bildirimler sessize alındı</p>
                  <p className="text-xs text-gray-500">{sessizBitis ? `${sessizKalanSure(sessizBitis)} — yeni bildirim gelmez` : "Süresiz"}</p>
                </div>
              </div>
              <button onClick={sessizModuAc} className="text-xs text-[var(--leaf)] font-semibold hover:underline">Sesi Aç</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toplu aksiyonlar */}
        {bildirimler.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <button onClick={tumunuOkunduYap}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[rgba(34,197,94,0.08)] border border-[rgba(34,197,94,0.2)] text-[#22c55e] text-xs font-medium hover:bg-[rgba(34,197,94,0.15)] transition-all">
              <CheckCheck className="w-3.5 h-3.5" />Tümünü Okundu İşaretle
            </button>
            <button onClick={handleTumunuSil}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[rgba(239,68,68,0.2)] text-[#ef4444] text-xs font-medium hover:bg-[rgba(239,68,68,0.08)] transition-all">
              <Trash2 className="w-3.5 h-3.5" />Tümünü Temizle
            </button>
          </div>
        )}
      </div>

      {/* ── Kaynak sekmesi ── */}
      <div className="flex gap-1 p-1 rounded-2xl card">
        {([
          { v: "tumu",   label: `Tüm Bildirimler (${bildirimler.length + sistemBildirimler.length})` },
          { v: "sistem", label: `Sistem Bildirimleri (${sistemBildirimler.length})` },
        ] as { v: KaynakMod; label: string }[]).map(({ v, label }) => (
          <button key={v} onClick={() => setKaynak(v)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{
              background: kaynak === v ? "var(--mint)" : "transparent",
              color:      kaynak === v ? "var(--leaf)"               : "#64748b",
              border:     kaynak === v ? "1px solid var(--forest-200, #B3E8C8)" : "1px solid transparent",
            }}>
            {v === "sistem" && <Shield className="w-3.5 h-3.5" />}
            {label}
          </button>
        ))}
      </div>

      {/* ── Sistem Bildirimleri ── */}
      {kaynak === "sistem" && (
        <div className="space-y-3">
          {sistemBildirimler.length === 0 ? (
            <div className="card rounded-2xl py-14 text-center">
              <Shield className="w-8 h-8 text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Sistem bildirimi yok</p>
            </div>
          ) : sistemBildirimler.map((b, i) => {
            const renk = b.tip === "kritik" ? "#ef4444" : b.tip === "duyuru" ? "var(--leaf)" : "#22c55e";
            return (
              <motion.div key={b.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.04 }}
                className="card rounded-xl overflow-hidden"
                style={{ borderLeft: `3px solid ${renk}` }}>
                <div className="flex items-start gap-4 px-5 py-4">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base"
                    style={{ background: `${renk}18`, border: `1px solid ${renk}33` }}>
                    {b.tip === "kritik" ? "🚨" : b.tip === "duyuru" ? "📢" : "✅"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-sm font-bold text-gray-800">{b.baslik}</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: `${renk}22`, color: renk }}>
                        {b.tip === "kritik" ? "Kritik" : b.tip === "duyuru" ? "Duyuru" : "Güncelleme"}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--mint)] text-[var(--leaf)] flex items-center gap-1">
                        <Shield className="w-2.5 h-2.5" />Sistem
                      </span>
                      {b.dismissed && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(34,197,94,0.1)] text-[#22c55e] flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" />Okundu
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">{b.mesaj}</p>
                    <p className="text-[10px] text-gray-500 mt-1.5">{zaman(b.olusturma)} · PilotSensin Admin</p>
                  </div>
                  {!b.dismissed && (
                    <button onClick={() => sistemOkunduYap(b.id)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all shrink-0"
                      style={{ color: "#94a3b8", borderColor: "rgba(255,255,255,0.08)" }}>
                      <Circle className="w-3.5 h-3.5" />Okundu
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Uygulama Bildirimleri ── */}
      {kaynak !== "sistem" && (
        <>
          {/* Filtreler */}
          <div className="card rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <SlidersHorizontal className="w-3.5 h-3.5" /><span>Filtrele</span>
              </div>
              {herhangiFiltre && (
                <button onClick={() => { setTipFiltre("tumu"); setModulFiltre("tumu"); setSadeceOkunmayan(false); setTarihMod("tumu"); }}
                  className="text-xs text-[#ef4444] hover:underline">Temizle</button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="overflow-x-auto flex p-0.5 rounded-xl bg-gray-50 border border-gray-200">
                {([
                  { v: "tumu",   label: "Tümü",   count: bildirimler.length },
                  { v: "kritik", label: "Kritik",  count: bildirimler.filter(b => b.tip === "kritik").length, renk: "#ef4444" },
                  { v: "uyari",  label: "Uyarı",   count: bildirimler.filter(b => b.tip === "uyari").length,  renk: "var(--leaf)" },
                  { v: "bilgi",  label: "Tamamlandı", count: bildirimler.filter(b => b.tip === "bilgi").length, renk: "#22c55e" },
                ] as { v: "tumu" | BildirimTip; label: string; count: number; renk?: string }[]).map(({ v, label, count, renk }) => {
                  const r = renk ?? "#94a3b8";
                  return (
                    <button key={v} onClick={() => setTipFiltre(v)}
                      className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{
                        backgroundColor: tipFiltre === v ? `${r}20` : "transparent",
                        color:           tipFiltre === v ? r : "#64748b",
                        border:          tipFiltre === v ? `1px solid ${r}40` : "1px solid transparent",
                      }}>
                      {label}{count > 0 && <span className="text-[10px] opacity-60">{count}</span>}
                    </button>
                  );
                })}
              </div>
              <button onClick={() => setSadeceOkunmayan(!sadeceOkunmayan)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all"
                style={{
                  borderColor: sadeceOkunmayan ? "var(--leaf)" : "rgba(255,255,255,0.1)",
                  backgroundColor: sadeceOkunmayan ? "var(--mint)" : "transparent",
                  color: sadeceOkunmayan ? "var(--leaf)" : "#64748b",
                }}>
                <Circle className="w-3 h-3" />Okunmayanlar
                {okunmamis > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[var(--forest-100, #D9F2E4)] text-[var(--leaf)]">{okunmamis}</span>
                )}
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select value={modulFiltre} onChange={(e) => setModulFiltre(e.target.value as "tumu" | BildirimModul)}
                className="px-2.5 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-xs focus:outline-none focus:border-[var(--leaf)]"
                style={{ color: modulFiltre !== "tumu" ? "var(--leaf)" : "#64748b" }}>
                <option value="tumu"        className="bg-[var(--forest)] text-white">Tüm Modüller</option>
                {(["stok","nakit-akisi","kar-zarar","gorevler","prosedurler","acil-fon","sistem"] as BildirimModul[]).map((m) => (
                  <option key={m} value={m} className="bg-[var(--forest)] text-white">{MODUL_ETIKET[m]}</option>
                ))}
              </select>
              <div className="overflow-x-auto flex p-0.5 rounded-xl bg-gray-50 border border-gray-200">
                {(["tumu","bugun","hafta","ay","ozel"] as TarihMod[]).map((t) => (
                  <button key={t} onClick={() => setTarihMod(t)}
                    className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{
                      backgroundColor: tarihMod === t ? "var(--mint)" : "transparent",
                      color:           tarihMod === t ? "var(--leaf)" : "#64748b",
                      border:          tarihMod === t ? "1px solid var(--forest-200, #B3E8C8)" : "1px solid transparent",
                    }}>
                    {t === "tumu" ? "Tümü" : t === "bugun" ? "Bugün" : t === "hafta" ? "7 Gün" : t === "ay" ? "30 Gün" : (
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Özel</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <AnimatePresence>
              {tarihMod === "ozel" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }} className="flex flex-wrap items-center gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500 whitespace-nowrap">Başlangıç</label>
                    <input type="date" value={ozelBas} max={ozelBit} onChange={(e) => setOzelBas(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-800 text-xs focus:outline-none scheme-dark" />
                  </div>
                  <span className="text-gray-500">—</span>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500 whitespace-nowrap">Bitiş</label>
                    <input type="date" value={ozelBit} min={ozelBas} max={trBugun()} onChange={(e) => setOzelBit(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-800 text-xs focus:outline-none scheme-dark" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Liste */}
          <div className="space-y-2">
            {filtrelenmis.length === 0 ? (
              <div className="card rounded-2xl py-16 text-center">
                <Bell className="w-10 h-10 text-gray-400 mx-auto mb-3 opacity-40" />
                <p className="text-sm text-gray-400">
                  {herhangiFiltre ? "Bu filtrelerle eşleşen bildirim yok" : "Bildirim yok"}
                </p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {filtrelenmis.map((b, i) => {
                  const cfg  = TIP_CONFIG[b.tip];
                  const Icon = b.tip === "bilgi" ? Info : AlertTriangle;
                  return (
                    <motion.div key={b.id}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                      transition={{ duration: 0.2, delay: i * 0.03 }}
                      className="card rounded-xl overflow-hidden"
                      style={{ borderColor: !b.okundu ? `${cfg.renk}40` : undefined, borderLeftWidth: !b.okundu ? "3px" : undefined }}>
                      <div className="flex items-start gap-4 px-5 py-4">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: cfg.bg }}>
                          <Icon className="w-4 h-4" style={{ color: cfg.renk }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold" style={{ color: b.okundu ? "#64748b" : cfg.renk }}>{b.baslik}</p>
                              {!b.okundu && <span className="w-2 h-2 rounded-full animate-pulse shrink-0" style={{ backgroundColor: cfg.renk }} />}
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: cfg.renk, backgroundColor: cfg.bg }}>{cfg.etiket}</span>
                              <span className="text-[10px] text-gray-500 px-1.5 py-0.5 rounded bg-gray-50">{MODUL_ETIKET[b.modul]}</span>
                            </div>
                            <span className="text-[11px] text-gray-500 shrink-0">{zaman(b.tarih)}</span>
                          </div>
                          <p className="text-xs text-gray-400 leading-relaxed">{b.mesaj}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 ml-1">
                          <button onClick={() => okunduToggle(b.id)}
                            className="group flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium border transition-all"
                            style={b.okundu
                              ? { color: "#22c55e", borderColor: "rgba(34,197,94,0.25)", backgroundColor: "rgba(34,197,94,0.08)" }
                              : { color: "#94a3b8", borderColor: "rgba(255,255,255,0.08)", backgroundColor: "transparent" }}>
                            {b.okundu
                              ? <><CheckCircle2 className="w-3.5 h-3.5" /><span className="hidden sm:inline group-hover:hidden">Okundu</span><span className="hidden sm:group-hover:inline text-[var(--leaf)]">Geri Al</span></>
                              : <><Circle className="w-3.5 h-3.5" /><span className="hidden sm:inline">Okundu</span></>}
                          </button>
                          <Link href={b.ilgiliLink ?? MODUL_HREF[b.modul]} onClick={() => okunduYap(b.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-[var(--leaf)] hover:bg-[var(--mint)] transition-all">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                          <button onClick={() => handleBildirimSil(b)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-[#ef4444] hover:bg-[rgba(239,68,68,0.08)] transition-all">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </>
      )}
    </div>
  );
}
