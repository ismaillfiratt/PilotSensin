"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowDownCircle, ArrowUpCircle, RefreshCw } from "lucide-react";
import { Urun } from "@/lib/stok-data";

interface Props {
  urun: Urun | null;
  onClose: () => void;
}

const tipler = [
  { value: "giris", label: "Stok Girişi", icon: ArrowDownCircle, color: "#22c55e" },
  { value: "cikis", label: "Stok Çıkışı", icon: ArrowUpCircle, color: "#ef4444" },
  { value: "sayim", label: "Sayım Düzeltmesi", icon: RefreshCw, color: "#fbc024" },
] as const;

export default function HareketiModal({ urun, onClose }: Props) {
  const [tip, setTip] = useState<"giris" | "cikis" | "sayim">("giris");
  const [miktar, setMiktar] = useState("");
  const [aciklama, setAciklama] = useState("");

  if (!urun) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock: sadece kapat
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-md glass-card rounded-2xl p-6"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-white">Stok Hareketi</h2>
              <p className="text-sm text-[#94a3b8] mt-0.5">
                {urun.ad} — Mevcut: {urun.mevcutAdet} {urun.birim}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-[#94a3b8] hover:text-white hover:bg-[rgba(255,255,255,0.08)] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Tip seçimi */}
            <div className="grid grid-cols-3 gap-2">
              {tipler.map(({ value, label, icon: Icon, color }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTip(value)}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl border transition-all"
                  style={{
                    borderColor: tip === value ? color : "rgba(255,255,255,0.08)",
                    backgroundColor: tip === value ? `${color}15` : "transparent",
                  }}
                >
                  <Icon className="w-5 h-5" style={{ color: tip === value ? color : "#94a3b8" }} />
                  <span className="text-[11px] text-center leading-tight" style={{ color: tip === value ? color : "#94a3b8" }}>
                    {label}
                  </span>
                </button>
              ))}
            </div>

            {/* Miktar */}
            <div>
              <label className="text-xs text-[#94a3b8] font-medium block mb-2">
                {tip === "sayim" ? "Gerçek Sayım Miktarı" : "Miktar"} ({urun.birim})
              </label>
              <input
                type="number"
                min="1"
                required
                value={miktar}
                onChange={(e) => setMiktar(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-3 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#94a3b8] focus:outline-none focus:border-[rgba(251,192,36,0.5)] transition-colors text-lg font-bold"
              />
              {tip === "sayim" && miktar && (
                <p className="text-xs text-[#fbc024] mt-1">
                  Fark: {Number(miktar) - urun.mevcutAdet > 0 ? "+" : ""}{Number(miktar) - urun.mevcutAdet} {urun.birim}
                </p>
              )}
            </div>

            {/* Açıklama */}
            <div>
              <label className="text-xs text-[#94a3b8] font-medium block mb-2">Açıklama (opsiyonel)</label>
              <input
                type="text"
                value={aciklama}
                onChange={(e) => setAciklama(e.target.value)}
                placeholder="Tedarikçi, satış, fire..."
                className="w-full px-4 py-3 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#94a3b8] focus:outline-none focus:border-[rgba(251,192,36,0.5)] transition-colors"
              />
            </div>

            {/* Butonlar */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-[rgba(255,255,255,0.1)] text-[#94a3b8] text-sm font-medium hover:bg-[rgba(255,255,255,0.05)] transition-colors"
              >
                İptal
              </button>
              <button
                type="submit"
                className="flex-1 py-3 rounded-xl bg-[#fbc024] text-[#0e172a] text-sm font-bold hover:bg-[#d9a61f] transition-colors"
              >
                Kaydet
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
