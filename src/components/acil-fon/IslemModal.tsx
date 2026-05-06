"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, PiggyBank, ArrowUpFromLine } from "lucide-react";
import { type FonIslem, type IslemTipi } from "@/lib/acil-fon-data";

interface Props {
  open: boolean;
  onClose: () => void;
  onKaydet: (i: Omit<FonIslem, "id">) => void;
}

export default function IslemModal({ open, onClose, onKaydet }: Props) {
  const [tip, setTip]         = useState<IslemTipi>("yatirma");
  const [tutar, setTutar]     = useState("");
  const [aciklama, setAciklama] = useState("");
  const [tarih, setTarih]     = useState(new Date().toISOString().split("T")[0]);

  const reset = () => { setTutar(""); setAciklama(""); setTip("yatirma"); setTarih(new Date().toISOString().split("T")[0]); };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onKaydet({ tip, tutar: Number(tutar), aciklama, tarih: new Date(tarih).toISOString() });
    reset();
    onClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-sm glass-card rounded-2xl p-6"
        >
          <div className="flex items-start justify-between mb-6">
            <h2 className="text-lg font-bold text-white">Fon Hareketi</h2>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#94a3b8] hover:text-white hover:bg-[rgba(255,255,255,0.08)] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tip seçimi */}
            <div className="grid grid-cols-2 gap-2">
              {([
                { v: "yatirma", label: "Fona Yatır",  icon: PiggyBank,       renk: "#22c55e" },
                { v: "cekme",   label: "Fondan Çek",  icon: ArrowUpFromLine, renk: "#ef4444" },
              ] as const).map(({ v, label, icon: Icon, renk }) => (
                <button key={v} type="button" onClick={() => setTip(v)}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl border transition-all font-semibold text-sm"
                  style={{
                    borderColor: tip === v ? renk : "rgba(255,255,255,0.08)",
                    backgroundColor: tip === v ? `${renk}15` : "transparent",
                    color: tip === v ? renk : "#94a3b8",
                  }}>
                  <Icon className="w-4 h-4" />{label}
                </button>
              ))}
            </div>

            {/* Tutar */}
            <div>
              <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">Tutar (₺) *</label>
              <input type="number" min="1" required value={tutar} onChange={(e) => setTutar(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-3 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#94a3b8] focus:outline-none focus:border-[rgba(251,192,36,0.5)] transition-colors text-xl font-bold" />
            </div>

            {/* Tarih */}
            <div>
              <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">Tarih</label>
              <input type="date" value={tarih} onChange={(e) => setTarih(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white focus:outline-none focus:border-[rgba(251,192,36,0.5)] transition-colors text-sm [color-scheme:dark]" />
            </div>

            {/* Açıklama */}
            <div>
              <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">Açıklama</label>
              <input type="text" value={aciklama} onChange={(e) => setAciklama(e.target.value)}
                placeholder="örn. Aylık birikim, Acil tamir..."
                className="w-full px-3 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#94a3b8] focus:outline-none focus:border-[rgba(251,192,36,0.5)] transition-colors text-sm" />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-[rgba(255,255,255,0.1)] text-[#94a3b8] text-sm font-medium hover:bg-[rgba(255,255,255,0.05)] transition-colors">
                İptal
              </button>
              <button type="submit"
                className="flex-1 py-3 rounded-xl bg-[#fbc024] text-[#0e172a] text-sm font-bold hover:bg-[#d9a61f] transition-colors">
                Kaydet
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
