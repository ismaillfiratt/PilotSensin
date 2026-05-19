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
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose} />
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
        drag="y" dragConstraints={{ top: 0 }} dragElastic={{ top: 0, bottom: 0.3 }}
        onDragEnd={(_, info) => { if (info.velocity.y > 300 || info.offset.y > 120) onClose(); }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed z-50 bg-white bottom-0 inset-x-0 rounded-t-2xl border-t border-gray-200 max-h-[90vh] overflow-y-auto md:bottom-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:border md:max-w-lg md:w-full">
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className="w-12 h-1 rounded-full bg-gray-200" />
        </div>

          <div className="flex items-start justify-between px-5 pt-4 pb-2">
            <div>
              <h2 className="text-lg font-bold text-gray-800">{prosedur ? "Prosedürü Düzenle" : "Yeni Prosedür"}</h2>
              <p className="text-xs text-gray-400 mt-0.5">Adım adım talimat belgesi</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-800 hover:bg-gray-50 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form id="prosedur-form" onSubmit={handleSubmit} className="px-5 pb-3 space-y-4">
            <div>
              <label className="text-xs text-gray-400 font-medium block mb-1.5">Prosedür Başlığı *</label>
              <input required value={baslik} onChange={e => setBaslik(e.target.value)}
                placeholder="örn. Sabah Açılış Prosedürü"
                className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-[#94a3b8] focus:outline-none focus:border-[var(--leaf)] transition-colors text-sm" />
            </div>

            {/* #5: KomboSecici blur backdrop ile */}
            <div className="grid grid-cols-2 gap-3">
              <KomboSecici label="Kategori" secili={kategori} onSecim={setKategori}
                maddeler={allKategoriler} onEkle={ozelKategoriEkle} onSil={ozelKategoriSil} />
              <KomboSecici label="Sorumlu" secili={sorumlu} onSecim={setSorumlu}
                maddeler={allSorumlular} onEkle={ozelSorumluEkle} onSil={ozelSorumluSil} />
            </div>

            <div>
              <label className="text-xs text-gray-400 font-medium block mb-1.5">Açıklama</label>
              <textarea value={aciklama} onChange={e => setAciklama(e.target.value)}
                placeholder="Bu prosedürün amacı..." rows={2}
                className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-[#94a3b8] focus:outline-none focus:border-[var(--leaf)] transition-colors text-sm resize-none" />
            </div>

            {/* Adımlar — sürükle-bırak */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Adımlar</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Sürükleyerek sırasını değiştir</p>
                </div>
                <button type="button" onClick={adimEkle}
                  className="flex items-center gap-1 text-xs text-[var(--leaf)] hover:opacity-75 transition-colors">
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
                      border:       dragOver === i && dragging !== i ? "1px dashed var(--mint)" : "1px solid transparent",
                    }}>
                    <div className="cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-400">
                      <GripVertical className="w-4 h-4" />
                    </div>
                    <span className="w-6 h-6 rounded-full bg-[var(--mint)] border border-[var(--forest-200, #B3E8C8)] text-[var(--leaf)] text-xs font-bold flex items-center justify-center shrink-0">
                      {adim.sira}
                    </span>
                    <input value={adim.aciklama} onChange={e => adimGuncelle(i, e.target.value)}
                      placeholder={`${adim.sira}. adımı açıkla...`}
                      className="flex-1 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-[#94a3b8] focus:outline-none focus:border-[var(--leaf)] transition-colors text-sm" />
                    {adimlar.length > 1 && (
                      <button type="button" onClick={() => adimSil(i)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-[#ef4444] transition-colors shrink-0">
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
                <span className="text-xs text-gray-400">kategorisi seçildi</span>
              </div>
            )}

          </form>
          {/* Sticky footer */}
          <div className="sticky bottom-0 bg-white px-5 pt-3 border-t border-gray-200"
            style={{ paddingBottom: "max(env(safe-area-inset-bottom), 16px)" }}>
            <div className="flex gap-3">
              <button type="button" onClick={onClose}
                className="flex-1 min-h-12 rounded-xl border border-gray-200 text-gray-400 text-sm font-medium active:bg-white/5 transition-colors">
                İptal
              </button>
              <button form="prosedur-form" type="submit"
                className="flex-1 min-h-12 rounded-xl bg-[var(--forest)] text-gray-800 text-sm font-bold hover:opacity-90 transition-colors">
                {prosedur ? "Kaydet" : "Oluştur"}
              </button>
            </div>
          </div>
      </motion.div>
    </>
  );
}
