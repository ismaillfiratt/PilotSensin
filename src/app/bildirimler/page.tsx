"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, BellOff, BellRing, CheckCheck, Trash2,
  Search, SlidersHorizontal, ChevronDown,
  ExternalLink, MoreVertical, Shield,
  CheckCircle2, Circle, X,
} from "lucide-react";
import Link from "next/link";
import { useBildirimler, type BildirimTip, type BildirimModul } from "@/store/bildirimler";
import { manuelKapat } from "@/lib/uyari-motoru/manuelKapatma";
import { toast } from "@/store/toast";
import { useSirket } from "@/store/sirket";
import { createClient } from "@/utils/supabase/client";
import { onaylaSil } from "@/lib/onay";
import { useGeriAl } from "@/store/geriAl";
import { trBugun, trOncekiGun, trGunBaslangici, trGunSonu } from "@/lib/tarih";

/* ── Sabitler ── */
const TIP_CONFIG: Record<BildirimTip, { renk: string; bg: string; etiket: string }> = {
  kritik: { renk: "#ef4444",      bg: "rgba(239,68,68,0.10)",    etiket: "Kritik"  },
  uyari:  { renk: "var(--leaf)",  bg: "var(--mint)",             etiket: "Uyarı"   },
  bilgi:  { renk: "#94a3b8",      bg: "rgba(148,163,184,0.10)",  etiket: "Bilgi"   },
  basari: { renk: "#22c55e",      bg: "rgba(34,197,94,0.10)",    etiket: "Başarı"  },
};

const MODUL_ETIKET: Record<BildirimModul, string> = {
  "stok":       "Stok",
  "nakit-akisi":"Nakit Akışı",
  "kar-zarar":  "Kar-Zarar",
  "gorevler":   "Görevler",
  "prosedurler":"Prosedürler",
  "acil-fon":   "Acil Fon",
  "sistem":     "Sistem",
  "ekip":       "Ekip",
};

const MODUL_HREF: Record<BildirimModul, string> = {
  "stok":       "/stok",
  "nakit-akisi":"/nakit-akisi",
  "kar-zarar":  "/kar-zarar",
  "gorevler":   "/gorevler",
  "prosedurler":"/prosedurler",
  "acil-fon":   "/acil-fon",
  "sistem":     "/dashboard",
  "ekip":       "/ayarlar",
};

const SESSIZ_SECENEKLER = [
  { label: "1 Saat",  dakika: 60   },
  { label: "8 Saat",  dakika: 480  },
  { label: "24 Saat", dakika: 1440 },
  { label: "Süresiz", dakika: null },
] as const;

type TarihMod  = "tumu" | "bugun" | "hafta" | "ay";
type KaynakMod = "tumu" | "sistem" | "otomatik";

interface SistemBildirim {
  id: string; baslik: string; mesaj: string;
  tip: string; hedef: string;
  admin_email: string | null; olusturma: string;
  dismissed: boolean;
}

