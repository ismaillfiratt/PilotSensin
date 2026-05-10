"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, CheckCheck, Trash2, AlertTriangle, Info,
  ExternalLink, CheckCircle2, Circle, BellOff, BellRing,
  ChevronDown, Filter,
} from "lucide-react";
import Link from "next/link";
import { useBildirimler, type BildirimTip, type BildirimModul } from "@/store/bildirimler";

/* ── Sabitler ─────────────────────────────────────────────────────── */
const TIP_CONFIG: Record<BildirimTip, { renk: string; bg: string; etiket: string }> = {
  kritik: { renk: "#ef4444", bg: "rgba(239,68,68,0.12)",   etiket: "Kritik" },
  uyari:  { renk: "#fbc024", bg: "rgba(251,192,36,0.12)",  etiket: "Uyarı"  },
  bilgi:  { renk: "#94a3b8", bg: "rgba(148,163,184,0.12)", etiket: "Bilgi"  },
};

const MODUL_ETIKET: Record<BildirimModul, string> = {
  "stok":        "Stok",
  "nakit-akisi": "Nakit Akışı",
  "kar-zarar":   "Kar-Zarar",
  "gorevler":    "Görevler",
  "prosedurler": "Prosedürler",
  "acil-fon":    "Acil Fon",
  "sistem":      "Sistem",
};

const MODUL_HREF: Record<BildirimModul, string> = {
  "stok":        "/stok",
  "nakit-akisi": "/nakit-akisi",
  "kar-zarar":   "/kar-zarar",
  "gorevler":    "/gorevler",
  "prosedurler": "/prosedurler",
  "acil-fon":    "/acil-fon",
  "sistem":      "/dashboard",
};

const SESSIZ_SECENEKLER = [
  { label: "1 Saat",  dakika: 60        },
  { label: "8 Saat",  dakika: 480       },
  { label: "24 Saat", dakika: 1440      },
  { label: "Süresiz", dakika: null      },
] as const;

/* ── Yardımcılar ──────────────────────────────────────────────────── */
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
  if (kalan < 60) return `${kalan} dk kaldı`;
  return `${Math.ceil(kalan / 60)} saat kaldı`;
}

