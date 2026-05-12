"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowDownCircle, ArrowUpCircle, RefreshCw, Clock } from "lucide-react";
import { Urun, StokHareketi } from "@/lib/stok-data";
import { useStok } from "@/store/stok";
import { createClient } from "@/utils/supabase/client";

interface Props {
  urun: Urun | null;
  onClose: () => void;
}

const tipler = [
  { value: "giris", label: "Stok Girişi",     icon: ArrowDownCircle, color: "#22c55e" },
  { value: "cikis", label: "Stok Çıkışı",      icon: ArrowUpCircle,   color: "#ef4444" },
  { value: "sayim", label: "Sayım Düzeltmesi", icon: RefreshCw,       color: "#fbc024" },
] as const;

function zaman(iso: string) {
  return new Date(iso).toLocaleString("tr-TR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function HareketiModal({ urun, onClose }: Props) {
  const { guncelle } = useStok();
  const [tip, setTip]           = useState<"giris" | "cikis" | "sayim">("giris");
  const [miktar, setMiktar]     = useState("");
  const [aciklama, setAciklama] = useState("");
  const [sekme, setSekme]       = useState<"yeni" | "log">("yeni");

  if (!urun) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const m = Number(miktar);
    if (!m || m < 0) return;

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const kimin = session?.user?.email ?? "Bilinmiyor";

    const onceki  = urun.mevcutAdet;
    const sonraki = tip === "giris" ? onceki + m
                  : tip === "cikis" ? Math.max(0, onceki - m)
                  : m;

    const yeniHareket: StokHareketi = {
      id:       Date.now().toString(),
      tip, miktar: m, onceki, sonraki,
      tarih:    new Date().toISOString(),
      aciklama: aciklama.trim() || (tip === "giris" ? "Stok girişi" : tip === "cikis" ? "Stok çıkışı" : "Sayım düzeltmesi"),
      kimin,
    };

    await guncelle(urun.id, {
      mevcutAdet: sonraki,
      sonHareket: new Date().toISOString(),
      hareketler: [yeniHareket, ...(urun.hareketler ?? [])].slice(0, 50),
    });

    setMiktar(""); setAciklama("");
    onClose();
  };

  const hareketler = urun.hareketler ?? [];

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}>
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ duration: 0.2 }}
          className="w-full max-w-md glass-card rounded-2xl overflow-hidden">

          <div className="flex items-start justify-between px-6 pt-6 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white">Stok Hareketi</h2>
              <p className="text-sm text-[#94a3b8] mt-0.5">
                {urun.ad} — Mevcut: <span className="text-white font-medium">{urun.mevcutAdet} {urun.birim}</span>
              </p>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#94a3b8] hover:text-white hover:bg-[rgba(255,255,255,0.08)] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex border-b border-[rgba(255,255,255,0.06)] px-6">
            {(["yeni", "log"] as const).map((s) => (
              <button key={s} onClick={() => setSekme(s)}
                className="pb-3 pr-5 text-sm font-medium border-b-2 transition-colors"
                style={sekme === s ? { borderColor: "#fbc024", color: "#fbc024" } : { borderColor: "transparent", color: "#64748b" }}>
                {s === "yeni" ? "Yeni Hareket" : `Geçmiş (${hareketler.length})`}
              </button>
            ))}
          </div>

          <div className="p-6">
            {sekme === "yeni" ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  {tipler.map(({ value, label, icon: Icon, color }) => (
                    <button key={value} type="button" onClick={() => setTip(value)}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl border transition-all"
                      style={{ borderColor: tip === value ? color : "rgba(255,255,255,0.08)", backgroundColor: tip === value ? `${color}15` : "transparent" }}>
                      <Icon className="w-5 h-5" style={{ color: tip === value ? color : "#94a3b8" }} />
                      <span className="text-[11px] text-center leading-tight" style={{ color: tip === value ? color : "#94a3b8" }}>{label}</span>
                    </button>
                  ))}
                </div>

                <div>
                  <label className="text-xs text-[#94a3b8] font-medium block mb-2">
                    {tip === "sayim" ? "Gerçek Sayım Miktarı" : "Miktar"} ({urun.birim})
                  </label>
                  <input type="number" min="0" required value={miktar} onChange={(e) => setMiktar(e.target.value)} placeholder="0"
                    className="w-full px-4 py-3 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#94a3b8] focus:outline-none focus:border-[rgba(251,192,36,0.5)] transition-colors text-lg font-bold" />
                  {miktar && (
                    <p className="text-xs text-[#fbc024] mt-1.5">
                      {tip === "giris" && `${urun.mevcutAdet} + ${miktar} = ${urun.mevcutAdet + Number(miktar)} ${urun.birim}`}
                      {tip === "cikis" && `${urun.mevcutAdet} - ${miktar} = ${Math.max(0, urun.mevcutAdet - Number(miktar))} ${urun.birim}`}
                      {tip === "sayim" && `Fark: ${Number(miktar) >= urun.mevcutAdet ? "+" : ""}${Number(miktar) - urun.mevcutAdet} ${urun.birim}`}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs text-[#94a3b8] font-medium block mb-2">Açıklama (opsiyonel)</label>
                  <input type="text" value={aciklama} onChange={(e) => setAciklama(e.target.value)} placeholder="Tedarikçi, satış, fire..."
                    className="w-full px-4 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#94a3b8] focus:outline-none focus:border-[rgba(251,192,36,0.5)] transition-colors text-sm" />
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={onClose}
                    className="flex-1 py-2.5 rounded-xl border border-[rgba(255,255,255,0.1)] text-[#94a3b8] text-sm font-medium hover:bg-[rgba(255,255,255,0.05)] transition-colors">İptal</button>
                  <button type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-[#fbc024] text-[#0e172a] text-sm font-bold hover:bg-[#d9a61f] transition-colors">Kaydet</button>
                </div>
              </form>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {hareketler.length === 0 ? (
                  <div className="text-center py-8 text-sm text-[#64748b]">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    Henüz hareket kaydı yok
                  </div>
                ) : hareketler.map((h) => {
                  const renk = h.tip === "giris" ? "#22c55e" : h.tip === "cikis" ? "#ef4444" : "#fbc024";
                  return (
                    <div key={h.id} className="flex items-start gap-3 p-3 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]">
                      <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: renk }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold" style={{ color: renk }}>
                            {h.tip === "giris" ? "+" : h.tip === "cikis" ? "-" : "="}{h.miktar} {urun.birim}
                          </span>
                          <span className="text-[10px] text-[#475569]">{h.onceki} → {h.sonraki}</span>
                        </div>
                        <p className="text-xs text-[#94a3b8] truncate mt-0.5">{h.aciklama}</p>
                        <p className="text-[10px] text-[#475569] mt-0.5">{h.kimin} · {zaman(h.tarih)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
