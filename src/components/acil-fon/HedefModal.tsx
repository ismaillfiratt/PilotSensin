"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { type FonHedef } from "@/lib/acil-fon-data";
import { kurus } from "@/lib/para";

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
      toplam.setDisplay(fmt(Math.round((mevcutHedef?.toplamHedefKurus ?? 0) / 100)));
      aylik.setDisplay(fmt(Math.round((mevcutHedef?.aylikOdemeKurus  ?? 0) / 100)));
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
      toplamHedefKurus: kurus(toplam.value),
      aylikOdemeKurus:  kurus(aylik.value),
      odemeGunu:   parseInt(odemeGun, 10) || 1,
      aciklama:    aciklama.trim() || undefined,
    });
    onClose();
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
        drag="y" dragConstraints={{ top: 0 }} dragElastic={{ top: 0, bottom: 0.3 }}
        onDragEnd={(_, info) => { if (info.velocity.y > 300 || info.offset.y > 120) onClose(); }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed z-50 bg-white bottom-0 inset-x-0 rounded-t-2xl border-t border-gray-200 max-h-[90vh] overflow-y-auto md:bottom-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:border md:max-w-sm md:w-full"
      >
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className="w-12 h-1 rounded-full bg-gray-200" />
        </div>
        <form onSubmit={handleSubmit}>
          <div className="px-5 pt-4 pb-1 flex items-start justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-800">{duzenleMi ? "Hedefi Düzenle" : "Yeni Hedef Ekle"}</h2>
              <p className="text-xs text-gray-400 mt-0.5">Tasarruf hedefini tanımla</p>
            </div>
            <button type="button" onClick={onClose} className="min-w-11 min-h-11 flex items-center justify-center rounded-xl text-gray-400 active:bg-gray-100 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="px-5 pt-2 pb-3 space-y-4">
            {/* Hedef adı */}
            <div>
              <label className="text-xs text-gray-400 font-medium block mb-1.5">Hedef Adı *</label>
              <input type="text" required value={ad} onChange={(e) => setAd(e.target.value)}
                placeholder="örn. Makine Alımı, İşletme Güvenliği"
                className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[var(--leaf)] transition-colors text-sm" />
            </div>

            {/* Toplam hedef */}
            <div>
              <label className="text-xs text-gray-400 font-medium block mb-1.5">Toplam Hedef Tutarı (₺) *</label>
              <input type="text" inputMode="numeric" required
                value={toplam.display} onChange={toplam.onChange}
                placeholder="50.000"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[var(--leaf)] transition-colors text-lg font-bold" />
            </div>

            {/* Aylık ödeme */}
            <div>
              <label className="text-xs text-gray-400 font-medium block mb-1.5">Aylık Ödeme (₺) *</label>
              <input type="text" inputMode="numeric" required
                value={aylik.display} onChange={aylik.onChange}
                placeholder="2.000"
                className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[var(--leaf)] transition-colors text-sm font-bold" />
              {aylarSayisi > 0 && (
                <p className="text-xs text-[var(--leaf)] mt-1">
                  ~{aylarSayisi} ay ({Math.floor(aylarSayisi / 12) > 0 ? `${Math.floor(aylarSayisi / 12)} yıl ` : ""}{aylarSayisi % 12 > 0 ? `${aylarSayisi % 12} ay` : ""})
                </p>
              )}
            </div>

            {/* Ödeme günü */}
            <div>
              <label className="text-xs text-gray-400 font-medium block mb-1.5">Her Ayın Kaçında Ödensin? *</label>
              <div className="flex items-center gap-3">
                <input type="number" min="1" max="31" required
                  value={odemeGun} onChange={(e) => setOdemeGun(e.target.value)}
                  className="w-24 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 text-center text-lg font-bold focus:outline-none focus:border-[var(--leaf)] transition-colors" />
                <p className="text-sm text-gray-400">
                  Her ayın <span className="text-gray-800 font-bold">{odemeGun}.</span> günü hatırlatma
                </p>
              </div>
            </div>

            {/* Açıklama */}
            <div>
              <label className="text-xs text-gray-400 font-medium block mb-1.5">Açıklama / Not</label>
              <input type="text" value={aciklama} onChange={(e) => setAciklama(e.target.value)}
                placeholder="örn. Depo binası için birikim"
                className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[var(--leaf)] transition-colors text-sm" />
            </div>
          </div>

          {/* Sticky footer */}
          <div className="sticky bottom-0 bg-white px-5 pt-3 border-t border-gray-200"
            style={{ paddingBottom: "max(env(safe-area-inset-bottom), 16px)" }}>
            <div className="flex gap-3">
              <button type="button" onClick={onClose}
                className="flex-1 min-h-12 rounded-xl border border-gray-200 text-gray-400 text-sm font-medium active:bg-gray-100 transition-colors">
                İptal
              </button>
              <button type="submit"
                className="flex-1 min-h-12 rounded-xl bg-[var(--forest)] text-gray-800 text-sm font-bold hover:opacity-90 transition-colors">
                {duzenleMi ? "Güncelle" : "Kaydet"}
              </button>
            </div>
          </div>
        </form>
        </motion.div>
      </>
  );
}
