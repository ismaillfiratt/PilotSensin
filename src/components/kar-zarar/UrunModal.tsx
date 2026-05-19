"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { VARSAYILAN_KATEGORILER as KATEGORILER, VARSAYILAN_BIRIMLER as BIRIMLER } from "@/lib/stok-data";

interface Urun { id: string; ad: string; kategori: string; birim: string; satisFiyati: number; birimMaliyetKurus: number; aylikSatis: number; }

interface Props {
  open: boolean;
  onClose: () => void;
  urun?: Urun | null;
  onKaydet: (u: Omit<Urun, "id">) => void;
}

const bosForm = {
  ad: "", kategori: "Diğer", birim: "adet",
  satisFiyati: "", birimMaliyetKurus: "", aylikSatis: "",
};

export default function UrunModal({ open, onClose, urun, onKaydet }: Props) {
  const [form, setForm] = useState(bosForm);
  const duzenlemeModu = !!urun;

  useEffect(() => {
    if (urun) {
      setForm({
        ad: urun.ad, kategori: urun.kategori, birim: urun.birim,
        satisFiyati: String(urun.satisFiyati),
        birimMaliyetKurus: String(urun.birimMaliyetKurus),
        aylikSatis: String(urun.aylikSatis),
      });
    } else {
      setForm(bosForm);
    }
  }, [urun, open]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const satisFiyati = Number(form.satisFiyati) || 0;
  const birimMaliyetKurus = Number(form.birimMaliyetKurus) || 0;
  const birimKarKurus = satisFiyati - birimMaliyetKurus;
  const marj = satisFiyati > 0 ? (birimKarKurus / satisFiyati) * 100 : 0;
  const marjRenk = marj >= 30 ? "#22c55e" : marj >= 15 ? "var(--leaf)" : "#ef4444";

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    onKaydet({
      ad: form.ad, kategori: form.kategori, birim: form.birim,
      satisFiyati: Number(form.satisFiyati),
      birimMaliyetKurus: Number(form.birimMaliyetKurus),
      aylikSatis: Number(form.aylikSatis),
    });
    onClose();
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Sheet / Dialog */}
      <motion.div
        initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
        drag="y" dragConstraints={{ top: 0 }} dragElastic={{ top: 0, bottom: 0.3 }}
        onDragEnd={(_, info) => { if (info.velocity.y > 300 || info.offset.y > 120) onClose(); }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed z-50 bg-white bottom-0 inset-x-0 rounded-t-2xl border-t border-gray-200 max-h-[90vh] overflow-y-auto md:bottom-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:border md:max-w-md md:w-full"
      >
        {/* Drag handle */}
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className="w-12 h-1 rounded-full bg-gray-200" />
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-5 pt-4 pb-3 space-y-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h2 className="text-base font-bold text-gray-800">{duzenlemeModu ? "Ürünü Düzenle" : "Yeni Ürün Ekle"}</h2>
                <p className="text-xs text-gray-400 mt-0.5">Satış fiyatı ve maliyet gir</p>
              </div>
              <button type="button" onClick={onClose} className="min-w-11 min-h-11 flex items-center justify-center rounded-xl text-gray-400 active:bg-white/5 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs text-gray-400 font-medium block mb-1.5">Ürün / Hizmet Adı *</label>
              <input required value={form.ad} onChange={(e) => set("ad", e.target.value)} placeholder="örn. Süt 1L"
                className="w-full px-3 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-[#94a3b8] focus:outline-none focus:border-[var(--leaf)] transition-colors text-base" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 font-medium block mb-1.5">Kategori</label>
                <select value={form.kategori} onChange={(e) => set("kategori", e.target.value)}
                  className="w-full px-3 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:outline-none focus:border-[var(--leaf)] transition-colors text-base">
                  {KATEGORILER.map((k) => <option key={k} value={k} className="bg-white">{k}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 font-medium block mb-1.5">Birim</label>
                <select value={form.birim} onChange={(e) => set("birim", e.target.value)}
                  className="w-full px-3 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:outline-none focus:border-[var(--leaf)] transition-colors text-base">
                  {BIRIMLER.map((b) => <option key={b} value={b} className="bg-white">{b}</option>)}
                </select>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-3">Fiyat & Maliyet</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-1.5">Satış Fiyatı (₺) *</label>
                  <input type="number" min="0" step="0.01" required value={form.satisFiyati}
                    onChange={(e) => set("satisFiyati", e.target.value)} placeholder="0"
                    className="w-full px-3 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-[#94a3b8] focus:outline-none focus:border-[var(--leaf)] transition-colors text-base font-bold" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-1.5">Birim Maliyet (₺) *</label>
                  <input type="number" min="0" step="0.01" required value={form.birimMaliyetKurus}
                    onChange={(e) => set("birimMaliyetKurus", e.target.value)} placeholder="0"
                    className="w-full px-3 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-[#94a3b8] focus:outline-none focus:border-[var(--leaf)] transition-colors text-base font-bold" />
                </div>
              </div>
              {satisFiyati > 0 && birimMaliyetKurus > 0 && (
                <div className="mt-3 flex items-center justify-between px-4 py-2.5 rounded-xl border"
                  style={{ backgroundColor: `${marjRenk}10`, borderColor: `${marjRenk}30` }}>
                  <span className="text-xs text-gray-400">Birim kar</span>
                  <span className="text-sm font-bold" style={{ color: marjRenk }}>₺{birimKarKurus.toFixed(2)} · %{marj.toFixed(1)} marj</span>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs text-gray-400 font-medium block mb-1.5">Aylık Satış Adedi *</label>
              <input type="number" min="0" required value={form.aylikSatis}
                onChange={(e) => set("aylikSatis", e.target.value)} placeholder="0"
                className="w-full px-3 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-[#94a3b8] focus:outline-none focus:border-[var(--leaf)] transition-colors text-base" />
            </div>
          </div>

          {/* Sticky footer */}
          <div className="sticky bottom-0 bg-white px-5 pt-3 border-t border-gray-200"
            style={{ paddingBottom: "max(env(safe-area-inset-bottom), 16px)" }}>
            <div className="flex gap-3">
              <button type="button" onClick={onClose}
                className="flex-1 min-h-12 rounded-xl border border-gray-200 text-gray-400 text-sm font-medium active:bg-white/5 transition-colors">
                İptal
              </button>
              <button type="submit"
                className="flex-1 min-h-12 rounded-xl bg-[var(--forest)] text-gray-800 text-sm font-bold hover:opacity-90 transition-colors">
                {duzenlemeModu ? "Kaydet" : "Ekle"}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </>
  );
}
