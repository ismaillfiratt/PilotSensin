"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, AlertTriangle, Search, ChevronDown, ChevronRight, Clock, User } from "lucide-react";
import { KATEGORI_RENK, prosedurDurumu, type Prosedur } from "@/lib/prosedur-data";
import ProsedurModal from "./ProsedurModal";

interface Props {
  prosedurler: Prosedur[];
  setProsedurler: React.Dispatch<React.SetStateAction<Prosedur[]>>;
}

export default function ProsedurListesi({ prosedurler, setProsedurler }: Props) {
  const [arama, setArama]       = useState("");
  const [acik, setAcik]         = useState<string | null>(null);
  const [modalAcik, setModalAcik] = useState(false);
  const [duzenle, setDuzenle]   = useState<Prosedur | null>(null);
  const [silOnayi, setSilOnayi] = useState<Prosedur | null>(null);

  const filtrelenmis = useMemo(() =>
    prosedurler.filter((p) =>
      arama === "" ||
      p.baslik.toLowerCase().includes(arama.toLowerCase()) ||
      p.kategori.toLowerCase().includes(arama.toLowerCase())
    ), [prosedurler, arama]);

  const handleKaydet = (form: Omit<Prosedur, "id" | "sonGuncelleme">) => {
    if (duzenle) {
      setProsedurler((p) => p.map((x) => x.id === duzenle.id
        ? { ...form, id: duzenle.id, sonGuncelleme: new Date().toISOString() }
        : x
      ));
      setDuzenle(null);
    } else {
      setProsedurler((p) => [{ ...form, id: Date.now().toString(), sonGuncelleme: new Date().toISOString() }, ...p]);
    }
  };

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
          <input value={arama} onChange={(e) => setArama(e.target.value)}
            placeholder="Prosedür ara..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#94a3b8] text-sm focus:outline-none focus:border-[rgba(251,192,36,0.4)] transition-colors" />
        </div>
        <button
          onClick={() => { setDuzenle(null); setModalAcik(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#fbc024] text-[#0e172a] text-sm font-bold hover:bg-[#d9a61f] transition-colors">
          <Plus className="w-4 h-4" /> Prosedür Ekle
        </button>
      </div>

      {/* Liste */}
      <div className="space-y-2">
        {filtrelenmis.length === 0 && (
          <div className="py-16 text-center text-[#94a3b8] text-sm glass-card rounded-2xl">Prosedür bulunamadı.</div>
        )}
        {filtrelenmis.map((p, i) => {
          const durum  = prosedurDurumu(p.sonGuncelleme);
          const kRenk  = KATEGORI_RENK[p.kategori];
          const acikMi = acik === p.id;

          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="glass-card rounded-xl overflow-hidden"
            >
              {/* Başlık satırı */}
              <div
                className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-[rgba(251,192,36,0.04)] transition-colors"
                onClick={() => setAcik(acikMi ? null : p.id)}
              >
                <button className="text-[#94a3b8] shrink-0">
                  {acikMi ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>

                {/* Kategori rozeti */}
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg shrink-0"
                  style={{ color: kRenk.color, backgroundColor: kRenk.bg }}>
                  {p.kategori}
                </span>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{p.baslik}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-[#94a3b8] flex items-center gap-1">
                      <User className="w-3 h-3" />{p.sorumlu}
                    </span>
                    <span className="text-xs flex items-center gap-1" style={{ color: durum.renk }}>
                      <Clock className="w-3 h-3" />
                      {durum.gun === 0 ? "Bugün güncellendi" : `${durum.gun}g önce · ${durum.etiket}`}
                    </span>
                  </div>
                </div>

                {/* {p.adimlar.length} adım */}
                <span className="text-xs text-[#94a3b8] shrink-0">{p.adimlar.length} adım</span>

                {/* Aksiyonlar */}
                <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => { setDuzenle(p); setModalAcik(true); }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-[#94a3b8] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(251,192,36,0.4)] hover:text-[#fbc024] transition-all">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setSilOnayi(p)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-[#94a3b8] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(239,68,68,0.4)] hover:text-[#ef4444] transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Açık detay — adımlar */}
              <AnimatePresence>
                {acikMi && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden border-t border-[rgba(255,255,255,0.06)]"
                  >
                    <div className="px-5 py-4 space-y-3">
                      {p.aciklama && (
                        <p className="text-sm text-[#94a3b8]">{p.aciklama}</p>
                      )}
                      <div className="space-y-2">
                        {p.adimlar.map((adim) => (
                          <div key={adim.sira} className="flex items-start gap-3">
                            <span className="w-6 h-6 rounded-full bg-[rgba(251,192,36,0.15)] border border-[rgba(251,192,36,0.3)] text-[#fbc024] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                              {adim.sira}
                            </span>
                            <p className="text-sm text-[#94a3b8] leading-relaxed">{adim.aciklama}</p>
                          </div>
                        ))}
                      </div>
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
              <h3 className="text-base font-bold text-white mb-1">Prosedürü Sil</h3>
              <p className="text-sm text-[#94a3b8] mb-6">
                <span className="text-white font-semibold">{silOnayi.baslik}</span> prosedürünü kalıcı olarak silmek istiyor musunuz?
              </p>
              <div className="flex gap-3">
                <button onClick={() => setSilOnayi(null)}
                  className="flex-1 py-2.5 rounded-xl border border-[rgba(255,255,255,0.1)] text-[#94a3b8] text-sm font-medium hover:bg-[rgba(255,255,255,0.05)] transition-colors">
                  İptal
                </button>
                <button onClick={() => { setProsedurler((p) => p.filter((x) => x.id !== silOnayi.id)); setSilOnayi(null); }}
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
