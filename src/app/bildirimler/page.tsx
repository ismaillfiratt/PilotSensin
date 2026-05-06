"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCheck, Trash2, AlertTriangle, Info, ExternalLink, CheckCircle2, Circle } from "lucide-react";
import Link from "next/link";
import { useBildirimler, type BildirimTip, type BildirimModul } from "@/store/bildirimler";

const TIP_CONFIG: Record<BildirimTip, { renk: string; bg: string; etiket: string }> = {
  kritik: { renk: "#ef4444", bg: "rgba(239,68,68,0.12)", etiket: "Kritik" },
  uyari:  { renk: "#fbc024", bg: "rgba(251,192,36,0.12)", etiket: "Uyarı"  },
  bilgi:  { renk: "#94a3b8", bg: "rgba(148,163,184,0.12)", etiket: "Bilgi" },
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

type Filtre = "tumu" | BildirimTip;

function zaman(iso: string) {
  const fark = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (fark < 1)    return "Az önce";
  if (fark < 60)   return `${fark}dk önce`;
  if (fark < 1440) return `${Math.floor(fark / 60)}sa önce`;
  return `${Math.floor(fark / 1440)}g önce`;
}

export default function BildirimlerPage() {
  const { bildirimler, okunduYap, okunduToggle, tumunuOkunduYap, sil, tumunuSil } = useBildirimler();
  const [filtre, setFiltre] = useState<Filtre>("tumu");

  const filtrelenmis = bildirimler.filter(
    (b) => filtre === "tumu" || b.tip === filtre
  );

  const okunmamis        = bildirimler.filter((b) => !b.okundu).length;
  const filtredeOkunmamis = filtrelenmis.filter((b) => !b.okundu).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Başlık */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Bildirimler</h1>
          <p className="text-sm text-[#94a3b8] mt-1">
            {okunmamis > 0
              ? `${okunmamis} okunmamış bildirim`
              : "Tüm bildirimler okundu"}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {bildirimler.length > 0 && (
            <button
              onClick={tumunuOkunduYap}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.25)] text-[#22c55e] text-xs font-bold hover:bg-[rgba(34,197,94,0.18)] transition-all"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Tümünü Okundu İşaretle
            </button>
          )}
          {bildirimler.length > 0 && (
            <button
              onClick={tumunuSil}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[rgba(239,68,68,0.2)] text-[#ef4444] text-xs font-medium hover:bg-[rgba(239,68,68,0.08)] transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Tümünü Temizle
            </button>
          )}
        </div>
      </div>

      {/* Filtre */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] w-fit">
        {([
          { v: "tumu",   label: "Tümü",   count: bildirimler.length },
          { v: "kritik", label: "Kritik", count: bildirimler.filter((b) => b.tip === "kritik").length },
          { v: "uyari",  label: "Uyarı",  count: bildirimler.filter((b) => b.tip === "uyari").length  },
          { v: "bilgi",  label: "Bilgi",  count: bildirimler.filter((b) => b.tip === "bilgi").length  },
        ] as { v: Filtre; label: string; count: number }[]).map(({ v, label, count }) => {
          const renk = v === "kritik" ? "#ef4444" : v === "uyari" ? "#fbc024" : "#94a3b8";
          return (
            <button
              key={v}
              onClick={() => setFiltre(v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                backgroundColor: filtre === v ? `${renk}20` : "transparent",
                color:           filtre === v ? renk : "#94a3b8",
                border:          filtre === v ? `1px solid ${renk}40` : "1px solid transparent",
              }}
            >
              {label}
              <span className="text-[10px] opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Filtredeki okunmamışlar için hızlı toplu aksiyon */}
      {filtredeOkunmamis > 0 && filtre !== "tumu" && (
        <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[rgba(34,197,94,0.06)] border border-[rgba(34,197,94,0.15)]">
          <p className="text-xs text-[#94a3b8]">
            Bu filtrede <span className="text-white font-semibold">{filtredeOkunmamis}</span> okunmamış bildirim var
          </p>
          <button
            onClick={() => filtrelenmis.filter((b) => !b.okundu).forEach((b) => okunduYap(b.id))}
            className="flex items-center gap-1.5 text-xs text-[#22c55e] font-semibold hover:underline"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Filtredekini okundu say
          </button>
        </div>
      )}

      {/* Liste */}
      <div className="space-y-2">
        {filtrelenmis.length === 0 ? (
          <div className="glass-card rounded-2xl py-16 text-center">
            <Bell className="w-10 h-10 text-[#94a3b8] mx-auto mb-3 opacity-40" />
            <p className="text-sm text-[#94a3b8]">Bildirim yok</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filtrelenmis.map((b, i) => {
              const cfg  = TIP_CONFIG[b.tip];
              const Icon = b.tip === "bilgi" ? Info : AlertTriangle;

              return (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                  className="glass-card rounded-xl overflow-hidden"
                  style={{ borderColor: !b.okundu ? `${cfg.renk}30` : undefined }}
                >
                  <div className="flex items-start gap-4 px-5 py-4">
                    {/* Tip ikonu */}
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ backgroundColor: cfg.bg }}
                    >
                      <Icon className="w-4 h-4" style={{ color: cfg.renk }} />
                    </div>

                    {/* İçerik */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`text-sm font-semibold ${b.okundu ? "text-[#94a3b8]" : "text-white"}`}>
                            {b.baslik}
                          </p>
                          {!b.okundu && (
                            <span className="w-2 h-2 rounded-full bg-[#fbc024] shrink-0 animate-pulse" />
                          )}
                          <span
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                            style={{ color: cfg.renk, backgroundColor: cfg.bg }}
                          >
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

                    {/* Aksiyonlar */}
                    <div className="flex items-center gap-1 shrink-0 ml-1">
                      {/* Okundu toggle butonu */}
                      <button
                        onClick={() => okunduToggle(b.id)}
                        title={b.okundu ? "Okunmadı olarak işaretle" : "Okundu olarak işaretle"}
                        className="group flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all"
                        style={
                          b.okundu
                            ? { color: "#22c55e", borderColor: "rgba(34,197,94,0.25)", backgroundColor: "rgba(34,197,94,0.08)" }
                            : { color: "#94a3b8", borderColor: "rgba(255,255,255,0.08)", backgroundColor: "transparent" }
                        }
                      >
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

                      {/* Modüle git */}
                      <Link
                        href={MODUL_HREF[b.modul]}
                        onClick={() => okunduYap(b.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-[#94a3b8] hover:text-[#fbc024] hover:bg-[rgba(251,192,36,0.08)] transition-all"
                        title="Modüle git"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>

                      {/* Sil */}
                      <button
                        onClick={() => sil(b.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-[#94a3b8] hover:text-[#ef4444] hover:bg-[rgba(239,68,68,0.08)] transition-all"
                        title="Sil"
                      >
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