/* Render için normalize edilmiş tek bildirim tipi */
interface UnifBildirim {
  id:          string;
  tip:         BildirimTip;
  modul:       BildirimModul;
  baslik:      string;
  mesaj:       string;
  tarih:       string;
  okundu:      boolean;
  kaynakTip:   "sistem" | "tarama" | "olay";
  ilgiliLink?: string;
  olayId?:     string;
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
function normalizeArama(metin: string) {
  return metin.toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c");
}

/* ── Sayfa ── */
export default function BildirimlerPage() {
  const {
    bildirimler, okunduYap, okunduToggle, tumunuOkunduYap, sil, tumunuSil,
    sessizModu, sessizBitis, sessizeAl, sessizModuAc,
  } = useBildirimler();

  const { rol } = useSirket();

  /* Filtre state */
  const [arama,           setArama]           = useState("");
  const [kaynak,          setKaynak]          = useState<KaynakMod>("tumu");
  const [tipFiltre,       setTipFiltre]       = useState<"tumu" | BildirimTip>("tumu");
  const [modulFiltre,     setModulFiltre]     = useState<"tumu" | BildirimModul>("tumu");
  const [sadeceOkunmayan, setSadeceOkunmayan] = useState(false);
  const [tarihMod,        setTarihMod]        = useState<TarihMod>("tumu");

  /* Dropdown state */
  const [filtreAcik,     setFiltreAcik]     = useState(false);
  const [sessizDropdown, setSessizDropdown]  = useState(false);
  const [menuAcik,       setMenuAcik]       = useState<string | null>(null);

  const filtreRef = useRef<HTMLDivElement>(null);
  const sessizRef = useRef<HTMLDivElement>(null);

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

  /* Click-outside: filtre + sessiz */
  useEffect(() => {
    function handler(e: MouseEvent) {
      const t = e.target as Node;
      if (filtreRef.current && !filtreRef.current.contains(t)) setFiltreAcik(false);
      if (sessizRef.current && !sessizRef.current.contains(t)) setSessizDropdown(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* Click-outside: 3-dot menü (stopPropagation ile kontrol edilir) */
  useEffect(() => {
    if (!menuAcik) return;
    function handler() { setMenuAcik(null); }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuAcik]);

  /* Esc */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setFiltreAcik(false); setSessizDropdown(false); setMenuAcik(null); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* Tarih aralığı */
  const { basT, bitisT } = useMemo(() => {
    const bg = trBugun();
    switch (tarihMod) {
      case "bugun": return { basT: trGunBaslangici(bg),              bitisT: trGunSonu(bg)              };
      case "hafta": return { basT: trGunBaslangici(trOncekiGun(6)),  bitisT: trGunSonu(bg)              };
      case "ay":    return { basT: trGunBaslangici(trOncekiGun(29)), bitisT: trGunSonu(bg)              };
      default:      return { basT: null, bitisT: null };
    }
  }, [tarihMod]);

  /* Normalize: sistem → UnifBildirim */
  const sistemUnif: UnifBildirim[] = useMemo(() =>
    sistemBildirimler.map((b) => ({
      id:        b.id,
      tip:       (b.tip === "kritik" ? "kritik" : "bilgi") as BildirimTip,
      modul:     "sistem" as BildirimModul,
      baslik:    b.baslik,
      mesaj:     b.mesaj,
      tarih:     b.olusturma,
      okundu:    b.dismissed,
      kaynakTip: "sistem" as const,
    })),
    [sistemBildirimler]
  );

  /* Normalize: app bildirimler → UnifBildirim */
  const appUnif: UnifBildirim[] = useMemo(() =>
    bildirimler
      .filter((b) => !b.silindi)
      .map((b) => ({
        id:          b.id,
        tip:         b.tip,
        modul:       b.modul,
        baslik:      b.baslik,
        mesaj:       b.mesaj,
        tarih:       b.tarih,
        okundu:      b.okundu,
        kaynakTip:   (b.kaynak === "tarama" ? "tarama" : "olay") as "tarama" | "olay",
        ilgiliLink:  b.ilgiliLink,
        olayId:      b.olayId,
      })),
    [bildirimler]
  );

  /* Birleşik liste (tarih sıralı) */
  const tumBildirimler: UnifBildirim[] = useMemo(
    () => [...sistemUnif, ...appUnif].sort((a, b) => new Date(b.tarih).getTime() - new Date(a.tarih).getTime()),
    [sistemUnif, appUnif]
  );

  /* Filtre uygula */
  const filtrelenmis = useMemo(() => {
    let liste: UnifBildirim[];
    if      (kaynak === "sistem")    liste = sistemUnif;
    else if (kaynak === "otomatik")  liste = appUnif.filter((b) => b.kaynakTip === "tarama");
    else                             liste = tumBildirimler;

    return liste.filter((b) => {
      if (tipFiltre    !== "tumu" && b.tip    !== tipFiltre)    return false;
      if (modulFiltre  !== "tumu" && b.modul  !== modulFiltre)  return false;
      if (sadeceOkunmayan && b.okundu) return false;
      if (basT && bitisT) { const t = new Date(b.tarih); if (t < basT || t > bitisT) return false; }
      if (arama) {
        const q = normalizeArama(arama);
        if (!normalizeArama(b.baslik).includes(q) && !normalizeArama(b.mesaj).includes(q)) return false;
      }
      return true;
    });
  }, [kaynak, sistemUnif, appUnif, tumBildirimler, tipFiltre, modulFiltre, sadeceOkunmayan, basT, bitisT, arama]);

  const okunmamis = tumBildirimler.filter((b) => !b.okundu).length;

  /* Filtre badge sayısı */
  const aktifFiltreSayisi = [
    kaynak !== "tumu",
    tipFiltre !== "tumu",
    modulFiltre !== "tumu",
    tarihMod !== "tumu",
    sadeceOkunmayan,
  ].filter(Boolean).length;

  const filtreSifirla = () => {
    setKaynak("tumu"); setTipFiltre("tumu"); setModulFiltre("tumu");
    setSadeceOkunmayan(false); setTarihMod("tumu");
  };

  const herhangiFiltre = aktifFiltreSayisi > 0 || !!arama;

  /* Aksiyon handlers */
  const handleBildirimOkundu = (b: UnifBildirim) => {
    if (b.kaynakTip === "sistem") void sistemOkunduYap(b.id);
    else okunduToggle(b.id);
    setMenuAcik(null);
  };

  const handleBildirimSil = async (b: UnifBildirim) => {
    setMenuAcik(null);
    if (b.kaynakTip === "sistem") { void sistemOkunduYap(b.id); return; }
    const { onaylandi } = await onaylaSil({ tip: "bildirim", isim: b.baslik });
    if (!onaylandi) return;
    sil(b.id);
    useGeriAl.getState().goster({
      mesaj: `"${b.baslik}" silindi.`,
      sureMs: 10000,
      geriAlFn: async () => { useBildirimler.getState().geriAl(b.id); },
    });
  };

  const handleTumunuSil = async () => {
    const { onaylandi } = await onaylaSil({ tip: "bildirim", isim: `Tüm ${appUnif.length} bildirim` });
    if (!onaylandi) return;
    tumunuSil();
  };

  const handleTumunuOkundu = () => {
    bildirimler
      .filter((b) => !b.silindi && !b.okundu && b.kaynak !== "tarama")
      .forEach((b) => okunduYap(b.id));
  };

  const uyariTamamlandiYap = (b: UnifBildirim) => {
    if (!b.olayId) return;
    manuelKapat(b.olayId);
    sil(b.id);
    toast.basari("Uyarı tamamlandı olarak işaretlendi.");
    setMenuAcik(null);
  };

  /* Ortak buton stili */
  const toolbarBtn = (aktif = false): React.CSSProperties => ({
    background: aktif ? "var(--mint)" : "var(--bg-secondary, #F9FAFB)",
    border: `1px solid ${aktif ? "var(--forest-200, #B3E8C8)" : "rgba(0,0,0,0.08)"}`,
    color: aktif ? "var(--leaf)" : "var(--text-secondary)",
  });

  /* ── Render ── */
  return (
    <div className="max-w-3xl mx-auto px-2 pb-16">

      {/* ── Hero ── */}
      <section className="py-6 flex items-start justify-between gap-4">
        <div>
          <p className="label-caps mb-2">BİLDİRİMLER</p>
          <div className="flex items-baseline gap-2">
            <span className="hero-number" style={{ color: "var(--forest)" }}>{okunmamis}</span>
            <span className="text-base" style={{ color: "var(--text-secondary)" }}>okunmamış</span>
          </div>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            {tumBildirimler.length} toplam bildirim
          </p>
        </div>
        {sessizModu && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shrink-0"
            style={{ background: "rgba(148,163,184,0.12)", border: "1px solid rgba(148,163,184,0.25)", color: "#94a3b8" }}>
            <BellOff className="w-3.5 h-3.5" />
            Sessiz: {sessizKalanSure(sessizBitis)}
          </div>
        )}
      </section>

      <hr className="section-rule" />

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 py-4 flex-wrap">

        {/* Arama */}
        <div className="relative flex-1 min-w-36 md:min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
            style={{ color: "var(--text-secondary)" }} />
          <input
            type="text"
            value={arama}
            onChange={(e) => setArama(e.target.value)}
            placeholder="Bildirimde ara..."
            className="w-full pl-9 pr-8 py-2 rounded-lg text-sm outline-none transition-colors"
            style={{ background: "var(--bg-secondary, #F9FAFB)", border: "1px solid rgba(0,0,0,0.08)", color: "var(--text-primary)" }}
          />
          {arama && (
            <button onClick={() => setArama("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
              style={{ color: "var(--text-secondary)" }}>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filtre dropdown */}
        <div ref={filtreRef} className="relative">
          <button
            onClick={() => { setFiltreAcik((p) => !p); setSessizDropdown(false); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            style={toolbarBtn(filtreAcik || aktifFiltreSayisi > 0)}>
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filtre
            {aktifFiltreSayisi > 0 && (
              <span className="w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center"
                style={{ background: "var(--leaf)", color: "#fff" }}>
                {aktifFiltreSayisi}
              </span>
            )}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${filtreAcik ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {filtreAcik && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 z-30 w-72 rounded-2xl p-4 space-y-4 shadow-xl"
                style={{ background: "var(--bg-card)", border: "1px solid rgba(0,0,0,0.08)" }}>

                {/* Kaynak */}
                <div>
                  <p className="label-caps mb-2" style={{ fontSize: 10 }}>KAYNAK</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {([
                      { v: "tumu",     label: "Tümü"      },
                      { v: "sistem",   label: "Sistem"    },
                      { v: "otomatik", label: "Otomatik"  },
                    ] as { v: KaynakMod; label: string }[]).map(({ v, label }) => (
                      <button key={v} onClick={() => setKaynak(v)}
                        className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
                        style={{
                          background: kaynak === v ? "var(--mint)"   : "rgba(0,0,0,0.04)",
                          color:      kaynak === v ? "var(--leaf)"   : "var(--text-secondary)",
                          border:     kaynak === v ? "1px solid var(--forest-200, #B3E8C8)" : "1px solid transparent",
                        }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tip */}
                <div>
                  <p className="label-caps mb-2" style={{ fontSize: 10 }}>TİP</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {([
                      { v: "tumu",   label: "Tümü",   renk: "var(--text-secondary)" },
                      { v: "kritik", label: "Kritik",  renk: "#ef4444"               },
                      { v: "uyari",  label: "Uyarı",   renk: "var(--leaf)"           },
                      { v: "bilgi",  label: "Bilgi",   renk: "#94a3b8"               },
                      { v: "basari", label: "Başarı",  renk: "#22c55e"               },
                    ] as { v: "tumu" | BildirimTip; label: string; renk: string }[]).map(({ v, label, renk }) => (
                      <button key={v} onClick={() => setTipFiltre(v)}
                        className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
                        style={{
                          background: tipFiltre === v ? `${renk}20` : "rgba(0,0,0,0.04)",
                          color:      tipFiltre === v ? renk         : "var(--text-secondary)",
                          border:     tipFiltre === v ? `1px solid ${renk}40` : "1px solid transparent",
                        }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Modül */}
                <div>
                  <p className="label-caps mb-2" style={{ fontSize: 10 }}>MODÜL</p>
                  <select
                    value={modulFiltre}
                    onChange={(e) => setModulFiltre(e.target.value as "tumu" | BildirimModul)}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{
                      background: "rgba(0,0,0,0.04)",
                      border: "1px solid rgba(0,0,0,0.08)",
                      color: modulFiltre !== "tumu" ? "var(--leaf)" : "var(--text-secondary)",
                    }}>
                    <option value="tumu">Tüm Modüller</option>
                    {(Object.keys(MODUL_ETIKET) as BildirimModul[]).map((m) => (
                      <option key={m} value={m}>{MODUL_ETIKET[m]}</option>
                    ))}
                  </select>
                </div>

                {/* Tarih */}
                <div>
                  <p className="label-caps mb-2" style={{ fontSize: 10 }}>TARİH</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {([
                      { v: "tumu",  label: "Tümü"  },
                      { v: "bugun", label: "Bugün" },
                      { v: "hafta", label: "Hafta" },
                      { v: "ay",    label: "Ay"    },
                    ] as { v: TarihMod; label: string }[]).map(({ v, label }) => (
                      <button key={v} onClick={() => setTarihMod(v)}
                        className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
                        style={{
                          background: tarihMod === v ? "var(--mint)"  : "rgba(0,0,0,0.04)",
                          color:      tarihMod === v ? "var(--leaf)"  : "var(--text-secondary)",
                          border:     tarihMod === v ? "1px solid var(--forest-200, #B3E8C8)" : "1px solid transparent",
                        }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sadece okunmayan toggle */}
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-sm" style={{ color: "var(--text-primary)" }}>
                    Sadece okunmamışları göster
                  </span>
                  <button
                    onClick={() => setSadeceOkunmayan((p) => !p)}
                    className="relative w-10 h-5 rounded-full transition-colors shrink-0"
                    style={{ background: sadeceOkunmayan ? "var(--leaf)" : "rgba(0,0,0,0.15)" }}>
                    <span
                      className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
                      style={{ left: sadeceOkunmayan ? "calc(100% - 1.125rem)" : "0.125rem" }} />
                  </button>
                </div>

                {/* Temizle */}
                {aktifFiltreSayisi > 0 && (
                  <button
                    onClick={() => { filtreSifirla(); setFiltreAcik(false); }}
                    className="w-full text-xs py-1 text-center hover:underline transition-colors"
                    style={{ color: "#ef4444" }}>
                    Filtreleri temizle
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sessize al */}
        <div ref={sessizRef} className="relative">
          {sessizModu ? (
            <button
              onClick={sessizModuAc}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ background: "rgba(148,163,184,0.1)", border: "1px solid rgba(148,163,184,0.25)", color: "#94a3b8" }}>
              <BellRing className="w-3.5 h-3.5" />
              Sesi Aç
            </button>
          ) : (
            <button
              onClick={() => { setSessizDropdown((p) => !p); setFiltreAcik(false); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              style={toolbarBtn(sessizDropdown)}>
              <BellOff className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sessize al</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${sessizDropdown ? "rotate-180" : ""}`} />
            </button>
          )}
          <AnimatePresence>
            {sessizDropdown && !sessizModu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 z-30 min-w-36 rounded-xl p-1 shadow-xl"
                style={{ background: "var(--bg-card)", border: "1px solid rgba(0,0,0,0.08)" }}>
                {SESSIZ_SECENEKLER.map(({ label, dakika }) => (
                  <button key={label}
                    onClick={() => { sessizeAl(dakika); setSessizDropdown(false); }}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors hover:text-[var(--leaf)]"
                    style={{ color: "var(--text-secondary)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--mint)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                    {label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Tümünü okundu */}
        {okunmamis > 0 && (
          <button
            onClick={handleTumunuOkundu}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            style={toolbarBtn()}>
            <CheckCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tümünü okundu</span>
          </button>
        )}
      </div>

      {/* Sessiz banner */}
      <AnimatePresence>
        {sessizModu && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center justify-between px-4 py-3 mb-4 rounded-xl"
            style={{ background: "rgba(148,163,184,0.08)", border: "1px solid rgba(148,163,184,0.2)" }}>
            <div className="flex items-center gap-2.5">
              <BellOff className="w-4 h-4" style={{ color: "#94a3b8" }} />
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  Bildirimler sessize alındı
                </p>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  {sessizBitis ? `${sessizKalanSure(sessizBitis)} — yeni bildirim gelmez` : "Süresiz"}
                </p>
              </div>
            </div>
            <button onClick={sessizModuAc}
              className="text-xs font-semibold hover:underline"
              style={{ color: "var(--leaf)" }}>
              Sesi Aç
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bildirim listesi ── */}
      {filtrelenmis.length === 0 ? (
        <div className="py-20 text-center">
          <Bell className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: "var(--text-secondary)" }} />
          {herhangiFiltre ? (
            <>
              <p className="text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
                Filtreyle eşleşen bildirim yok
              </p>
              <button
                onClick={() => { filtreSifirla(); setArama(""); }}
                className="text-xs hover:underline"
                style={{ color: "var(--leaf)" }}>
                Filtreleri sıfırla
              </button>
            </>
          ) : (
            <>
              <p className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>
                Henüz bildirim yok
              </p>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                Sistemler temiz görünüyor ✓
              </p>
            </>
          )}
        </div>
      ) : (
        <div style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
          <AnimatePresence mode="popLayout">
            {filtrelenmis.map((b) => {
              const cfg     = TIP_CONFIG[b.tip] ?? TIP_CONFIG.bilgi;
              const menuAcikBu = menuAcik === b.id;

              return (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                  transition={{ duration: 0.15 }}
                  className="group relative flex items-start gap-3 py-3 px-2 rounded-lg transition-colors"
                  style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.02)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>

                  {/* Tip noktası */}
                  <span
                    className="shrink-0 w-2 h-2 rounded-full mt-[7px]"
                    style={{ background: cfg.renk, opacity: b.okundu ? 0.3 : 1 }}
                  />

                  {/* İçerik */}
                  <div className="flex-1 min-w-0">
                    {/* Başlık + zaman */}
                    <div className="flex items-start gap-2 justify-between">
                      <p
                        className="text-sm leading-snug"
                        style={{
                          color:      b.okundu ? "var(--text-secondary)" : "var(--text-primary)",
                          fontWeight: b.okundu ? 400 : 500,
                          opacity:    b.okundu ? 0.75 : 1,
                        }}>
                        {b.baslik}
                      </p>
                      <span className="text-[11px] whitespace-nowrap shrink-0 mt-0.5"
                        style={{ color: "var(--text-secondary)" }}>
                        {zaman(b.tarih)}
                      </span>
                    </div>

                    {/* Mesaj */}
                    <p className="text-xs mt-0.5 line-clamp-2"
                      style={{ color: "var(--text-secondary)" }}>
                      {b.mesaj}
                    </p>

                    {/* Tip + Modül pills */}
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={{ background: cfg.bg, color: cfg.renk }}>
                        {cfg.etiket}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(0,0,0,0.05)", color: "var(--text-secondary)" }}>
                        {MODUL_ETIKET[b.modul]}
                      </span>
                      {b.kaynakTip === "sistem" && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1"
                          style={{ background: "var(--mint)", color: "var(--leaf)" }}>
                          <Shield className="w-2.5 h-2.5" />Sistem
                        </span>
                      )}
                    </div>

                    {/* Hover link */}
                    <div className="flex items-center gap-3 mt-1.5 h-0 overflow-hidden group-hover:h-auto group-hover:mt-1.5 transition-all">
                      {b.ilgiliLink ? (
                        <Link
                          href={b.ilgiliLink}
                          onClick={() => { if (b.kaynakTip !== "sistem") okunduYap(b.id); }}
                          className="text-xs font-medium hover:underline transition-colors"
                          style={{ color: "var(--leaf)" }}>
                          Şimdi düzelt →
                        </Link>
                      ) : b.kaynakTip !== "sistem" ? (
                        <Link
                          href={MODUL_HREF[b.modul] ?? "/bildirimler"}
                          onClick={() => okunduYap(b.id)}
                          className="text-xs font-medium hover:underline transition-colors"
                          style={{ color: "var(--leaf)" }}>
                          Modüle git →
                        </Link>
                      ) : null}
                    </div>
                  </div>

                  {/* 3-nokta menü */}
                  <div
                    className="relative shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onMouseDown={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => { e.stopPropagation(); setMenuAcik(menuAcikBu ? null : b.id); }}
                      className="w-7 h-7 flex items-center justify-center rounded-md transition-colors"
                      style={{ color: "var(--text-secondary)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.06)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    <AnimatePresence>
                      {menuAcikBu && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -4 }}
                          transition={{ duration: 0.12 }}
                          onMouseDown={(e) => e.stopPropagation()}
                          className="absolute right-0 top-full mt-1 z-40 min-w-44 rounded-xl p-1 shadow-xl"
                          style={{ background: "var(--bg-card)", border: "1px solid rgba(0,0,0,0.08)" }}>

                          {/* Okundu / Okunmadı */}
                          {(b.kaynakTip !== "sistem" || !b.okundu) && (
                            <MenuSatir
                              onClick={() => handleBildirimOkundu(b)}
                              icon={b.okundu ? <Circle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                              label={b.okundu ? "Okunmadı işaretle" : "Okundu işaretle"}
                            />
                          )}

                          {/* İlgili sayfa */}
                          {b.ilgiliLink && (
                            <Link
                              href={b.ilgiliLink}
                              onClick={() => { if (b.kaynakTip !== "sistem") okunduYap(b.id); setMenuAcik(null); }}
                              className="w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors"
                              style={{ color: "var(--text-primary)", display: "flex" }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.04)")}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                              <ExternalLink className="w-3.5 h-3.5" />
                              İlgili sayfaya git
                            </Link>
                          )}

                          {/* Tamamlandı (sadece uyarılar için) */}
                          {b.kaynakTip === "tarama" && b.olayId && (
                            <MenuSatir
                              onClick={() => uyariTamamlandiYap(b)}
                              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                              label="Tamamlandı"
                            />
                          )}

                          {/* Sil */}
                          {b.kaynakTip !== "sistem" && (
                            <MenuSatir
                              onClick={() => handleBildirimSil(b)}
                              icon={<Trash2 className="w-3.5 h-3.5" />}
                              label="Sil"
                              tehlikeli
                            />
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Tümünü sil */}
      {appUnif.length > 0 && (
        <div className="pt-8 flex justify-center">
          <button
            onClick={handleTumunuSil}
            className="text-xs hover:underline transition-colors"
            style={{ color: "#ef4444" }}>
            Tümünü sil
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Menü satır yardımcı ── */
function MenuSatir({
  onClick, icon, label, tehlikeli = false,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  tehlikeli?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors"
      style={{ color: tehlikeli ? "#ef4444" : "var(--text-primary)" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = tehlikeli ? "rgba(239,68,68,0.06)" : "rgba(0,0,0,0.04)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
      {icon}
      {label}
    </button>
  );
}
