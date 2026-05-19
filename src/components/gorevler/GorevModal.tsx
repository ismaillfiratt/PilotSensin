"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UserPlus } from "lucide-react";
import {
  ONCELIK_CONFIG, DURUM_CONFIG, DURUM_SIRASI,
  type Gorev, type Oncelik, type GorevDurumu,
} from "@/lib/gorev-data";
import { useGorevler } from "@/store/gorevler";

interface Props {
  open: boolean;
  onClose: () => void;
  gorev?: Gorev | null;
  varsayilanDurum?: GorevDurumu;
  onKaydet: (g: Omit<Gorev, "id" | "olusturmaTarih">) => void;
}

const bosForm = {
  baslik: "", aciklama: "", sorumlu: "",
  sonTarih: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
  oncelik: "normal" as Oncelik,
  durum: "yapilacak" as GorevDurumu,
};

export default function GorevModal({ open, onClose, gorev, varsayilanDurum, onKaydet }: Props) {
  const { sorumlular, sorumluEkle, sorumluSil } = useGorevler();
  const [form, setForm]               = useState({ ...bosForm, sorumlu: sorumlular[0] ?? "" });
  const [yeniSorumlu, setYeniSorumlu] = useState("");
  const [sorumluPaneli, setSorumluPaneli] = useState(false);
  const duzenlemeModu = !!gorev;

  useEffect(() => {
    if (gorev) {
      setForm({
        baslik: gorev.baslik, aciklama: gorev.aciklama,
        sorumlu: gorev.sorumlu, oncelik: gorev.oncelik, durum: gorev.durum,
        sonTarih: gorev.sonTarih.split("T")[0],
      });
    } else {
      setForm({ ...bosForm, durum: varsayilanDurum ?? "yapilacak", sorumlu: sorumlular[0] ?? "" });
    }
    setSorumluPaneli(false);
    setYeniSorumlu("");
  }, [gorev, varsayilanDurum, open]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const ekleYeniSorumlu = () => {
    const temiz = yeniSorumlu.trim();
    if (!temiz) return;
    sorumluEkle(temiz);
    setForm((f) => ({ ...f, sorumlu: temiz }));
    setYeniSorumlu("");
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onKaydet({
      baslik: form.baslik, aciklama: form.aciklama, sorumlu: form.sorumlu,
      oncelik: form.oncelik, durum: form.durum,
      sonTarih: new Date(form.sonTarih).toISOString(),
    });
    onClose();
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
        drag="y" dragConstraints={{ top: 0 }} dragElastic={{ top: 0, bottom: 0.3 }}
        onDragEnd={(_, info) => { if (info.velocity.y > 300 || info.offset.y > 120) onClose(); }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed z-50 bg-white card bottom-0 inset-x-0 rounded-t-2xl border-t border-gray-200 max-h-[92vh] overflow-y-auto md:bottom-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:border md:max-w-md md:w-full"
      >
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className="w-12 h-1 rounded-full bg-gray-200" />
        </div>

        <div className="flex items-start justify-between px-6 pt-4 pb-2 md:pt-6 md:pb-0">
          <h2 className="text-lg font-bold text-gray-800">
            {duzenlemeModu ? "Görevi Düzenle" : "Yeni Görev"}
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-800 hover:bg-gray-50 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form id="gorev-modal-form" onSubmit={handleSubmit} className="space-y-4 px-6 pt-4 pb-2">
            <div>
              <label className="text-xs text-gray-400 font-medium block mb-1.5">Görev Başlığı *</label>
              <input required value={form.baslik} onChange={(e) => set("baslik", e.target.value)}
                placeholder="Ne yapılacak?"
                className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-[#94a3b8] focus:outline-none focus:border-[var(--leaf)] transition-colors text-sm" />
            </div>

            <div>
              <label className="text-xs text-gray-400 font-medium block mb-1.5">Açıklama</label>
              <textarea value={form.aciklama} onChange={(e) => set("aciklama", e.target.value)}
                placeholder="Detaylar, notlar..." rows={2}
                className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-[#94a3b8] focus:outline-none focus:border-[var(--leaf)] transition-colors text-sm resize-none" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Sorumlu */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs text-gray-400 font-medium">Sorumlu</label>
                  <button type="button" onClick={() => setSorumluPaneli(!sorumluPaneli)}
                    className="flex items-center gap-1 text-[10px] text-[var(--leaf)] hover:underline">
                    <UserPlus className="w-3 h-3" />
                    {sorumluPaneli ? "Kapat" : "Yönet"}
                  </button>
                </div>
                <select value={form.sorumlu} onChange={(e) => set("sorumlu", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:outline-none focus:border-[var(--leaf)] transition-colors text-sm">
                  {sorumlular.map((s) => <option key={s} value={s} className="bg-white">{s}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-400 font-medium block mb-1.5">Son Tarih *</label>
                <input type="date" required value={form.sonTarih} onChange={(e) => set("sonTarih", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:outline-none focus:border-[var(--leaf)] transition-colors text-sm scheme-dark" />
              </div>
            </div>

            {/* Sorumlu yönetim paneli */}
            <AnimatePresence>
              {sorumluPaneli && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }} className="overflow-hidden"
                >
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
                    <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Kişi Listesi</p>
                    <div className="flex flex-wrap gap-2">
                      {sorumlular.map((s) => (
                        <div key={s} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200">
                          <span className="text-xs text-gray-800">{s}</span>
                          <button type="button" onClick={() => sorumluSil(s)}
                            className="text-gray-500 hover:text-[#ef4444] transition-colors ml-1">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input value={yeniSorumlu} onChange={(e) => setYeniSorumlu(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), ekleYeniSorumlu())}
                        placeholder="Yeni isim..."
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-800 text-xs placeholder-[#94a3b8] focus:outline-none focus:border-[var(--leaf)]" />
                      <button type="button" onClick={ekleYeniSorumlu}
                        className="px-3 py-1.5 rounded-lg bg-white text-gray-900 text-xs font-bold">
                        Ekle
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="text-xs text-gray-400 font-medium block mb-2">Öncelik</label>
              <div className="grid grid-cols-4 gap-2">
                {(Object.entries(ONCELIK_CONFIG) as [Oncelik, typeof ONCELIK_CONFIG[Oncelik]][]).map(([key, cfg]) => (
                  <button key={key} type="button" onClick={() => set("oncelik", key)}
                    className="py-2 rounded-xl text-xs font-medium border transition-all"
                    style={{
                      borderColor: form.oncelik === key ? cfg.color : "rgba(255,255,255,0.08)",
                      backgroundColor: form.oncelik === key ? cfg.bg : "transparent",
                      color: form.oncelik === key ? cfg.color : "#94a3b8",
                    }}>{cfg.label}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 font-medium block mb-2">Durum</label>
              <div className="grid grid-cols-3 gap-2">
                {DURUM_SIRASI.map((key) => {
                  const cfg = DURUM_CONFIG[key];
                  return (
                    <button key={key} type="button" onClick={() => set("durum", key)}
                      className="py-2 rounded-xl text-xs font-medium border transition-all"
                      style={{
                        borderColor: form.durum === key ? cfg.color : "rgba(255,255,255,0.08)",
                        backgroundColor: form.durum === key ? cfg.bg : "transparent",
                        color: form.durum === key ? cfg.color : "#94a3b8",
                      }}>{cfg.label}</button>
                  );
                })}
              </div>
            </div>

        </form>
        <div className="sticky bottom-0 bg-white px-6 pt-3 pb-4 border-t border-gray-200 md:relative md:border-0 md:pt-2"
          style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 16px)" }}>
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 min-h-12 rounded-xl border border-gray-200 text-gray-400 text-sm font-medium hover:bg-gray-50 transition-colors">
              İptal
            </button>
            <button type="submit" form="gorev-modal-form"
              className="flex-1 min-h-12 rounded-xl bg-[var(--forest)] text-gray-800 text-sm font-bold hover:opacity-90 transition-colors">
              {duzenlemeModu ? "Kaydet" : "Oluştur"}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
