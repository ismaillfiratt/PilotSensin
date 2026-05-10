"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { type FonHedef } from "@/lib/acil-fon-data";

interface Props {
  open:         boolean;
  onClose:      () => void;
  onKaydet:     (h: Omit<FonHedef, "id" | "olusturmaTarih">) => void;
  mevcutHedef?: FonHedef;
}

function fmt(n: number) { return n > 0 ? n.toLocaleString("tr-TR") : ""; }
function parse(s: string) { return parseInt(s.replace(/\./g, "").replace(/[^0-9]/g, ""), 10) || 0; }

function useFormattedInput(initial: number) {
  const [display, setDisplay] = useState(fmt(initial));
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const n = parseInt(e.target.value.replace(/\./g, "").replace(/[^0-9]/g, ""), 10) || 0;
    setDisplay(fmt(n));
  };
  return { display, onChange, value: parse(display), setDisplay };
}

export default function HedefModal({ open, onClose, onKaydet, mevcutHedef }: Props) {
  const [ad,       setAd]      = useState("");
  const toplam   = useFormattedInput(0);
  const aylik    = useFormattedInput(0);
  const [odemeGun, setOdemeGun] = useState("1");
  const [aciklama, setAciklama] = useState("");

  useEffect(() => {
    if (open) {
      setAd(mevcutHedef?.ad ?? "");
      toplam.setDisplay(fmt(mevcutHedef?.toplamHedef ?? 0));
      aylik.setDisplay(fmt(mevcutHedef?.aylikOdeme ?? 0));
      setOdemeGun(String(mevcutHedef?.odemeGunu ?? 1));
      setAciklama(mevcutHedef?.aciklama ?? "");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const aylarSayisi = aylik.value > 0 ? Math.ceil(toplam.value / aylik.value) : 0;
  const duzenleMi = !!mevcutHedef;

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    if (!ad.trim() || toplam.value <= 0 || aylik.value <= 0) return;
    onKaydet({
      ad:          ad.trim(),
      toplamHedef: toplam.value,
      aylikOdeme:  aylik.value,
      odemeGunu:   parseInt(odemeGun, 10) || 1,
      aciklama:    aciklama.trim() || undefined,
    });
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
          className="w-full max-w-sm glass-card rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-white">{duzenleMi ? "Hedefi Düzenle" : "Yeni Hedef Ekle"}</h2>
              <p className="text-xs text-[#94a3b8] mt-0.5">Tasarruf hedefini tanımla</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#94a3b8] hover:text-white hover:bg-[rgba(255,255,255,0.08)] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Hedef adı */}
            <div>
              <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">Hedef Adı *</label>
              <input type="text" required value={ad} onChange={(e) => setAd(e.target.value)}
                placeholder="örn. Makine Alımı, İşletme Güvenliği"
                className="w-full px-3 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#94a3b8] focus:outline-none focus:border-[rgba(251,192,36,0.5)] transition-colors text-sm" />
            </div>

            {/* Toplam hedef */}
            <div>
              <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">Toplam Hedef Tutarı (₺) *</label>
              <input type="text" inputMode="numeric" required
                value={toplam.display} onChange={toplam.onChange}
                placeholder="50.000"
                className="w-full px-4 py-3 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#94a3b8] focus:outline-none focus:border-[rgba(251,192,36,0.5)] transition-colors text-lg font-bold" />
            </div>

            {/* Aylık ödeme */}
            <div>
              <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">Aylık Ödeme (₺) *</label>
              <input type="text" inputMode="numeric" required
                value={aylik.display} onChange={aylik.onChange}
                placeholder="2.000"
                className="w-full px-3 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#94a3b8] focus:outline-none focus:border-[rgba(251,192,36,0.5)] transition-colors text-sm font-bold" />
              {aylarSayisi > 0 && (
                <p className="text-xs text-[#fbc024] mt-1">
                  ~{aylarSayisi} ay ({Math.floor(aylarSayisi / 12) > 0 ? `${Math.floor(aylarSayisi / 12)} yıl ` : ""}{aylarSayisi % 12 > 0 ? `${aylarSayisi % 12} ay` : ""})
                </p>
              )}
            </div>

            {/* Ödeme günü */}
            <div>
              <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">Her Ayın Kaçında Ödensin? *</label>
              <div className="flex items-center gap-3">
                <input type="number" min="1" max="31" required
                  value={odemeGun} onChange={(e) => setOdemeGun(e.target.value)}
                  className="w-24 px-3 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white text-center text-lg font-bold focus:outline-none focus:border-[rgba(251,192,36,0.5)] transition-colors" />
                <p className="text-sm text-[#94a3b8]">
                  Her ayın <span className="text-white font-bold">{odemeGun}.</span> günü hatırlatma
                </p>
              </div>
            </div>

            {/* Açıklama */}
            <div>
              <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">Açıklama / Not</label>
              <input type="text" value={aciklama} onChange={(e) => setAciklama(e.target.value)}
                placeholder="örn. Depo binası için birikim"
                className="w-full px-3 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#94a3b8] focus:outline-none focus:border-[rgba(251,192,36,0.5)] transition-colors text-sm" />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-[rgba(255,255,255,0.1)] text-[#94a3b8] text-sm font-medium hover:bg-[rgba(255,255,255,0.05)] transition-colors">
                İptal
              </button>
              <button type="submit"
                className="flex-1 py-3 rounded-xl bg-[#fbc024] text-[#0e172a] text-sm font-bold hover:bg-[#d9a61f] transition-colors">
                {duzenleMi ? "Güncelle" : "Kaydet"}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
