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
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-md glass-card rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-start justify-between mb-6">
            <h2 className="text-lg font-bold text-white">
              {duzenlemeModu ? "Görevi Düzenle" : "Yeni Görev"}
            </h2>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#94a3b8] hover:text-white hover:bg-[rgba(255,255,255,0.08)] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">Görev Başlığı *</label>
              <input required value={form.baslik} onChange={(e) => set("baslik", e.target.value)}
                placeholder="Ne yapılacak?"
                className="w-full px-3 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#94a3b8] focus:outline-none focus:border-[rgba(251,192,36,0.5)] transition-colors text-sm" />
            </div>

            <div>
              <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">Açıklama</label>
              <textarea value={form.aciklama} onChange={(e) => set("aciklama", e.target.value)}
                placeholder="Detaylar, notlar..." rows={2}
                className="w-full px-3 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#94a3b8] focus:outline-none focus:border-[rgba(251,192,36,0.5)] transition-colors text-sm resize-none" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Sorumlu */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs text-[#94a3b8] font-medium">Sorumlu</label>
                  <button type="button" onClick={() => setSorumluPaneli(!sorumluPaneli)}
                    className="flex items-center gap-1 text-[10px] text-[#fbc024] hover:underline">
                    <UserPlus className="w-3 h-3" />
                    {sorumluPaneli ? "Kapat" : "Yönet"}
                  </button>
                </div>
                <select value={form.sorumlu} onChange={(e) => set("sorumlu", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white focus:outline-none focus:border-[rgba(251,192,36,0.5)] transition-colors text-sm">
                  {sorumlular.map((s) => <option key={s} value={s} className="bg-[#0e172a]">{s}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">Son Tarih *</label>
                <input type="date" required value={form.sonTarih} onChange={(e) => set("sonTarih", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white focus:outline-none focus:border-[rgba(251,192,36,0.5)] transition-colors text-sm [color-scheme:dark]" />
              </div>
            </div>

            {/* Sorumlu yönetim paneli */}
            <AnimatePresence>
              {sorumluPaneli && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }} className="overflow-hidden"
                >
                  <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-xl p-3 space-y-2">
                    <p className="text-[11px] text-[#94a3b8] font-semibold uppercase tracking-wider">Kişi Listesi</p>
                    <div className="flex flex-wrap gap-2">
                      {sorumlular.map((s) => (
                        <div key={s} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)]">
                          <span className="text-xs text-white">{s}</span>
                          <button type="button" onClick={() => sorumluSil(s)}
                            className="text-[#64748b] hover:text-[#ef4444] transition-colors ml-1">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input value={yeniSorumlu} onChange={(e) => setYeniSorumlu(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), ekleYeniSorumlu())}
                        placeholder="Yeni isim..."
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white text-xs placeholder-[#94a3b8] focus:outline-none focus:border-[rgba(251,192,36,0.4)]" />
                      <button type="button" onClick={ekleYeniSorumlu}
                        className="px-3 py-1.5 rounded-lg bg-[#fbc024] text-[#0e172a] text-xs font-bold">
                        Ekle
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="text-xs text-[#94a3b8] font-medium block mb-2">Öncelik</label>
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
              <label className="text-xs text-[#94a3b8] font-medium block mb-2">Durum</label>
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
