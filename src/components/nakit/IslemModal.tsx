"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, TrendingDown, Settings2, Plus, Trash2 } from "lucide-react";
import { type Islem, type IslemTipi } from "@/lib/nakit-data";
import { kurus } from "@/lib/para";
import { useNakitAyarlar } from "@/store/nakitAyarlar";

interface Props {
  open:            boolean;
  onClose:         () => void;
  islem?:          Islem | null;
  onKaydet:        (islem: Omit<Islem, "id">) => void;
  varsayilanTip?:  IslemTipi;
}

function localDateStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const bosForm = {
  tip:          "gelir" as IslemTipi,
  tutarKurus:        "",
  kategori:     "",
  aciklama:     "",
  tarih:        localDateStr(),
  odemeYontemi: "nakit" as Islem["odemeYontemi"],
};

export default function IslemModal({ open, onClose, islem, onKaydet, varsayilanTip }: Props) {
  const {
    gelirKategoriler, giderKategoriler, odemeYontemleri,
    kategoriEkle, kategoriSil, odemeEkle, odemeSil,
  } = useNakitAyarlar();

  const [form, setForm]               = useState(bosForm);
  const [katDuzenle, setKatDuzenle]   = useState(false);
  const [odemeDuzenle, setOdemeDuzenle] = useState(false);
  const [yeniKat, setYeniKat]         = useState("");
  const [yeniOdemeVal, setYeniOdemeVal] = useState("");
  const [yeniOdemeLabel, setYeniOdemeLabel] = useState("");

  const duzenlemeModu = !!islem;

  useEffect(() => {
    if (!open) { setKatDuzenle(false); setOdemeDuzenle(false); return; }
    if (islem) {
      setForm({
        tip:          islem.tip,
        tutarKurus:        String(islem.tutarKurus / 100),
        kategori:     islem.kategori,
        aciklama:     islem.aciklama,
        tarih:        islem.tarih.split("T")[0],
        odemeYontemi: islem.odemeYontemi,
      });
    } else {
      const tip     = varsayilanTip ?? "gelir";
      const katlar  = tip === "gelir" ? gelirKategoriler : giderKategoriler;
      setForm({ ...bosForm, tip, tarih: localDateStr(), kategori: katlar[0] ?? "" });
    }
  }, [islem, open, varsayilanTip]); // eslint-disable-line

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const kategoriler = form.tip === "gelir" ? gelirKategoriler : giderKategoriler;

  const handleTipDegis = (yeniTip: IslemTipi) => {
    const katlar = yeniTip === "gelir" ? gelirKategoriler : giderKategoriler;
    setForm((f) => ({ ...f, tip: yeniTip, kategori: katlar[0] ?? "" }));
    setKatDuzenle(false);
  };

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const sayi = parseFloat(form.tutarKurus.replace(",", "."));
    if (isNaN(sayi) || sayi <= 0) return;

    const bugun = localDateStr();
    let tarihISO: string;
    if (form.tarih === bugun) {
      tarihISO = new Date().toISOString();
    } else {
      const [y, m, d] = form.tarih.split("-").map(Number);
      tarihISO = new Date(y, m - 1, d, 12).toISOString();
    }
    onKaydet({
      tip:          form.tip,
      tutarKurus:   kurus(sayi),
      kategori:     form.kategori,
      aciklama:     form.aciklama,
      tarih:        tarihISO,
      odemeYontemi: form.odemeYontemi as Islem["odemeYontemi"],
    });
    onClose();
  };

  const handleKatEkle = () => {
    if (!yeniKat.trim()) return;
    kategoriEkle(form.tip, yeniKat.trim());
    setForm((f) => ({ ...f, kategori: yeniKat.trim() }));
    setYeniKat("");
  };

  const handleOdemeEkle = () => {
    if (!yeniOdemeVal.trim() || !yeniOdemeLabel.trim()) return;
    odemeEkle(yeniOdemeVal.trim().toLowerCase().replace(/\s+/g, "-"), yeniOdemeLabel.trim());
    setYeniOdemeVal(""); setYeniOdemeLabel("");
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        drag="y"
        dragConstraints={{ top: 0 }}
        dragElastic={{ top: 0, bottom: 0.3 }}
        onDragEnd={(_, info) => { if (info.velocity.y > 300 || info.offset.y > 120) onClose(); }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed z-50 bg-white card bottom-0 inset-x-0 rounded-t-2xl border-t border-gray-200 max-h-[92vh] overflow-y-auto md:bottom-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:border md:max-w-md md:w-full"
      >
        <div className="md:hidden flex justify-center pt-3 pb-1 cursor-grab">
          <div className="w-12 h-1 rounded-full bg-gray-200" />
        </div>

        <div className="flex items-start justify-between px-6 pt-4 pb-2 md:pt-6">
          <h2 className="text-lg font-bold text-gray-800">
            {duzenlemeModu ? "İşlemi Düzenle" : "Yeni İşlem Ekle"}
          </h2>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-800 hover:bg-gray-50 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form id="islem-modal-form" onSubmit={handleSubmit} className="space-y-4 px-6 pt-2 pb-2">
            {/* Gelir / Gider */}
            <div className="grid grid-cols-2 gap-2">
              {(["gelir", "gider"] as const).map((t) => {
                const aktif = form.tip === t;
                const renk  = t === "gelir" ? "#22c55e" : "#ef4444";
                const Icon  = t === "gelir" ? TrendingUp : TrendingDown;
                return (
                  <button key={t} type="button" onClick={() => handleTipDegis(t)}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl border transition-all font-semibold text-sm"
                    style={{
                      borderColor:     aktif ? renk : "rgba(255,255,255,0.08)",
                      backgroundColor: aktif ? `${renk}15` : "transparent",
                      color:           aktif ? renk : "#94a3b8",
                    }}>
                    <Icon className="w-4 h-4" />{t === "gelir" ? "Gelir" : "Gider"}
                  </button>
                );
              })}
            </div>

            {/* Tutar */}
            <div>
              <label className="text-xs text-gray-400 font-medium block mb-1.5">Tutar (₺) *</label>
              <input
                type="text"
                inputMode="decimal"
                required
                value={form.tutarKurus}
                onChange={(e) => {
                  const v = e.target.value;
                  if (/^[0-9]*[.,]?[0-9]*$/.test(v)) set("tutarKurus", v);
                }}
                placeholder="0,00"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[var(--leaf)] transition-colors text-xl font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Kategori */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs text-gray-400 font-medium">Kategori *</label>
                  <button type="button" onClick={() => { setKatDuzenle((v) => !v); setOdemeDuzenle(false); }}
                    className={`flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded border transition-colors ${katDuzenle ? "border-[var(--forest-300, #7DD0A0)] text-[var(--leaf)]" : "border-gray-200 text-gray-500"}`}>
                    <Settings2 className="w-2.5 h-2.5" />Düzenle
                  </button>
                </div>
                <select value={form.kategori} onChange={(e) => set("kategori", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:outline-none focus:border-[var(--leaf)] transition-colors text-sm">
                  {kategoriler.map((k) => <option key={k} value={k} className="bg-white">{k}</option>)}
                </select>
              </div>

              {/* Ödeme yöntemi */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs text-gray-400 font-medium">Ödeme Yöntemi</label>
                  <button type="button" onClick={() => { setOdemeDuzenle((v) => !v); setKatDuzenle(false); }}
                    className={`flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded border transition-colors ${odemeDuzenle ? "border-[var(--forest-300, #7DD0A0)] text-[var(--leaf)]" : "border-gray-200 text-gray-500"}`}>
                    <Settings2 className="w-2.5 h-2.5" />Düzenle
                  </button>
                </div>
                <select value={form.odemeYontemi} onChange={(e) => set("odemeYontemi", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:outline-none focus:border-[var(--leaf)] transition-colors text-sm">
                  {odemeYontemleri.map(({ value, label }) => (
                    <option key={value} value={value} className="bg-white">{label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Kategori düzenleme paneli */}
            <AnimatePresence>
              {katDuzenle && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold">
                      {form.tip === "gelir" ? "Gelir" : "Gider"} Kategorileri
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {kategoriler.map((k) => (
                        <div key={k} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-50 border border-gray-200">
                          <span className="text-xs text-gray-800">{k}</span>
                          <button type="button" onClick={() => kategoriSil(form.tip, k)}
                            className="text-gray-500 hover:text-[#ef4444] transition-colors">
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-1.5">
                      <input type="text" value={yeniKat} onChange={(e) => setYeniKat(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleKatEkle(); } }}
                        placeholder="Yeni kategori adı"
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-800 placeholder-[#475569] text-xs focus:outline-none" />
                      <button type="button" onClick={handleKatEkle}
                        className="px-2.5 py-1.5 rounded-lg bg-[rgba(34,197,94,0.15)] text-[#22c55e] hover:bg-[rgba(34,197,94,0.25)] transition-colors">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Ödeme yöntemi düzenleme paneli */}
            <AnimatePresence>
              {odemeDuzenle && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold">Ödeme Yöntemleri</p>
                    <div className="flex flex-wrap gap-1.5">
                      {odemeYontemleri.map((o) => (
                        <div key={o.value} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-50 border border-gray-200">
                          <span className="text-xs text-gray-800">{o.label}</span>
                          <button type="button" onClick={() => odemeSil(o.value)}
                            className="text-gray-500 hover:text-[#ef4444] transition-colors">
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-1.5">
                      <input type="text" value={yeniOdemeLabel} onChange={(e) => setYeniOdemeLabel(e.target.value)}
                        placeholder="Yöntem adı (ör: POS)"
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-800 placeholder-[#475569] text-xs focus:outline-none" />
                      <input type="text" value={yeniOdemeVal} onChange={(e) => setYeniOdemeVal(e.target.value)}
                        placeholder="ID (ör: pos)"
                        className="w-20 px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-800 placeholder-[#475569] text-xs focus:outline-none" />
                      <button type="button" onClick={handleOdemeEkle}
                        className="px-2.5 py-1.5 rounded-lg bg-[rgba(34,197,94,0.15)] text-[#22c55e] hover:bg-[rgba(34,197,94,0.25)] transition-colors">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* İşlem Tarihi (renamed from Tarih) */}
            <div>
              <label className="text-xs text-gray-400 font-medium block mb-1.5">İşlem Tarihi *</label>
              <input
                type="date" required
                value={form.tarih}
                max={localDateStr()}
                onChange={(e) => set("tarih", e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:outline-none focus:border-[var(--leaf)] transition-colors text-sm [color-scheme:dark]"
              />
            </div>

            {/* Açıklama */}
            <div>
              <label className="text-xs text-gray-400 font-medium block mb-1.5">Açıklama</label>
              <input type="text" value={form.aciklama} onChange={(e) => set("aciklama", e.target.value)}
                placeholder="Kısa not..."
                className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[var(--leaf)] transition-colors text-sm" />
            </div>

        </form>
        <div className="sticky bottom-0 bg-white px-6 pt-3 pb-4 border-t border-gray-200 md:relative md:border-0 md:pt-2"
          style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 16px)" }}>
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 min-h-12 rounded-xl border border-gray-200 text-gray-400 text-sm font-medium hover:bg-gray-50 transition-colors">
              İptal
            </button>
            <button type="submit" form="islem-modal-form"
              className="flex-1 min-h-12 rounded-xl bg-[var(--forest)] text-white text-sm font-bold hover:opacity-90 transition-colors">
              {duzenlemeModu ? "Kaydet" : "Ekle"}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
