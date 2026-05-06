"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Settings2 } from "lucide-react";
import { formatTL, type FonAyar } from "@/lib/acil-fon-data";

interface Props {
  open: boolean;
  onClose: () => void;
  ayar: FonAyar;
  onKaydet: (a: FonAyar) => void;
}

export default function HedefModal({ open, onClose, ayar, onKaydet }: Props) {
  const [hedef, setHedef]         = useState(String(ayar.hedef));
  const [aylikHedef, setAylik]    = useState(String(ayar.aylikHedef));
  const [aylarSayisi, setAylar]   = useState(String(ayar.aylarSayisi));

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onKaydet({ hedef: Number(hedef), aylikHedef: Number(aylikHedef), aylarSayisi: Number(aylarSayisi) });
    onClose();
  };

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
            <div>
              <h2 className="text-lg font-bold text-white">Hedef Ayarla</h2>
              <p className="text-xs text-[#94a3b8] mt-0.5">Fon hedefini ve aylık birikimi belirle</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#94a3b8] hover:text-white hover:bg-[rgba(255,255,255,0.08)] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">Hedef Fon Tutarı (₺) *</label>
              <input type="number" min="1" required value={hedef} onChange={(e) => setHedef(e.target.value)}
                placeholder="30000"
                className="w-full px-4 py-3 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#94a3b8] focus:outline-none focus:border-[rgba(251,192,36,0.5)] transition-colors text-lg font-bold" />
              <p className="text-xs text-[#94a3b8] mt-1">
                Önerilen: En az 3 aylık sabit gider tutarı
              </p>
            </div>

            <div>
              <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">Kaç Aylık Gider?</label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 6].map((n) => (
                  <button key={n} type="button" onClick={() => setAylar(String(n))}
                    className="py-2 rounded-xl text-xs font-bold border transition-all"
                    style={{
                      borderColor: aylarSayisi === String(n) ? "#fbc024" : "rgba(255,255,255,0.08)",
                      backgroundColor: aylarSayisi === String(n) ? "rgba(251,192,36,0.15)" : "transparent",
                      color: aylarSayisi === String(n) ? "#fbc024" : "#94a3b8",
                    }}>
                    {n} ay
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">Aylık Birikim Hedefi (₺) *</label>
              <input type="number" min="1" required value={aylikHedef} onChange={(e) => setAylik(e.target.value)}
                placeholder="3000"
                className="w-full px-3 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#94a3b8] focus:outline-none focus:border-[rgba(251,192,36,0.5)] transition-colors text-sm font-bold" />
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
