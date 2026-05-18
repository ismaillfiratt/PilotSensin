"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { onaylaSil } from "@/lib/onay";
import { useGeriAl } from "@/store/geriAl";
import {
  Plus, Pencil, Trash2,
  TrendingUp, TrendingDown, Search, X,
  ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownRight,
  Wallet, CalendarDays,
} from "lucide-react";
import { formatTL, type Islem } from "@/lib/nakit-data";
import type { Kurus } from "@/lib/para";
import { useNakit } from "@/store/nakit";
import IslemModal from "./IslemModal";
import { toast } from "@/store/toast";

/* ─── Yardımcılar ─── */
function yerelTarih(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function bugunIso()       { return yerelTarih(new Date()); }
function otuzGunOnceIso() { const d = new Date(); d.setDate(d.getDate() - 30); return yerelTarih(d); }

function tarihEtiket(iso: string) {
  const d = new Date(iso);
  const bugun = new Date();
  const dun   = new Date(); dun.setDate(bugun.getDate() - 1);
  const ayniGun = (a: Date, b: Date) =>
    a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();

  if (ayniGun(d, bugun)) return "Bugün " + d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  if (ayniGun(d, dun))   return "Dün "   + d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })
    + " " + d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

const odemeRenk: Record<string, string> = {
  nakit: "#22c55e", kart: "#fbc024", havale: "#94a3b8", cek: "#a78bfa",
};
const odemeEmoji: Record<string, string> = {
  nakit: "💵", kart: "💳", havale: "🏦", cek: "📄",
};

type DonemTip = "bugun" | "hafta" | "ay" | "tumu" | "ozel";

const DONEMLER: { v: DonemTip; label: string }[] = [
  { v: "bugun", label: "Bugün"    },
  { v: "hafta", label: "Bu Hafta" },
  { v: "ay",    label: "Bu Ay"    },
  { v: "tumu",  label: "Tümü"     },
  { v: "ozel",  label: "Özel"     },
];

const SAYFA_BOYUTU = 12;

interface Props { otomatikAcilModal?: "gelir" | "gider" | null; }

