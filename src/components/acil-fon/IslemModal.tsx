"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Banknote, ArrowUpFromLine } from "lucide-react";
import { type FonIslem, type IslemTipi } from "@/lib/acil-fon-data";
import { useAcilFon } from "@/store/acilFon";

interface Props {
  open:         boolean;
  onClose:      () => void;
  onKaydet:     (i: Omit<FonIslem, "id">) => void;
  mevcutIslem?: FonIslem;
  defaultHedefId?: string | null;
}

function localDateStr(iso?: string) {
  const d = iso ? new Date(iso) : new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function fmt(n: number) { return n > 0 ? n.toLocaleString("tr-TR") : ""; }
function parse(s: string) { return parseInt(s.replace(/\./g, "").replace(/[^0-9]/g, ""), 10) || 0; }

export default function IslemModal({ open, onClose, onKaydet, mevcutIslem, defaultHedefId }: Props) {
  const { hedefler } = useAcilFon();

  const [tip,      setTip]     = useState<IslemTipi>("yatirma");
  const [tutar,    setTutar]   = useState("");
  const [aciklama, setAcikl]   = useState("");
  const [tarih,    setTarih]   = useState(localDateStr());
  const [hedefId,  setHedefId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (open) {
      setTip(mevcutIslem?.tip ?? "yatirma");
      setTutar(mevcutIslem?.tutar ? fmt(mevcutIslem.tutar) : "");
      setAcikl(mevcutIslem?.aciklama ?? "");
      setTarih(mevcutIslem ? localDateStr(mevcutIslem.tarih) : localDateStr());
      setHedefId(mevcutIslem?.hedefId ?? defaultHedefId ?? hedefler[0]?.id ?? undefined);
    }
  }, [open, mevcutIslem, defaultHedefId, hedefler]);

  const handleTutar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const n = parseInt(e.target.value.replace(/\./g, "").replace(/[^0-9]/g, ""), 10) || 0;
    setTutar(fmt(n));
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const tutarVal = parse(tutar);
    if (tutarVal <= 0) return;
    const [y, m, d] = tarih.split("-").map(Number);
    onKaydet({ tip, tutar: tutarVal, aciklama, tarih: new Date(y, m - 1, d, 12).toISOString(), hedefId });
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
          className="w-full max-w-sm glass-card rounded-2xl p-6"
        >
          <div className="flex items-start justify-between mb-6">
            <h2 className="text-lg font-bold text-white">
              {mevcutIslem ? "Hareketi Düzenle" : "Fon Hareketi"}
            </h2>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#94a3b8] hover:text-white hover:bg-[rgba(255,255,255,0.08)] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Hedef seçimi — birden fazla hedef varsa */}
            {hedefler.length > 0 && (
              <div>
                <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">Hedef</label>
                <select
                  value={hedefId ?? ""}
                  onChange={(e) => setHedefId(e.target.value || undefined)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white text-sm focus:outline-none focus:border-[rgba(251,192,36,0.5)] transition-colors"
                >
                  <option value="">Hedefe bağlı değil</option>
                  {hedefler.map(h => (
                    <option key={h.id} value={h.id}>{h.ad}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Tip */}
            <div className="grid grid-cols-2 gap-2">
              {([
                { v: "yatirma", label: "Fona Yatır",  icon: Banknote,        renk: "#22c55e" },
                { v: "cekme",   label: "Fondan Çek",  icon: ArrowUpFromLine, renk: "#ef4444" },
              ] as const).map(({ v, label, icon: Icon, renk }) => (
                <button key={v} type="button" onClick={() => setTip(v)}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl border transition-all font-semibold text-sm"
                  style={{
                    borderColor:     tip === v ? renk : "rgba(255,255,255,0.08)",
                    backgroundColor: tip === v ? `${renk}15` : "transparent",
                    color:           tip === v ? renk : "#94a3b8",
                  }}>
                  <Icon className="w-4 h-4" />{label}
                </button>
              ))}
            </div>

            {/* Tutar */}
            <div>
              <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">Tutar (₺) *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8] text-sm font-bold">₺</span>
                <input type="text" inputMode="numeric" required value={tutar} onChange={handleTutar}
                  placeholder="0"
                  className="w-full pl-8 pr-4 py-3 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#94a3b8] focus:outline-none focus:border-[rgba(251,192,36,0.5)] transition-colors text-xl font-bold" />
              </div>
            </div>

            {/* Tarih */}
            <div>
              <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">Tarih</label>
              <input type="date" value={tarih} onChange={(e) => setTarih(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white focus:outline-none focus:border-[rgba(251,192,36,0.5)] transition-colors text-sm scheme-dark" />
            </div>

            {/* Açıklama */}
            <div>
              <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">Açıklama</label>
              <input type="text" value={aciklama} onChange={(e) => setAcikl(e.target.value)}
                placeholder="örn. Aylık birikim, Acil tamir..."
                className="w-full px-3 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#94a3b8] focus:outline-none focus:border-[rgba(251,192,36,0.5)] transition-colors text-sm" />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-[rgba(255,255,255,0.1)] text-[#94a3b8] text-sm font-medium hover:bg-[rgba(255,255,255,0.05)] transition-colors">
                İptal
              </button>
              <button type="submit"
                className="flex-1 py-3 rounded-xl bg-[#fbc024] text-[#0e172a] text-sm font-bold hover:bg-[#d9a61f] transition-colors">
                {mevcutIslem ? "Güncelle" : "Kaydet"}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
