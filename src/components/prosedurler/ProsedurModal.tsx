"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2, GripVertical } from "lucide-react";
import { getKategoriRenk, type Prosedur, type ProsedurAdim } from "@/lib/prosedur-data";
import { useProsedurler, tumKategoriler, tumSorumlular } from "@/store/prosedurler";
import KomboSecici from "./KomboSecici";

interface Props {
  open: boolean;
  onClose: () => void;
  prosedur?: Prosedur | null;
  onKaydet: (p: Omit<Prosedur, "id" | "sonGuncelleme">) => void;
}

const bosAdim = (): ProsedurAdim => ({ sira: 1, aciklama: "" });

export default function ProsedurModal({ open, onClose, prosedur, onKaydet }: Props) {
  const {
    ozelKategoriler, ozelSorumlular, ozelKategoriEkle, ozelKategoriSil, ozelSorumluEkle, ozelSorumluSil,
    gizliVarsayilanKategoriler, gizliVarsayilanSorumlular,
  } = useProsedurler();

  const allKategoriler = tumKategoriler(ozelKategoriler, gizliVarsayilanKategoriler);
  const allSorumlular  = tumSorumlular(ozelSorumlular, gizliVarsayilanSorumlular);

  const [baslik,   setBaslik]   = useState("");
  const [kategori, setKategori] = useState(allKategoriler[0] ?? "Diğer");
  const [aciklama, setAciklama] = useState("");
  const [sorumlu,  setSorumlu]  = useState(allSorumlular[0] ?? "Yönetici");
  const [adimlar,  setAdimlar]  = useState<ProsedurAdim[]>([bosAdim()]);

  const [dragging, setDragging] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  useEffect(() => {
    if (open && prosedur) {
      setBaslik(prosedur.baslik);
      setKategori(prosedur.kategori);
      setAciklama(prosedur.aciklama);
      setSorumlu(prosedur.sorumlu);
      setAdimlar(prosedur.adimlar.map(a => ({ ...a })));
    } else if (open) {
      setBaslik(""); setKategori(allKategoriler[0] ?? "Diğer");
      setAciklama(""); setSorumlu(allSorumlular[0] ?? "Yönetici");
      setAdimlar([bosAdim()]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, prosedur]);

  const adimGuncelle = (i: number, v: string) =>
    setAdimlar(a => a.map((x, idx) => idx === i ? { ...x, aciklama: v } : x));
  const adimEkle = () =>
    setAdimlar(a => [...a, { sira: a.length + 1, aciklama: "" }]);
  const adimSil = (i: number) =>
    setAdimlar(a => a.filter((_, idx) => idx !== i).map((x, idx) => ({ ...x, sira: idx + 1 })));

  const onDragStart = (i: number) => setDragging(i);
  const onDragOver  = (e: React.DragEvent, i: number) => { e.preventDefault(); setDragOver(i); };
  const onDrop      = (i: number) => {
    if (dragging === null || dragging === i) { setDragging(null); setDragOver(null); return; }
    const arr = [...adimlar];
    const [item] = arr.splice(dragging, 1);
    arr.splice(i, 0, item);
    setAdimlar(arr.map((a, idx) => ({ ...a, sira: idx + 1 })));
    setDragging(null); setDragOver(null);
  };
  const onDragEnd = () => { setDragging(null); setDragOver(null); };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onKaydet({ baslik, kategori, aciklama, sorumlu, adimlar: adimlar.filter(a => a.aciklama.trim()) });
    onClose();
  };

  if (!open) return null;

  const kRenk = getKategoriRenk(kategori);

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={e => e.target === e.currentTarget && onClose()}>
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ duration: 0.2 }}
          className="w-full max-w-lg glass-card rounded-2xl p-6 max-h-[90vh] overflow-y-auto">

          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-white">{prosedur ? "Prosedürü Düzenle" : "Yeni Prosedür"}</h2>
              <p className="text-xs text-[#94a3b8] mt-0.5">Adım adım talimat belgesi</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#94a3b8] hover:text-white hover:bg-[rgba(255,255,255,0.08)] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">Prosedür Başlığı *</label>
              <input required value={baslik} onChange={e => setBaslik(e.target.value)}
                placeholder="örn. Sabah Açılış Prosedürü"
                className="w-full px-3 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#94a3b8] focus:outline-none focus:border-[rgba(251,192,36,0.5)] transition-colors text-sm" />
            </div>

            {/* #5: KomboSecici blur backdrop ile */}
            <div className="grid grid-cols-2 gap-3">
              <KomboSecici label="Kategori" secili={kategori} onSecim={setKategori}
                maddeler={allKategoriler} onEkle={ozelKategoriEkle} onSil={ozelKategoriSil} />
              <KomboSecici label="Sorumlu" secili={sorumlu} onSecim={setSorumlu}
                maddeler={allSorumlular} onEkle={ozelSorumluEkle} onSil={ozelSorumluSil} />
            </div>

            <div>
              <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">Açıklama</label>
              <textarea value={aciklama} onChange={e => setAciklama(e.target.value)}
                placeholder="Bu prosedürün amacı..." rows={2}
                className="w-full px-3 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#94a3b8] focus:outline-none focus:border-[rgba(251,192,36,0.5)] transition-colors text-sm resize-none" />
            </div>

            {/* Adımlar — sürükle-bırak */}
            <div className="border-t border-[rgba(255,255,255,0.06)] pt-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs text-[#94a3b8] font-semibold uppercase tracking-wider">Adımlar</p>
                  <p className="text-[10px] text-[#64748b] mt-0.5">Sürükleyerek sırasını değiştir</p>
                </div>
                <button type="button" onClick={adimEkle}
                  className="flex items-center gap-1 text-xs text-[#fbc024] hover:text-[#d9a61f] transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Adım Ekle
                </button>
              </div>
              <div className="space-y-2">
                {adimlar.map((adim, i) => (
                  <div key={i} draggable
                    onDragStart={() => onDragStart(i)} onDragOver={e => onDragOver(e, i)}
                    onDrop={() => onDrop(i)} onDragEnd={onDragEnd}
                    className="flex items-center gap-2 transition-all"
                    style={{
                      opacity:      dragging === i ? 0.4 : 1,
                      borderRadius: 8,
                      border:       dragOver === i && dragging !== i ? "1px dashed rgba(251,192,36,0.5)" : "1px solid transparent",
                    }}>
                    <div className="cursor-grab active:cursor-grabbing text-[#475569] hover:text-[#94a3b8]">
                      <GripVertical className="w-4 h-4" />
                    </div>
                    <span className="w-6 h-6 rounded-full bg-[rgba(251,192,36,0.15)] border border-[rgba(251,192,36,0.3)] text-[#fbc024] text-xs font-bold flex items-center justify-center shrink-0">
                      {adim.sira}
                    </span>
                    <input value={adim.aciklama} onChange={e => adimGuncelle(i, e.target.value)}
                      placeholder={`${adim.sira}. adımı açıkla...`}
                      className="flex-1 px-3 py-2 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] text-white placeholder-[#94a3b8] focus:outline-none focus:border-[rgba(251,192,36,0.4)] transition-colors text-sm" />
                    {adimlar.length > 1 && (
                      <button type="button" onClick={() => adimSil(i)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-[#94a3b8] hover:text-[#ef4444] transition-colors shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {kategori && (
              <div className="flex items-center gap-2 py-2 px-3 rounded-xl" style={{ backgroundColor: kRenk.bg }}>
                <span className="text-xs font-bold" style={{ color: kRenk.color }}>{kategori}</span>
                <span className="text-xs text-[#94a3b8]">kategorisi seçildi</span>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-[rgba(255,255,255,0.1)] text-[#94a3b8] text-sm font-medium hover:bg-[rgba(255,255,255,0.05)] transition-colors">
                İptal
              </button>
              <button type="submit"
                className="flex-1 py-3 rounded-xl bg-[#fbc024] text-[#0e172a] text-sm font-bold hover:bg-[#d9a61f] transition-colors">
                {prosedur ? "Kaydet" : "Oluştur"}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