export default function IslemTablosu({ otomatikAcilModal }: Props) {
  const router = useRouter();
  const { islemler, ekle, guncelle, sil } = useNakit();

  const [arama,       setArama]       = useState("");
  const [tipFiltre,   setTipFiltre]   = useState<"tumu" | "gelir" | "gider">("tumu");
  const [donem,       setDonem]       = useState<DonemTip>("ay");
  const [ozelBas,     setOzelBas]     = useState(otuzGunOnceIso());
  const [ozelBit,     setOzelBit]     = useState(bugunIso());
  const [sayfa,       setSayfa]       = useState(1);
  const [modalAcik,   setModalAcik]   = useState(false);
  const [otomatikTip, setOtomatikTip] = useState<"gelir" | "gider" | undefined>();
  const [duzenle,     setDuzenle]     = useState<Islem | null>(null);
  const [, setSilOnayi]    = useState<Islem | null>(null);

  useEffect(() => {
    if (otomatikAcilModal === "gelir" || otomatikAcilModal === "gider") {
      setOtomatikTip(otomatikAcilModal);
      setModalAcik(true);
      router.replace("/nakit-akisi");
    }
  }, [otomatikAcilModal, router]);

  /* ─── Tarih aralığı hesapla ─── */
  const { bas, bit } = useMemo(() => {
    const simdi = new Date();
    let bas: Date, bit: Date;
    if (donem === "bugun") {
      bas = new Date(simdi.getFullYear(), simdi.getMonth(), simdi.getDate(), 0, 0, 0, 0);
      bit = new Date(simdi.getFullYear(), simdi.getMonth(), simdi.getDate(), 23, 59, 59, 999);
    } else if (donem === "hafta") {
      const gun = simdi.getDay() === 0 ? 6 : simdi.getDay() - 1;
      bas = new Date(simdi); bas.setDate(simdi.getDate() - gun); bas.setHours(0, 0, 0, 0);
      bit = new Date(simdi); bit.setHours(23, 59, 59, 999);
    } else if (donem === "ay") {
      bas = new Date(simdi.getFullYear(), simdi.getMonth(), 1, 0, 0, 0, 0);
      bit = new Date(simdi); bit.setHours(23, 59, 59, 999);
    } else if (donem === "ozel") {
      bas = new Date(ozelBas); bas.setHours(0, 0, 0, 0);
      bit = new Date(ozelBit); bit.setHours(23, 59, 59, 999);
    } else {
      bas = new Date(0);
      bit = new Date(simdi); bit.setHours(23, 59, 59, 999);
    }
    return { bas, bit };
  }, [donem, ozelBas, ozelBit]);

  /* ─── Filtrele ─── */
  const filtrelenmis = useMemo(() => {
    return islemler
      .filter((i) => {
        const t = new Date(i.tarih);
        const aramaUyum = arama === "" ||
          i.aciklama.toLowerCase().includes(arama.toLowerCase()) ||
          i.kategori.toLowerCase().includes(arama.toLowerCase());
        const tipUyum   = tipFiltre === "tumu" || i.tip === tipFiltre;
        const tarihUyum = t >= bas && t <= bit;
        return aramaUyum && tipUyum && tarihUyum;
      })
      .sort((a, b) => new Date(b.tarih).getTime() - new Date(a.tarih).getTime());
  }, [islemler, arama, tipFiltre, bas, bit]);

  useEffect(() => { setSayfa(1); }, [arama, tipFiltre, donem, ozelBas, ozelBit]);

  /* ─── Özet hesapla ─── */
  const ozet = useMemo(() => {
    const gelirKurus = filtrelenmis.filter(i => i.tip === "gelir").reduce((s, i) => s + i.tutarKurus, 0);
    const giderKurus = filtrelenmis.filter(i => i.tip === "gider").reduce((s, i) => s + i.tutarKurus, 0);
    return { gelirKurus, giderKurus, netKurus: gelirKurus - giderKurus };
  }, [filtrelenmis]);

  const toplamSayfa       = Math.max(1, Math.ceil(filtrelenmis.length / SAYFA_BOYUTU));
  const sayfadakiIslemler = filtrelenmis.slice((sayfa - 1) * SAYFA_BOYUTU, sayfa * SAYFA_BOYUTU);

  const handleKaydet = async (yeni: Omit<Islem, "id">) => {
    if (duzenle) { await guncelle(duzenle.id, yeni); setDuzenle(null); }
    else          { await ekle(yeni); }
  };

  const handleSil = async (islem: Islem) => {
    const { onaylandi } = await onaylaSil({
      tip: "nakitIslem",
      isim: `${islem.kategori} — ${formatTL(islem.tutarKurus)}`,
    });
    if (!onaylandi) return;
    await sil(islem.id);
    setSilOnayi(null);
    useGeriAl.getState().goster({
      mesaj: `${islem.kategori} işlemi silindi.`,
      sureMs: 10000,
      geriAlFn: async () => useNakit.getState().geriAl(islem.id),
    });
  };

  return (
    <>
      <div className="space-y-4">

        {/* ─── Özet Bar ─── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Gelir",   tutarKurus: ozet.gelirKurus, renk: "#22c55e", bg: "rgba(34,197,94,0.08)",   border: "rgba(34,197,94,0.15)",  Icon: ArrowUpRight },
            { label: "Gider",   tutarKurus: ozet.giderKurus, renk: "#ef4444", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.15)",  Icon: ArrowDownRight },
            { label: "Net",     tutarKurus: ozet.netKurus,   renk: ozet.netKurus >= 0 ? "#22c55e" : "#ef4444",
              bg: ozet.netKurus >= 0 ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
              border: ozet.netKurus >= 0 ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
              Icon: Wallet },
          ].map(({ label, tutarKurus, renk, bg, border, Icon }) => (
            <div key={label} className="rounded-2xl p-4 flex items-center gap-3"
              style={{ background: bg, border: `1px solid ${border}` }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${renk}20`, border: `1px solid ${renk}30` }}>
                <Icon className="w-4.5 h-4.5" style={{ color: renk }} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-[#64748b] uppercase tracking-wider">{label}</p>
                <p className="text-sm font-bold truncate" style={{ color: renk }}>
                  {tutarKurus >= 0 ? "" : "-"}{formatTL(Math.abs(tutarKurus))}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ─── Filtreler + Ekle ─── */}
        <div className="flex flex-col gap-3">
          {/* Üst satır: dönem chipleri + ekle */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {/* Dönem chipleri */}
            <div className="overflow-x-auto flex gap-1 p-1 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)]">
              {DONEMLER.map(({ v, label }) => (
                <button key={v} onClick={() => setDonem(v)}
                  className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    backgroundColor: donem === v ? "rgba(251,192,36,0.15)" : "transparent",
                    color:           donem === v ? "#fbc024" : "#64748b",
                    border:          donem === v ? "1px solid rgba(251,192,36,0.3)" : "1px solid transparent",
                  }}>
                  {label}
                </button>
              ))}
            </div>

            {/* Tip filtresi + Ekle */}
            <div className="flex items-center gap-2">
              <div className="flex gap-1 p-1 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)]">
                {([
                  { v: "tumu",  label: "Tümü",  renk: "#94a3b8" },
                  { v: "gelir", label: "Gelir", renk: "#22c55e" },
                  { v: "gider", label: "Gider", renk: "#ef4444" },
                ] as const).map(({ v, label, renk }) => (
                  <button key={v} onClick={() => setTipFiltre(v)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{
                      backgroundColor: tipFiltre === v ? `${renk}18` : "transparent",
                      color:           tipFiltre === v ? renk : "#64748b",
                      border:          tipFiltre === v ? `1px solid ${renk}40` : "1px solid transparent",
                    }}>
                    {label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => { setDuzenle(null); setModalAcik(true); }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#fbc024] text-[#0e172a] text-sm font-bold hover:bg-[#d9a61f] active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                İşlem Ekle
              </button>
            </div>
          </div>

          {/* Özel tarih seçici */}
          <AnimatePresence>
            {donem === "ozel" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }}
                style={{ overflow: "hidden" }}
              >
                <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl border border-[rgba(251,192,36,0.2)] bg-[rgba(251,192,36,0.04)]">
                  <CalendarDays className="w-4 h-4 text-[#fbc024] shrink-0" />
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-[#94a3b8] whitespace-nowrap">Başlangıç</label>
                    <input type="date" value={ozelBas} max={ozelBit}
                      onChange={(e) => setOzelBas(e.target.value)}
                      className="px-3 py-1.5 rounded-lg text-xs text-white border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)] focus:outline-none focus:border-[rgba(251,192,36,0.4)] scheme-dark" />
                  </div>
                  <span className="text-[#475569]">—</span>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-[#94a3b8] whitespace-nowrap">Bitiş</label>
                    <input type="date" value={ozelBit} min={ozelBas} max={bugunIso()}
                      onChange={(e) => setOzelBit(e.target.value)}
                      className="px-3 py-1.5 rounded-lg text-xs text-white border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)] focus:outline-none focus:border-[rgba(251,192,36,0.4)] scheme-dark" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Arama */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]" />
            <input
              type="text" placeholder="İşlem veya kategori ara…"
              value={arama} onChange={(e) => setArama(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] text-white placeholder-[#475569] text-sm focus:outline-none focus:border-[rgba(251,192,36,0.3)] transition-colors"
            />
            {arama && (
              <button onClick={() => setArama("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#475569] hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* ─── Liste ─── */}
        <div className="glass-card rounded-2xl overflow-hidden">
          {filtrelenmis.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] flex items-center justify-center mx-auto">
                {arama ? <Search className="w-6 h-6 text-[#334155]" /> : <Wallet className="w-6 h-6 text-[#334155]" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#64748b]">
                  {arama ? `"${arama}" için sonuç yok` : "Bu dönemde işlem yok"}
                </p>
                <p className="text-xs text-[#475569] mt-1">
                  {arama ? "Arama terimini değiştirmeyi deneyin" : "İşlem Ekle butonuna tıklayarak başlayın"}
                </p>
              </div>
              {!arama && (
                <button
                  onClick={() => { setDuzenle(null); setModalAcik(true); }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[rgba(251,192,36,0.1)] border border-[rgba(251,192,36,0.2)] text-[#fbc024] text-sm font-medium hover:bg-[rgba(251,192,36,0.15)] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  İlk İşlemi Ekle
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-[rgba(255,255,255,0.04)]">
              <AnimatePresence mode="popLayout">
                {sayfadakiIslemler.map((islem, i) => {
                  const gelirMi = islem.tip === "gelir";
                  const renk    = gelirMi ? "#22c55e" : "#ef4444";
                  const Icon    = gelirMi ? TrendingUp : TrendingDown;

                  return (
                    <motion.div key={islem.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ delay: i * 0.025, duration: 0.18 }}
                      className="flex items-center gap-4 px-5 py-4 hover:bg-[rgba(255,255,255,0.02)] transition-colors group"
                    >
                      {/* Sol aksan çizgisi */}
                      <div className="w-0.5 h-10 rounded-full shrink-0 self-center"
                        style={{ backgroundColor: renk, opacity: 0.6 }} />

                      {/* İkon */}
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${renk}14`, border: `1px solid ${renk}25` }}>
                        <Icon className="w-4.5 h-4.5" style={{ color: renk }} />
                      </div>

                      {/* Ana içerik */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-semibold text-white truncate">
                            {islem.aciklama || islem.kategori}
                          </p>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md shrink-0 font-medium"
                            style={{ backgroundColor: `${renk}14`, color: renk }}>
                            {islem.kategori}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-[#475569]">
                          <span>{tarihEtiket(islem.tarih)}</span>
                          {islem.odemeYontemi && (
                            <>
                              <span>·</span>
                              <span style={{ color: odemeRenk[islem.odemeYontemi] ?? "#64748b" }}>
                                {odemeEmoji[islem.odemeYontemi] ?? ""} {islem.odemeYontemi}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Tutar */}
                      <div className="text-right shrink-0">
                        <p className="text-base font-bold tabular-nums" style={{ color: renk }}>
                          {gelirMi ? "+" : "−"}{formatTL(islem.tutarKurus)}
                        </p>
                      </div>

                      {/* Aksiyonlar — mobilde her zaman, desktop'ta hover'da görünür */}
                      <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          onClick={() => { setDuzenle(islem); setModalAcik(true); }}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-[#475569] hover:text-[#fbc024] hover:bg-[rgba(251,192,36,0.08)] transition-all"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleSil(islem)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-[#475569] hover:text-[#ef4444] hover:bg-[rgba(239,68,68,0.08)] transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

          {/* ─── Alt bar: sayı + sayfalama ─── */}
          {filtrelenmis.length > 0 && (
            <div className="px-5 py-3 border-t border-[rgba(255,255,255,0.05)] flex items-center justify-between gap-4">
              <p className="text-xs text-[#475569]">
                <span className="text-white font-medium">
                  {(sayfa - 1) * SAYFA_BOYUTU + 1}–{Math.min(sayfa * SAYFA_BOYUTU, filtrelenmis.length)}
                </span>
                {" / "}{filtrelenmis.length} işlem
              </p>

              {toplamSayfa > 1 && (
                <div className="flex items-center gap-1">
                  <button onClick={() => setSayfa(p => Math.max(1, p - 1))} disabled={sayfa === 1}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-[rgba(255,255,255,0.08)] text-[#64748b] hover:border-[rgba(251,192,36,0.3)] hover:text-[#fbc024] disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  {Array.from({ length: toplamSayfa }, (_, i) => i + 1)
                    .filter(n => n === 1 || n === toplamSayfa || Math.abs(n - sayfa) <= 1)
                    .reduce<(number | "…")[]>((acc, n, idx, arr) => {
                      if (idx > 0 && n - (arr[idx - 1] as number) > 1) acc.push("…");
                      acc.push(n);
                      return acc;
                    }, [])
                    .map((item, idx) =>
                      item === "…" ? (
                        <span key={`d${idx}`} className="w-7 h-7 flex items-center justify-center text-xs text-[#475569]">…</span>
                      ) : (
                        <button key={item} onClick={() => setSayfa(item as number)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-xs font-medium border transition-all"
                          style={{
                            borderColor:     sayfa === item ? "rgba(251,192,36,0.4)" : "rgba(255,255,255,0.07)",
                            backgroundColor: sayfa === item ? "rgba(251,192,36,0.12)" : "transparent",
                            color:           sayfa === item ? "#fbc024" : "#64748b",
                          }}>
                          {item}
                        </button>
                      )
                    )}

                  <button onClick={() => setSayfa(p => Math.min(toplamSayfa, p + 1))} disabled={sayfa === toplamSayfa}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-[rgba(255,255,255,0.08)] text-[#64748b] hover:border-[rgba(251,192,36,0.3)] hover:text-[#fbc024] disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── Modaller ─── */}
      <IslemModal
        open={modalAcik}
        onClose={() => { setModalAcik(false); setDuzenle(null); setOtomatikTip(undefined); }}
        islem={duzenle}
        onKaydet={handleKaydet}
        varsayilanTip={otomatikTip}
      />

    </>
  );
}
