"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { type Urun } from "@/lib/stok-data";

interface Props {
  open: boolean;
  onClose: () => void;
  urun?: Urun | null; // dolu gelirse düzenleme modu
}

const kategoriler = ["Süt Ürünleri", "Unlu Mamüller", "İçecek", "Yağ", "Bakliyat", "Temizlik", "Diğer"];
const birimler = ["adet", "kg", "lt", "paket", "kutu"];

const bosForm = {
  ad: "", sku: "", kategori: "Diğer", birim: "adet",
  mevcutAdet: "", emniyetStogu: "", kritikStok: "", gunlukSatis: "",
};

export default function UrunEkleModal({ open, onClose, urun }: Props) {
  const duzenlemeModu = !!urun;

  const [form, setForm] = useState(bosForm);

  // Modal açıldığında formu doldur
  useEffect(() => {
    if (urun) {
      setForm({
        ad: urun.ad,
        sku: urun.sku,
        kategori: urun.kategori,
        birim: urun.birim,
        mevcutAdet: String(urun.mevcutAdet),
        emniyetStogu: String(urun.emniyetStogu),
        kritikStok: String(urun.kritikStok),
        gunlukSatis: String(urun.gunlukSatis),
      });
    } else {
      setForm(bosForm);
    }
  }, [urun, open]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Mock: gerçek DB bağlantısında buraya save çağrısı gelecek
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
          className="w-full max-w-lg glass-card rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-white">
                {duzenlemeModu ? "Ürünü Düzenle" : "Yeni Ürün Ekle"}
              </h2>
              {duzenlemeModu && (
                <p className="text-xs text-[#94a3b8] mt-0.5">{urun.sku}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-[#94a3b8] hover:text-white hover:bg-[rgba(255,255,255,0.08)] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">Ürün Adı *</label>
                <input
                  required
                  value={form.ad}
                  onChange={(e) => set("ad", e.target.value)}
                  placeholder="örn. Süt 1L"
                  className="w-full px-3 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#94a3b8] focus:outline-none focus:border-[rgba(251,192,36,0.5)] transition-colors text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">SKU / Barkod</label>
                <input
                  value={form.sku}
                  onChange={(e) => set("sku", e.target.value)}
                  placeholder="SUT-001"
                  className="w-full px-3 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#94a3b8] focus:outline-none focus:border-[rgba(251,192,36,0.5)] transition-colors text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">Birim</label>
                <select
                  value={form.birim}
                  onChange={(e) => set("birim", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white focus:outline-none focus:border-[rgba(251,192,36,0.5)] transition-colors text-sm"
                >
                  {birimler.map((b) => <option key={b} value={b} className="bg-[#0e172a]">{b}</option>)}
                </select>
              </div>

              <div className="col-span-2">
                <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">Kategori</label>
                <select
                  value={form.kategori}
                  onChange={(e) => set("kategori", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white focus:outline-none focus:border-[rgba(251,192,36,0.5)] transition-colors text-sm"
                >
                  {kategoriler.map((k) => <option key={k} value={k} className="bg-[#0e172a]">{k}</option>)}
                </select>
              </div>
            </div>

            <div className="border-t border-[rgba(255,255,255,0.06)] pt-4">
              <p className="text-xs text-[#94a3b8] font-semibold uppercase tracking-wider mb-3">Stok Seviyeleri</p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: "mevcutAdet", label: "Mevcut Adet *", placeholder: "0", required: true },
                  { key: "gunlukSatis", label: "Ort. Günlük Satış", placeholder: "0", required: false },
                  { key: "emniyetStogu", label: "Emniyet Stoğu *", placeholder: "10", required: true },
                  { key: "kritikStok", label: "Kritik Stok *", placeholder: "5", required: true },
                ].map(({ key, label, placeholder, required }) => (
                  <div key={key}>
                    <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">{label}</label>
                    <input
                      type="number"
                      min="0"
                      required={required}
                      value={form[key as keyof typeof form]}
                      onChange={(e) => set(key, e.target.value)}
                      placeholder={placeholder}
                      className="w-full px-3 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#94a3b8] focus:outline-none focus:border-[rgba(251,192,36,0.5)] transition-colors text-sm"
                    />
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-[#94a3b8] mt-2">
                Emniyet stoğu → sarı uyarı &nbsp;|&nbsp; Kritik stok → kırmızı alarm
              </p>
            </div>

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
                {duzenlemeModu ? "Değişiklikleri Kaydet" : "Ürün Ekle"}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
