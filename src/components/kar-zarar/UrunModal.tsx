"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { KATEGORILER, BIRIMLER, type Urun } from "@/lib/kar-zarar-data";

interface Props {
  open: boolean;
  onClose: () => void;
  urun?: Urun | null;
  onKaydet: (u: Omit<Urun, "id">) => void;
}

const bosForm = {
  ad: "", kategori: "Diğer", birim: "adet",
  satisFiyati: "", birimMaliyet: "", aylikSatis: "",
};

export default function UrunModal({ open, onClose, urun, onKaydet }: Props) {
  const [form, setForm] = useState(bosForm);
  const duzenlemeModu = !!urun;

  useEffect(() => {
    if (urun) {
      setForm({
        ad: urun.ad, kategori: urun.kategori, birim: urun.birim,
        satisFiyati: String(urun.satisFiyati),
        birimMaliyet: String(urun.birimMaliyet),
        aylikSatis: String(urun.aylikSatis),
      });
    } else {
      setForm(bosForm);
    }
  }, [urun, open]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const satisFiyati = Number(form.satisFiyati) || 0;
  const birimMaliyet = Number(form.birimMaliyet) || 0;
  const birimKar = satisFiyati - birimMaliyet;
  const marj = satisFiyati > 0 ? (birimKar / satisFiyati) * 100 : 0;
  const marjRenk = marj >= 30 ? "#22c55e" : marj >= 15 ? "#fbc024" : "#ef4444";

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onKaydet({
      ad: form.ad, kategori: form.kategori, birim: form.birim,
      satisFiyati: Number(form.satisFiyati),
      birimMaliyet: Number(form.birimMaliyet),
      aylikSatis: Number(form.aylikSatis),
    });
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
          className="w-full max-w-md glass-card rounded-2xl p-6"
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-white">
                {duzenlemeModu ? "Ürünü Düzenle" : "Yeni Ürün Ekle"}
              </h2>
              <p className="text-xs text-[#94a3b8] mt-0.5">Satış fiyatı ve maliyet gir</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#94a3b8] hover:text-white hover:bg-[rgba(255,255,255,0.08)] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Ad */}
            <div>
              <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">Ürün / Hizmet Adı *</label>
              <input required value={form.ad} onChange={(e) => set("ad", e.target.value)}
                placeholder="örn. Süt 1L"
                className="w-full px-3 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#94a3b8] focus:outline-none focus:border-[rgba(251,192,36,0.5)] transition-colors text-sm" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Kategori */}
              <div>
                <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">Kategori</label>
                <select value={form.kategori} onChange={(e) => set("kategori", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white focus:outline-none focus:border-[rgba(251,192,36,0.5)] transition-colors text-sm">
                  {KATEGORILER.map((k) => <option key={k} value={k} className="bg-[#0e172a]">{k}</option>)}
                </select>
              </div>
              {/* Birim */}
              <div>
                <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">Birim</label>
                <select value={form.birim} onChange={(e) => set("birim", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white focus:outline-none focus:border-[rgba(251,192,36,0.5)] transition-colors text-sm">
                  {BIRIMLER.map((b) => <option key={b} value={b} className="bg-[#0e172a]">{b}</option>)}
                </select>
              </div>
            </div>

            <div className="border-t border-[rgba(255,255,255,0.06)] pt-4">
              <p className="text-xs text-[#94a3b8] font-semibold uppercase tracking-wider mb-3">Fiyat & Maliyet</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">Satış Fiyatı (₺) *</label>
                  <input type="number" min="0" step="0.01" required value={form.satisFiyati}
                    onChange={(e) => set("satisFiyati", e.target.value)} placeholder="0"
                    className="w-full px-3 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#94a3b8] focus:outline-none focus:border-[rgba(251,192,36,0.5)] transition-colors text-sm font-bold" />
                </div>
                <div>
                  <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">Birim Maliyet (₺) *</label>
                  <input type="number" min="0" step="0.01" required value={form.birimMaliyet}
                    onChange={(e) => set("birimMaliyet", e.target.value)} placeholder="0"
                    className="w-full px-3 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#94a3b8] focus:outline-none focus:border-[rgba(251,192,36,0.5)] transition-colors text-sm font-bold" />
                </div>
              </div>

              {/* Anlık marj önizleme */}
              {satisFiyati > 0 && birimMaliyet > 0 && (
                <div className="mt-3 flex items-center justify-between px-4 py-2.5 rounded-xl border"
                  style={{ backgroundColor: `${marjRenk}10`, borderColor: `${marjRenk}30` }}>
                  <span className="text-xs text-[#94a3b8]">Birim kar</span>
                  <span className="text-sm font-bold" style={{ color: marjRenk }}>
                    ₺{birimKar.toFixed(2)} · %{marj.toFixed(1)} marj
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">Aylık Satış Adedi *</label>
              <input type="number" min="0" required value={form.aylikSatis}
                onChange={(e) => set("aylikSatis", e.target.value)} placeholder="0"
                className="w-full px-3 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#94a3b8] focus:outline-none focus:border-[rgba(251,192,36,0.5)] transition-colors text-sm" />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-[rgba(255,255,255,0.1)] text-[#94a3b8] text-sm font-medium hover:bg-[rgba(255,255,255,0.05)] transition-colors">
                İptal
              </button>
              <button type="submit"
                className="flex-1 py-3 rounded-xl bg-[#fbc024] text-[#0e172a] text-sm font-bold hover:bg-[#d9a61f] transition-colors">
                {duzenlemeModu ? "Kaydet" : "Ekle"}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
