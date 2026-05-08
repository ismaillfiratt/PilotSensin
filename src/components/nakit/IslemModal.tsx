"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, TrendingDown } from "lucide-react";
import {
  type Islem,
  type IslemTipi,
  GELIR_KATEGORILERI,
  GIDER_KATEGORILERI,
} from "@/lib/nakit-data";

interface Props {
  open: boolean;
  onClose: () => void;
  islem?: Islem | null;
  onKaydet: (islem: Omit<Islem, "id">) => void;
  varsayilanTip?: IslemTipi;
}

const odemeYontemleri = [
  { value: "nakit", label: "Nakit" },
  { value: "kart", label: "Kart" },
  { value: "havale", label: "Havale / EFT" },
  { value: "cek", label: "Çek" },
] as const;

function localDateStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

const bosForm = {
  tip: "gelir" as IslemTipi,
  tutar: "",
  kategori: "Satış",
  aciklama: "",
  tarih: localDateStr(),
  odemeYontemi: "nakit" as Islem["odemeYontemi"],
};

export default function IslemModal({ open, onClose, islem, onKaydet, varsayilanTip }: Props) {
  const [form, setForm] = useState(bosForm);
  const duzenlemeModu = !!islem;

  useEffect(() => {
    if (islem) {
      setForm({
        tip: islem.tip,
        tutar: String(islem.tutar),
        kategori: islem.kategori,
        aciklama: islem.aciklama,
        tarih: islem.tarih.split("T")[0],
        odemeYontemi: islem.odemeYontemi,
      });
    } else {
      const tip = varsayilanTip ?? "gelir";
      setForm({
        ...bosForm,
        tip,
        kategori: tip === "gelir" ? GELIR_KATEGORILERI[0] : GIDER_KATEGORILERI[0],
      });
    }
  }, [islem, open, varsayilanTip]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const kategoriler = form.tip === "gelir" ? GELIR_KATEGORILERI : GIDER_KATEGORILERI;

  const handleTipDegis = (yeniTip: IslemTipi) => {
    const ilkKategori = yeniTip === "gelir" ? GELIR_KATEGORILERI[0] : GIDER_KATEGORILERI[0];
    setForm((f) => ({ ...f, tip: yeniTip, kategori: ilkKategori }));
  };

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    onKaydet({
      tip: form.tip,
      tutar: Number(form.tutar),
      kategori: form.kategori,
      aciklama: form.aciklama,
      tarih: (() => { const [y,m,d] = form.tarih.split("-").map(Number); return new Date(y, m-1, d, 12).toISOString(); })(),
      odemeYontemi: form.odemeYontemi,
    });
    onClose();
  };

  if (!open) return null;

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
          {/* Başlık */}
          <div className="flex items-start justify-between mb-6">
            <h2 className="text-lg font-bold text-white">
              {duzenlemeModu ? "İşlemi Düzenle" : "Yeni İşlem Ekle"}
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-[#94a3b8] hover:text-white hover:bg-[rgba(255,255,255,0.08)] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Gelir / Gider seçimi */}
            <div className="grid grid-cols-2 gap-2">
              {(["gelir", "gider"] as const).map((t) => {
                const aktif = form.tip === t;
                const renk = t === "gelir" ? "#22c55e" : "#ef4444";
                const Icon = t === "gelir" ? TrendingUp : TrendingDown;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleTipDegis(t)}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl border transition-all font-semibold text-sm"
                    style={{
                      borderColor: aktif ? renk : "rgba(255,255,255,0.08)",
                      backgroundColor: aktif ? `${renk}15` : "transparent",
                      color: aktif ? renk : "#94a3b8",
                    }}
                  >
                    <Icon className="w-4 h-4" />
                    {t === "gelir" ? "Gelir" : "Gider"}
                  </button>
                );
              })}
            </div>

            {/* Tutar */}
            <div>
              <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">Tutar (₺) *</label>
              <input
                type="number"
                min="1"
                required
                value={form.tutar}
                onChange={(e) => set("tutar", e.target.value)}
                placeholder="0,00"
                className="w-full px-4 py-3 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#94a3b8] focus:outline-none focus:border-[rgba(251,192,36,0.5)] transition-colors text-xl font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Kategori */}
              <div>
                <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">Kategori *</label>
                <select
                  value={form.kategori}
                  onChange={(e) => set("kategori", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white focus:outline-none focus:border-[rgba(251,192,36,0.5)] transition-colors text-sm"
                >
                  {kategoriler.map((k) => (
                    <option key={k} value={k} className="bg-[#0e172a]">{k}</option>
                  ))}
                </select>
              </div>

              {/* Ödeme yöntemi */}
              <div>
                <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">Ödeme Yöntemi</label>
                <select
                  value={form.odemeYontemi}
                  onChange={(e) => set("odemeYontemi", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white focus:outline-none focus:border-[rgba(251,192,36,0.5)] transition-colors text-sm"
                >
                  {odemeYontemleri.map(({ value, label }) => (
                    <option key={value} value={value} className="bg-[#0e172a]">{label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tarih */}
            <div>
              <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">Tarih *</label>
              <input
                type="date"
                required
                value={form.tarih}
                onChange={(e) => set("tarih", e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white focus:outline-none focus:border-[rgba(251,192,36,0.5)] transition-colors text-sm [color-scheme:dark]"
              />
            </div>

            {/* Açıklama */}
            <div>
              <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">Açıklama</label>
              <input
                type="text"
                value={form.aciklama}
                onChange={(e) => set("aciklama", e.target.value)}
                placeholder="Kısa not..."
                className="w-full px-3 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#94a3b8] focus:outline-none focus:border-[rgba(251,192,36,0.5)] transition-colors text-sm"
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
                {duzenlemeModu ? "Kaydet" : "Ekle"}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
