"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, AlertTriangle, PiggyBank, ArrowUpFromLine } from "lucide-react";
import { formatTL, type FonIslem } from "@/lib/acil-fon-data";
import IslemModal from "./IslemModal";

interface Props {
  islemler: FonIslem[];
  setIslemler: React.Dispatch<React.SetStateAction<FonIslem[]>>;
}

export default function IslemGecmisi({ islemler, setIslemler }: Props) {
  const [modalAcik, setModalAcik] = useState(false);
  const [silOnayi, setSilOnayi]   = useState<FonIslem | null>(null);

  const sirali = [...islemler].sort((a, b) => new Date(b.tarih).getTime() - new Date(a.tarih).getTime());

  const tarihFormat = (iso: string) =>
    new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <>
      <div className="glass-card rounded-2xl overflow-hidden">
        {/* Başlık */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(255,255,255,0.06)]">
          <div>
            <h2 className="text-sm font-semibold text-white">İşlem Geçmişi</h2>
            <p className="text-xs text-[#94a3b8] mt-0.5">{islemler.length} kayıt</p>
          </div>
          <button
            onClick={() => setModalAcik(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#fbc024] text-[#0e172a] text-sm font-bold hover:bg-[#d9a61f] transition-colors"
          >
            <Plus className="w-4 h-4" /> Hareket Ekle
          </button>
        </div>

        {/* Tablo başlıkları */}
        <div className="grid grid-cols-[auto_1fr_1fr_auto_auto] gap-4 px-5 py-3 border-b border-[rgba(255,255,255,0.06)] text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">
          <span>Tip</span>
          <span>Açıklama</span>
          <span>Tarih</span>
          <span>Tutar</span>
          <span></span>
        </div>

        {/* Satırlar */}
        <div className="divide-y divide-[rgba(255,255,255,0.04)]">
          {sirali.length === 0 ? (
            <div className="py-16 text-center text-[#94a3b8] text-sm">Henüz işlem yok.</div>
          ) : (
            sirali.map((islem, i) => {
              const yatirmaMi = islem.tip === "yatirma";
              return (
                <motion.div
                  key={islem.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="grid grid-cols-[auto_1fr_1fr_auto_auto] gap-4 px-5 py-3.5 items-center hover:bg-[rgba(251,192,36,0.03)] transition-colors"
                >
                  {/* Tip ikonu */}
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: yatirmaMi ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)" }}>
                    {yatirmaMi
                      ? <PiggyBank className="w-4 h-4 text-[#22c55e]" />
                      : <ArrowUpFromLine className="w-4 h-4 text-[#ef4444]" />}
                  </div>

                  {/* Açıklama */}
                  <p className="text-sm text-white font-medium truncate">{islem.aciklama || "—"}</p>

                  {/* Tarih */}
                  <p className="text-xs text-[#94a3b8]">{tarihFormat(islem.tarih)}</p>

                  {/* Tutar */}
                  <span className="text-sm font-bold" style={{ color: yatirmaMi ? "#22c55e" : "#ef4444" }}>
                    {yatirmaMi ? "+" : "-"}{formatTL(islem.tutar)}
                  </span>

                  {/* Sil */}
                  <button onClick={() => setSilOnayi(islem)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-[#94a3b8] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(239,68,68,0.4)] hover:text-[#ef4444] transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      <IslemModal
        open={modalAcik}
        onClose={() => setModalAcik(false)}
        onKaydet={(yeni) => setIslemler((p) => [{ ...yeni, id: Date.now().toString() }, ...p])}
      />

      {/* Silme onayı */}
      <AnimatePresence>
        {silOnayi && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setSilOnayi(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.18 }}
              className="w-full max-w-sm glass-card rounded-2xl p-6"
            >
              <div className="w-12 h-12 rounded-xl bg-[rgba(239,68,68,0.12)] border border-[rgba(239,68,68,0.25)] flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-[#ef4444]" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">İşlemi Sil</h3>
              <p className="text-sm text-[#94a3b8] mb-6">
                <span className="text-white font-semibold">{formatTL(silOnayi.tutar)}</span> tutarındaki işlemi silmek istediğinizden emin misiniz?
              </p>
              <div className="flex gap-3">
                <button onClick={() => setSilOnayi(null)}
                  className="flex-1 py-2.5 rounded-xl border border-[rgba(255,255,255,0.1)] text-[#94a3b8] text-sm font-medium hover:bg-[rgba(255,255,255,0.05)] transition-colors">
                  İptal
                </button>
                <button onClick={() => { setIslemler((p) => p.filter((i) => i.id !== silOnayi.id)); setSilOnayi(null); }}
                  className="flex-1 py-2.5 rounded-xl bg-[#ef4444] text-white text-sm font-bold hover:bg-[#dc2626] transition-colors">
                  Evet, Sil
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
