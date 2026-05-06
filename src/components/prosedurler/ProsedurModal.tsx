"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2 } from "lucide-react";
import { KATEGORILER, SORUMLULAR, type Prosedur, type ProsedurKategori } from "@/lib/prosedur-data";

interface Props {
  open: boolean;
  onClose: () => void;
  prosedur?: Prosedur | null;
  onKaydet: (p: Omit<Prosedur, "id" | "sonGuncelleme">) => void;
}

const bosForm = {
  baslik: "", kategori: "Açılış & Kapanış" as ProsedurKategori,
  aciklama: "", sorumlu: "Tüm personel",
  adimlar: [{ sira: 1, aciklama: "" }],
};

export default function ProsedurModal({ open, onClose, prosedur, onKaydet }: Props) {
  const [form, setForm] = useState(bosForm);
  const duzenlemeModu = !!prosedur;

  useEffect(() => {
    if (prosedur) {
      setForm({
        baslik: prosedur.baslik, kategori: prosedur.kategori,
        aciklama: prosedur.aciklama, sorumlu: prosedur.sorumlu,
        adimlar: prosedur.adimlar.map((a) => ({ ...a })),
      });
    } else {
      setForm(bosForm);
    }
  }, [prosedur, open]);

  const setField = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const adimGuncelle = (i: number, v: string) =>
    setForm((f) => ({ ...f, adimlar: f.adimlar.map((a, idx) => idx === i ? { ...a, aciklama: v } : a) }));

  const adimEkle = () =>
    setForm((f) => ({ ...f, adimlar: [...f.adimlar, { sira: f.adimlar.length + 1, aciklama: "" }] }));

  const adimSil = (i: number) =>
    setForm((f) => ({
      ...f,
      adimlar: f.adimlar.filter((_, idx) => idx !== i).map((a, idx) => ({ ...a, sira: idx + 1 })),
    }));

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onKaydet({ ...form, adimlar: form.adimlar.filter((a) => a.aciklama.trim()) });
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
          className="w-full max-w-lg glass-card rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-white">
                {duzenlemeModu ? "Prosedürü Düzenle" : "Yeni Prosedür"}
              </h2>
              <p className="text-xs text-[#94a3b8] mt-0.5">Adım adım talimat belgesi</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#94a3b8] hover:text-white hover:bg-[rgba(255,255,255,0.08)] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">Prosedür Başlığı *</label>
              <input required value={form.baslik} onChange={(e) => setField("baslik", e.target.value)}
                placeholder="örn. Sabah Açılış Prosedürü"
                className="w-full px-3 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#94a3b8] focus:outline-none focus:border-[rgba(251,192,36,0.5)] transition-colors text-sm" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">Kategori</label>
                <select value={form.kategori} onChange={(e) => setField("kategori", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white focus:outline-none focus:border-[rgba(251,192,36,0.5)] transition-colors text-sm">
                  {KATEGORILER.map((k) => <option key={k} value={k} className="bg-[#0e172a]">{k}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">Sorumlu</label>
                <select value={form.sorumlu} onChange={(e) => setField("sorumlu", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white focus:outline-none focus:border-[rgba(251,192,36,0.5)] transition-colors text-sm">
                  {SORUMLULAR.map((s) => <option key={s} value={s} className="bg-[#0e172a]">{s}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">Açıklama</label>
              <textarea value={form.aciklama} onChange={(e) => setField("aciklama", e.target.value)}
                placeholder="Bu prosedürün amacı..."
                rows={2}
                className="w-full px-3 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#94a3b8] focus:outline-none focus:border-[rgba(251,192,36,0.5)] transition-colors text-sm resize-none" />
            </div>

            <div className="border-t border-[rgba(255,255,255,0.06)] pt-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-[#94a3b8] font-semibold uppercase tracking-wider">Adımlar</p>
                <button type="button" onClick={adimEkle}
                  className="flex items-center gap-1 text-xs text-[#fbc024] hover:text-[#d9a61f] transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Adım Ekle
                </button>
              </div>
              <div className="space-y-2">
                {form.adimlar.map((adim, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[rgba(251,192,36,0.15)] border border-[rgba(251,192,36,0.3)] text-[#fbc024] text-xs font-bold flex items-center justify-center shrink-0">
                      {adim.sira}
                    </span>
                    <input
                      value={adim.aciklama}
                      onChange={(e) => adimGuncelle(i, e.target.value)}
                      placeholder={`${adim.sira}. adımı açıkla...`}
                      className="flex-1 px-3 py-2 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] text-white placeholder-[#94a3b8] focus:outline-none focus:border-[rgba(251,192,36,0.4)] transition-colors text-sm"
                    />
                    {form.adimlar.length > 1 && (
                      <button type="button" onClick={() => adimSil(i)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-[#94a3b8] hover:text-[#ef4444] transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-[rgba(255,255,255,0.1)] text-[#94a3b8] text-sm font-medium hover:bg-[rgba(255,255,255,0.05)] transition-colors">
                İptal
              </button>
              <button type="submit"
                className="flex-1 py-3 rounded-xl bg-[#fbc024] text-[#0e172a] text-sm font-bold hover:bg-[#d9a61f] transition-colors">
                {duzenlemeModu ? "Kaydet" : "Oluştur"}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
