"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Pencil, Trash2, AlertTriangle, Search,
  ChevronDown, ChevronRight, Clock, User, List,
} from "lucide-react";
import { getKategoriRenk, prosedurDurumu, type Prosedur } from "@/lib/prosedur-data";
import { useProsedurler } from "@/store/prosedurler";
import ProsedurModal from "./ProsedurModal";

export default function ProsedurListesi() {
  const { prosedurler, prosedurEkle, prosedurGuncelle, prosedurSil } = useProsedurler();
  const [arama,     setArama]     = useState("");
  const [acik,      setAcik]      = useState<string | null>(null);
  const [modalAcik, setModalAcik] = useState(false);
  const [duzenle,   setDuzenle]   = useState<Prosedur | null>(null);
  const [silOnayi,  setSilOnayi]  = useState<Prosedur | null>(null);

  const filtrelenmis = useMemo(() =>
    prosedurler.filter(p =>
      arama === "" ||
      p.baslik.toLowerCase().includes(arama.toLowerCase()) ||
      p.kategori.toLowerCase().includes(arama.toLowerCase())
    ), [prosedurler, arama]);

  const handleKaydet = (form: Omit<Prosedur, "id" | "sonGuncelleme">) => {
    if (duzenle) { prosedurGuncelle(duzenle.id, form); setDuzenle(null); }
    else         { prosedurEkle(form); }
    setModalAcik(false);
  };

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
          <input
            value={arama}
            onChange={e => setArama(e.target.value)}
            placeholder="Prosedür ara..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#94a3b8] text-sm focus:outline-none focus:border-[rgba(251,192,36,0.4)] transition-colors"
          />
        </div>
        <button
          onClick={() => { setDuzenle(null); setModalAcik(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#fbc024] text-[#0e172a] text-sm font-bold hover:bg-[#d9a61f] transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" /> Prosedür Ekle
        </button>
      </div>

      {/* Kart Listesi */}
      <div className="space-y-3">
        {filtrelenmis.length === 0 && (
          <div className="py-16 text-center text-[#94a3b8] text-sm glass-card rounded-2xl">
            Prosedür bulunamadı.
          </div>
        )}

        {filtrelenmis.map((p, i) => {
          const durum  = prosedurDurumu(p.sonGuncelleme);
          const kRenk  = getKategoriRenk(p.kategori);
          const acikMi = acik === p.id;

          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="glass-card rounded-2xl overflow-hidden"
            >
              <div className="flex">
                {/* Sol renk çubuğu — kategoriye göre */}
                <div
                  className="w-[3px] shrink-0"
                  style={{ backgroundColor: kRenk.color, opacity: 0.8 }}
                />

                {/* Kart içeriği */}
                <div className="flex-1 min-w-0 px-4 pt-4 pb-3">

                  {/* Üst satır: chevron + başlık + aksiyonlar */}
                  <div
                    className="flex items-start gap-2.5 cursor-pointer group"
                    onClick={() => setAcik(acikMi ? null : p.id)}
                  >
                    {/* Expand/collapse ikonu */}
                    <span className="shrink-0 mt-[1px] text-[#475569] group-hover:text-[#94a3b8] transition-colors">
                      {acikMi
                        ? <ChevronDown  className="w-4 h-4" />
                        : <ChevronRight className="w-4 h-4" />}
                    </span>

                    {/* Başlık */}
                    <h3 className="flex-1 min-w-0 text-sm font-bold text-white leading-snug group-hover:text-[#e2e8f0] transition-colors">
                      {p.baslik}
                    </h3>

                    {/* Aksiyon butonları */}
                    <div className="flex items-center gap-1 shrink-0 ml-2" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => { setDuzenle(p); setModalAcik(true); }}
                        title="Düzenle"
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-[#475569] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(251,192,36,0.4)] hover:text-[#fbc024] hover:bg-[rgba(251,192,36,0.06)] transition-all"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setSilOnayi(p)}
                        title="Sil"
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-[#475569] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(239,68,68,0.4)] hover:text-[#ef4444] hover:bg-[rgba(239,68,68,0.06)] transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Meta satırı */}
                  <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                    {/* Kategori badge */}
                    <span
                      className="inline-flex items-center text-[10px] font-bold px-2 py-[3px] rounded-md whitespace-nowrap"
                      style={{ color: kRenk.color, backgroundColor: kRenk.bg }}
                    >
                      {p.kategori}
                    </span>

                    <span className="text-[#2d3f55] text-xs select-none">·</span>

                    {/* Sorumlu */}
                    <span className="flex items-center gap-1 text-[11px] text-[#64748b] whitespace-nowrap">
                      <User className="w-3 h-3 shrink-0" />
                      {p.sorumlu}
                    </span>

                    <span className="text-[#2d3f55] text-xs select-none">·</span>

                    {/* Tarih */}
                    <span
                      className="flex items-center gap-1 text-[11px] whitespace-nowrap"
                      style={{ color: durum.renk }}
                    >
                      <Clock className="w-3 h-3 shrink-0" />
                      {durum.gun === 0 ? "Bugün güncellendi" : `${durum.gun}g önce · ${durum.etiket}`}
                    </span>

                    {/* Adım sayacı — sağa it */}
                    <span className="ml-auto flex items-center gap-1.5 text-[11px] text-[#475569] whitespace-nowrap bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] px-2 py-[3px] rounded-md">
                      <List className="w-3 h-3" />
                      {p.adimlar.length} adım
                    </span>
                  </div>
                </div>
              </div>

              {/* Genişletilmiş adımlar */}
              <AnimatePresence>
                {acikMi && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <div className="px-5 py-4 space-y-2.5">
                      {p.aciklama && (
                        <p className="text-xs text-[#64748b] italic pb-2.5 border-b border-[rgba(255,255,255,0.05)]">
                          {p.aciklama}
                        </p>
                      )}
                      {p.adimlar.length === 0 && (
                        <p className="text-xs text-[#475569] text-center py-2">Henüz adım eklenmemiş.</p>
                      )}
                      {p.adimlar.map(adim => (
                        <div key={adim.sira} className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-full bg-[rgba(251,192,36,0.12)] border border-[rgba(251,192,36,0.25)] text-[#fbc024] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {adim.sira}
                          </span>
                          <p className="text-sm text-[#94a3b8] leading-relaxed">{adim.aciklama}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      <ProsedurModal
        open={modalAcik}
        onClose={() => { setModalAcik(false); setDuzenle(null); }}
        prosedur={duzenle}
        onKaydet={handleKaydet}
      />

      {/* Silme onayı */}
      <AnimatePresence>
        {silOnayi && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setSilOnayi(null)}
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
              <h3 className="text-base font-bold text-white mb-1">Prosedürü Sil</h3>
              <p className="text-sm text-[#94a3b8] mb-6">
                <span className="text-white font-semibold">{silOnayi.baslik}</span> prosedürünü kalıcı olarak silmek istiyor musunuz?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setSilOnayi(null)}
                  className="flex-1 py-2.5 rounded-xl border border-[rgba(255,255,255,0.1)] text-[#94a3b8] text-sm font-medium hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={() => { prosedurSil(silOnayi.id); setSilOnayi(null); }}
                  className="flex-1 py-2.5 rounded-xl bg-[#ef4444] text-white text-sm font-bold hover:bg-[#dc2626] transition-colors"
                >
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