/* ── Sayfa ─────────────────────────────────────────────────────────── */
export default function BildirimlerPage() {
  const {
    bildirimler, okunduYap, okunduToggle, tumunuOkunduYap, sil, tumunuSil,
    sessizModu, sessizBitis, sessizeAl, sessizModuAc,
  } = useBildirimler();

  /* Filtre durumları */
  const [tipFiltre,     setTipFiltre]     = useState<"tumu" | BildirimTip>("tumu");
  const [modulFiltre,   setModulFiltre]   = useState<"tumu" | BildirimModul>("tumu");
  const [sadeceokunmayan, setSadeceOkunmayan] = useState(false);

  /* Sessiz mod dropdown */
  const [sessizAcik, setSessizAcik] = useState(false);

  /* Filtrelenmiş liste */
  const filtrelenmis = useMemo(() => {
    return bildirimler.filter((b) => {
      if (tipFiltre !== "tumu" && b.tip !== tipFiltre) return false;
      if (modulFiltre !== "tumu" && b.modul !== modulFiltre) return false;
      if (sadeceokunmayan && b.okundu) return false;
      return true;
    });
  }, [bildirimler, tipFiltre, modulFiltre, sadeceokunmayan]);

  const okunmamis         = bildirimler.filter((b) => !b.okundu).length;
  const filtredeOkunmamis = filtrelenmis.filter((b) => !b.okundu).length;

  const herhangiFiltre = tipFiltre !== "tumu" || modulFiltre !== "tumu" || sadeceokunmayan;

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* ── Başlık ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Bildirimler</h1>
          <p className="text-sm text-[#94a3b8] mt-1">
            {okunmamis > 0 ? `${okunmamis} okunmamış bildirim` : "Tüm bildirimler okundu"}
          </p>
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          {bildirimler.length > 0 && (
            <button onClick={tumunuOkunduYap}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.25)] text-[#22c55e] text-xs font-bold hover:bg-[rgba(34,197,94,0.18)] transition-all">
              <CheckCheck className="w-3.5 h-3.5" />
              Tümünü Okundu İşaretle
            </button>
          )}
          {bildirimler.length > 0 && (
            <button onClick={tumunuSil}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[rgba(239,68,68,0.2)] text-[#ef4444] text-xs font-medium hover:bg-[rgba(239,68,68,0.08)] transition-all">
              <Trash2 className="w-3.5 h-3.5" />
              Temizle
            </button>
          )}

          {/* Sessiz mod butonu */}
          <div className="relative">
            {sessizModu ? (
              <button onClick={() => { sessizModuAc(); setSessizAcik(false); }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[rgba(148,163,184,0.12)] border border-[rgba(148,163,184,0.3)] text-[#94a3b8] text-xs font-medium hover:bg-[rgba(148,163,184,0.2)] transition-all">
                <BellRing className="w-3.5 h-3.5" />
                Sesi Aç
                <span className="text-[10px] text-[#64748b]">({sessizKalanSure(sessizBitis)})</span>
              </button>
            ) : (
              <button onClick={() => setSessizAcik(!sessizAcik)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[rgba(255,255,255,0.1)] text-[#94a3b8] text-xs font-medium hover:bg-[rgba(255,255,255,0.05)] transition-all">
                <BellOff className="w-3.5 h-3.5" />
                Sessize Al
                <ChevronDown className="w-3 h-3" />
              </button>
            )}

            {/* Sessize alma dropdown */}
            <AnimatePresence>
              {sessizAcik && !sessizModu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 z-20 min-w-40 glass-card rounded-xl p-1 shadow-xl"
                >
                  {SESSIZ_SECENEKLER.map(({ label, dakika }) => (
                    <button key={label}
                      onClick={() => { sessizeAl(dakika); setSessizAcik(false); }}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm text-[#94a3b8] hover:bg-[rgba(255,255,255,0.06)] hover:text-white transition-colors">
                      {label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Sessiz mod banner ── */}
      <AnimatePresence>
        {sessizModu && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center justify-between px-4 py-3 rounded-xl bg-[rgba(148,163,184,0.08)] border border-[rgba(148,163,184,0.2)]">
            <div className="flex items-center gap-2.5">
              <BellOff className="w-4 h-4 text-[#94a3b8]" />
              <div>
                <p className="text-sm font-medium text-white">Bildirimler sessize alındı</p>
                <p className="text-xs text-[#64748b]">
                  {sessizBitis
                    ? `${sessizKalanSure(sessizBitis)} — yeni otomatik bildirim gelmez`
                    : "Süresiz — yeni otomatik bildirim gelmez"}
                </p>
              </div>
            </div>
            <button onClick={sessizModuAc}
              className="text-xs text-[#fbc024] font-semibold hover:underline whitespace-nowrap">
              Sesi Aç
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Filtreler ── */}
      <div className="space-y-3">
        {/* Tip filtresi + Okunmayanlar */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)]">
            {([
              { v: "tumu",   label: "Tümü",   count: bildirimler.length },
              { v: "kritik", label: "Kritik", count: bildirimler.filter((b) => b.tip === "kritik").length },
              { v: "uyari",  label: "Uyarı",  count: bildirimler.filter((b) => b.tip === "uyari").length  },
              { v: "bilgi",  label: "Bilgi",  count: bildirimler.filter((b) => b.tip === "bilgi").length  },
            ] as { v: "tumu" | BildirimTip; label: string; count: number }[]).map(({ v, label, count }) => {
              const renk = v === "kritik" ? "#ef4444" : v === "uyari" ? "#fbc024" : "#94a3b8";
              return (
                <button key={v} onClick={() => setTipFiltre(v)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    backgroundColor: tipFiltre === v ? `${renk}20` : "transparent",
                    color:           tipFiltre === v ? renk : "#94a3b8",
                    border:          tipFiltre === v ? `1px solid ${renk}40` : "1px solid transparent",
                  }}>
                  {label}
                  <span className="text-[10px] opacity-70">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Okunmayanlar toggle */}
          <button onClick={() => setSadeceOkunmayan(!sadeceokunmayan)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all"
            style={{
              borderColor:     sadeceokunmayan ? "#fbc024" : "rgba(255,255,255,0.1)",
              backgroundColor: sadeceokunmayan ? "rgba(251,192,36,0.12)" : "transparent",
              color:           sadeceokunmayan ? "#fbc024" : "#94a3b8",
            }}>
            <Circle className="w-3 h-3" />
            Okunmayanlar
            {okunmamis > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                style={{ backgroundColor: "rgba(251,192,36,0.2)", color: "#fbc024" }}>
                {okunmamis}
              </span>
            )}
          </button>
        </div>

        {/* Modül filtresi */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-[#64748b] shrink-0" />
          <select value={modulFiltre} onChange={(e) => setModulFiltre(e.target.value as "tumu" | BildirimModul)}
            className="px-2.5 py-1.5 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-xs text-[#94a3b8] focus:outline-none focus:border-[rgba(251,192,36,0.4)] transition-colors">
            <option value="tumu"        className="bg-[#0e172a]">Tüm Modüller</option>
            <option value="stok"        className="bg-[#0e172a]">Stok</option>
            <option value="nakit-akisi" className="bg-[#0e172a]">Nakit Akışı</option>
            <option value="gorevler"    className="bg-[#0e172a]">Görevler</option>
            <option value="prosedurler" className="bg-[#0e172a]">Prosedürler</option>
            <option value="acil-fon"    className="bg-[#0e172a]">Acil Fon</option>
            <option value="kar-zarar"   className="bg-[#0e172a]">Kar-Zarar</option>
            <option value="sistem"      className="bg-[#0e172a]">Sistem</option>
          </select>

          {herhangiFiltre && (
            <button onClick={() => { setTipFiltre("tumu"); setModulFiltre("tumu"); setSadeceOkunmayan(false); }}
              className="text-xs text-[#64748b] hover:text-[#ef4444] transition-colors">
              Filtreleri temizle
            </button>
          )}
        </div>
      </div>

      {/* Toplu aksiyon (filtrede okunmamış varsa) */}
      {filtredeOkunmamis > 0 && herhangiFiltre && (
        <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[rgba(34,197,94,0.06)] border border-[rgba(34,197,94,0.15)]">
          <p className="text-xs text-[#94a3b8]">
            <span className="text-white font-semibold">{filtredeOkunmamis}</span> okunmamış bildirim
          </p>
          <button onClick={() => filtrelenmis.filter((b) => !b.okundu).forEach((b) => okunduYap(b.id))}
            className="flex items-center gap-1.5 text-xs text-[#22c55e] font-semibold hover:underline">
            <CheckCheck className="w-3.5 h-3.5" />
            Filtredekini okundu say
          </button>
        </div>
      )}

      {/* ── Bildirim listesi ── */}
      <div className="space-y-2">
        {filtrelenmis.length === 0 ? (
          <div className="glass-card rounded-2xl py-16 text-center">
            <Bell className="w-10 h-10 text-[#94a3b8] mx-auto mb-3 opacity-40" />
            <p className="text-sm text-[#94a3b8]">
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
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                  className="glass-card rounded-xl overflow-hidden"
                  style={{ borderColor: !b.okundu ? `${cfg.renk}30` : undefined }}>
                  <div className="flex items-start gap-4 px-5 py-4">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ backgroundColor: cfg.bg }}>
                      <Icon className="w-4 h-4" style={{ color: cfg.renk }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`text-sm font-semibold ${b.okundu ? "text-[#94a3b8]" : "text-white"}`}>
                            {b.baslik}
                          </p>
                          {!b.okundu && (
                            <span className="w-2 h-2 rounded-full bg-[#fbc024] shrink-0 animate-pulse" />
                          )}
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                            style={{ color: cfg.renk, backgroundColor: cfg.bg }}>
                            {cfg.etiket}
                          </span>
                          <span className="text-[10px] text-[#94a3b8] px-1.5 py-0.5 rounded bg-[rgba(255,255,255,0.04)]">
                            {MODUL_ETIKET[b.modul]}
                          </span>
                        </div>
                        <span className="text-[11px] text-[#94a3b8] shrink-0 whitespace-nowrap">
                          {zaman(b.tarih)}
                        </span>
                      </div>
                      <p className="text-xs text-[#94a3b8] mt-1 leading-relaxed">{b.mesaj}</p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-1">
                      <button onClick={() => okunduToggle(b.id)}
                        title={b.okundu ? "Okunmadı olarak işaretle" : "Okundu olarak işaretle"}
                        className="group flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all"
                        style={b.okundu
                          ? { color: "#22c55e", borderColor: "rgba(34,197,94,0.25)", backgroundColor: "rgba(34,197,94,0.08)" }
                          : { color: "#94a3b8", borderColor: "rgba(255,255,255,0.08)", backgroundColor: "transparent" }}>
                        {b.okundu ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span className="group-hover:hidden">Okundu</span>
                            <span className="hidden group-hover:inline text-[#fbc024]">Geri Al</span>
                          </>
                        ) : (
                          <>
                            <Circle className="w-3.5 h-3.5" />
                            Okundu
                          </>
                        )}
                      </button>

                      <Link href={b.ilgiliLink ?? MODUL_HREF[b.modul]}
                        onClick={() => okunduYap(b.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-[#94a3b8] hover:text-[#fbc024] hover:bg-[rgba(251,192,36,0.08)] transition-all"
                        title="Modüle git">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>

                      <button onClick={() => sil(b.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-[#94a3b8] hover:text-[#ef4444] hover:bg-[rgba(239,68,68,0.08)] transition-all"
                        title="Sil">
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
    </div>
  );
}
