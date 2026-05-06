"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, AlertTriangle, Search, ArrowUpDown } from "lucide-react";
import { MOCK_URUNLER, karHesapla, formatTL, type Urun } from "@/lib/kar-zarar-data";
import UrunModal from "./UrunModal";

type Siralama = "marj" | "kar" | "ciro";

interface Props {
  urunler: Urun[];
  setUrunler: React.Dispatch<React.SetStateAction<Urun[]>>;
}

export default function UrunMarjTablosu({ urunler, setUrunler }: Props) {
  const [arama, setArama] = useState("");
  const [siralama, setSiralama] = useState<Siralama>("marj");
  const [modalAcik, setModalAcik] = useState(false);
  const [duzenle, setDuzenle] = useState<Urun | null>(null);
  const [silOnayi, setSilOnayi] = useState<Urun | null>(null);

  const sirali = useMemo(() => {
    return urunler
      .filter((u) =>
        arama === "" ||
        u.ad.toLowerCase().includes(arama.toLowerCase()) ||
        u.kategori.toLowerCase().includes(arama.toLowerCase())
      )
      .map((u) => ({ ...u, ...karHesapla(u) }))
      .sort((a, b) =>
        siralama === "marj" ? b.marjYuzde - a.marjYuzde :
        siralama === "kar"  ? b.toplamKar  - a.toplamKar :
                               b.toplamGelir - a.toplamGelir
      );
  }, [urunler, arama, siralama]);

  const handleKaydet = (yeni: Omit<Urun, "id">) => {
    if (duzenle) {
      setUrunler((p) => p.map((u) => u.id === duzenle.id ? { ...yeni, id: duzenle.id } : u));
      setDuzenle(null);
    } else {
      setUrunler((p) => [{ ...yeni, id: Date.now().toString() }, ...p]);
    }
  };

  const marjRenk = (m: number) => m >= 30 ? "#22c55e" : m >= 15 ? "#fbc024" : "#ef4444";

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
          <input
            value={arama} onChange={(e) => setArama(e.target.value)}
            placeholder="Ürün veya kategori ara..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#94a3b8] text-sm focus:outline-none focus:border-[rgba(251,192,36,0.4)] transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          {/* Sıralama */}
          <div className="flex gap-1 p-1 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)]">
            {([
              { v: "marj", label: "Marj" },
              { v: "kar",  label: "Kar"  },
              { v: "ciro", label: "Ciro" },
            ] as const).map(({ v, label }) => (
              <button key={v} onClick={() => setSiralama(v)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  backgroundColor: siralama === v ? "rgba(251,192,36,0.15)" : "transparent",
                  color: siralama === v ? "#fbc024" : "#94a3b8",
                  border: siralama === v ? "1px solid rgba(251,192,36,0.3)" : "1px solid transparent",
                }}>
                <ArrowUpDown className="w-3 h-3" />{label}
              </button>
            ))}
          </div>
          <button
            onClick={() => { setDuzenle(null); setModalAcik(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#fbc024] text-[#0e172a] text-sm font-bold hover:bg-[#d9a61f] transition-colors"
          >
            <Plus className="w-4 h-4" />Ürün Ekle
          </button>
        </div>
      </div>

      {/* Tablo */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-[rgba(255,255,255,0.06)] text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">
          <span>Ürün</span>
          <span>Satış / Maliyet</span>
          <span>Kar Marjı</span>
          <span>Aylık Ciro</span>
          <span>Aylık Kar</span>
          <span>İşlemler</span>
        </div>

        <div className="divide-y divide-[rgba(255,255,255,0.04)]">
          {sirali.length === 0 ? (
            <div className="py-16 text-center text-[#94a3b8] text-sm">Ürün bulunamadı.</div>
          ) : (
            sirali.map((u, i) => {
              const renk = marjRenk(u.marjYuzde);
              return (
                <motion.div
                  key={u.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-5 py-4 items-center hover:bg-[rgba(251,192,36,0.03)] transition-colors"
                >
                  {/* Ürün */}
                  <div>
                    <p className="text-sm font-semibold text-white">{u.ad}</p>
                    <p className="text-xs text-[#94a3b8] mt-0.5">{u.kategori}</p>
                  </div>

                  {/* Satış / Maliyet */}
                  <div>
                    <p className="text-sm text-white font-medium">{formatTL(u.satisFiyati)}</p>
                    <p className="text-xs text-[#94a3b8]">maliyet {formatTL(u.birimMaliyet)}</p>
                  </div>

                  {/* Marj */}
                  <div>
                    <p className="text-sm font-bold" style={{ color: renk }}>
                      %{u.marjYuzde.toFixed(1)}
                    </p>
                    <div className="mt-1 h-1.5 rounded-full bg-[rgba(255,255,255,0.06)] w-16">
                      <div className="h-full rounded-full" style={{ width: `${Math.min(u.marjYuzde, 60) / 60 * 100}%`, backgroundColor: renk }} />
                    </div>
                  </div>

                  {/* Aylık ciro */}
                  <div>
                    <p className="text-sm text-white font-medium">{formatTL(u.toplamGelir)}</p>
                    <p className="text-xs text-[#94a3b8]">{u.aylikSatis} {u.birim}</p>
                  </div>

                  {/* Aylık kar */}
                  <p className="text-sm font-bold" style={{ color: renk }}>
                    {u.toplamKar >= 0 ? "+" : "-"}{formatTL(u.toplamKar)}
                  </p>

                  {/* Butonlar */}
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => { setDuzenle(u); setModalAcik(true); }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-[#94a3b8] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(251,192,36,0.4)] hover:text-[#fbc024] transition-all">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setSilOnayi(u)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-[#94a3b8] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(239,68,68,0.4)] hover:text-[#ef4444] transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        <div className="px-5 py-3 border-t border-[rgba(255,255,255,0.06)] text-xs text-[#94a3b8]">
          {sirali.length} / {urunler.length} ürün gösteriliyor
        </div>
      </div>

      {/* Modal */}
      <UrunModal
        open={modalAcik}
        onClose={() => { setModalAcik(false); setDuzenle(null); }}
        urun={duzenle}
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
              <h3 className="text-base font-bold text-white mb-1">Ürünü Sil</h3>
              <p className="text-sm text-[#94a3b8] mb-6">
                <span className="text-white font-semibold">{silOnayi.ad}</span> ürününü kar-zarar tablosundan kaldırmak istediğinizden emin misiniz?
              </p>
              <div className="flex gap-3">
                <button onClick={() => setSilOnayi(null)}
                  className="flex-1 py-2.5 rounded-xl border border-[rgba(255,255,255,0.1)] text-[#94a3b8] text-sm font-medium hover:bg-[rgba(255,255,255,0.05)] transition-colors">
                  İptal
                </button>
                <button
                  onClick={() => { setUrunler((p) => p.filter((u) => u.id !== silOnayi.id)); setSilOnayi(null); }}
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
