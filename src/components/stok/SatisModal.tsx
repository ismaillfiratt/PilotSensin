"use client";

import { useState, useMemo }  from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingCart, TrendingUp, AlertTriangle } from "lucide-react";
import { type Urun } from "@/lib/stok-data";
import { satisYap }  from "@/lib/islemler";
import { kurus }     from "@/lib/para";

const tl = (n: number) =>
  n.toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 2 });

interface Props { urun: Urun | null; onClose: () => void; }

export default function SatisModal({ urun, onClose }: Props) {
  // birimMaliyetKurus: TL float (for display/hesap calculation)
  const birimMaliyetKurus = urun?.birimMaliyetKurus != null ? urun.birimMaliyetKurus / 100 : 0;

  const [adet,     setAdet]  = useState("1");
  const [fiyat,    setFiyat] = useState("");
  const [kdvDahil, setKdvDahil] = useState(false);
  // KDV oranı stok'tan — kullanıcı seçmez
  const kdvOrani = urun?.satisKdvOrani ?? 20;
  const [aciklama,   setAciklama]   = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata,       setHata]       = useState<string | null>(null);

  const hesap = useMemo(() => {
    const a = Number(adet)  || 0;
    const f = Number(fiyat) || 0;
    const birimFiyatNetHariç  = kdvDahil ? f / (1 + kdvOrani / 100) : f;
    const birimKdvKurus            = birimFiyatNetHariç * kdvOrani / 100;
    const birimFiyatKDVdahil  = birimFiyatNetHariç + birimKdvKurus;
    const birimKarKurus            = birimFiyatNetHariç - birimMaliyetKurus;
    return {
      birimFiyatNetHariç,
      birimKdvKurus,
      birimFiyatKDVdahil,
      birimKarKurus,
      toplamCiroKurus:  birimFiyatNetHariç * a,
      toplamKdvKurus:   birimKdvKurus * a,
      kasaGirisKurus:   birimFiyatKDVdahil * a,
      brutKarKurus:     birimKarKurus * a,
      brutMarj:    birimFiyatNetHariç > 0 ? (birimKarKurus / birimFiyatNetHariç) * 100 : 0,
    };
  }, [adet, fiyat, kdvOrani, kdvDahil, birimMaliyetKurus]);

  if (!urun) return null;

  const stokYeterli = urun.mevcutAdet >= (Number(adet) || 0);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!stokYeterli || Number(adet) <= 0 || Number(fiyat) <= 0) return;
    setYukleniyor(true);
    setHata(null);

    const sonuc = await satisYap({
      urunId:           urun.id,
      adet:             Number(adet),
      birimSatisFiyatiKurus: kurus(hesap.birimFiyatNetHariç),
      kdvOrani:         kdvOrani / 100,
      odemeYontemi:     "nakit",
      aciklama:         aciklama.trim() || undefined,
    });

    setYukleniyor(false);

    if (sonuc.basarili) {
      onClose();
    } else {
      setHata(sonuc.hata ?? "Bilinmeyen hata");
    }
  };

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
          className="w-full max-w-md card rounded-2xl p-6 space-y-4"
        >
          {/* Başlık */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-[#22c55e]" />
                Satış Yap
              </h2>
              <p className="text-sm text-gray-400 mt-0.5">
                {urun.ad} — Stok: <span className="text-gray-800 font-medium">{urun.mevcutAdet} {urun.birim}</span>
              </p>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-800 hover:bg-gray-50 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {/* Adet */}
              <div>
                <label className="text-xs text-gray-400 font-medium block mb-1.5">Satış Adedi *</label>
                <input
                  type="number" min="1" max={urun.mevcutAdet} required
                  value={adet} onChange={(e) => setAdet(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:outline-none focus:border-[rgba(34,197,94,0.5)] text-lg font-bold text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              {/* Birim satış fiyatı */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs text-gray-400 font-medium">Birim Satış Fiyatı *</label>
                  <button type="button" onClick={() => setKdvDahil((v) => !v)}
                    className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${kdvDahil ? "border-[var(--forest-300, #7DD0A0)] text-[var(--leaf)]" : "border-gray-200 text-gray-500"}`}>
                    {kdvDahil ? "KDV Dahil" : "KDV Hariç"}
                  </button>
                </div>
                <input
                  type="number" min="0.01" step="0.01" required
                  value={fiyat} onChange={(e) => setFiyat(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:outline-none focus:border-[rgba(34,197,94,0.5)] text-lg font-bold [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>

            {/* KDV oranı — stoktan, read-only */}
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-gray-50 border border-gray-200">
              <span className="text-xs text-gray-400">Satış KDV Oranı</span>
              <span className="text-xs font-semibold text-gray-600">
                %{kdvOrani}
                <span className="text-gray-400 font-normal ml-1">(Stok'tan)</span>
              </span>
            </div>

            {/* Açıklama */}
            <div>
              <label className="text-xs text-gray-400 font-medium block mb-1.5">Açıklama</label>
              <input type="text" value={aciklama} onChange={(e) => setAciklama(e.target.value)}
                placeholder="Opsiyonel not..."
                className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-[#475569] focus:outline-none text-sm" />
            </div>

            {/* Önizleme */}
            {Number(adet) > 0 && Number(fiyat) > 0 && (
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-2 text-xs">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Satış Özeti</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-gray-500">
                  <div className="flex justify-between">
                    <span>Birim Fiyat (KDV Hz)</span>
                    <span className="text-gray-800">{tl(hesap.birimFiyatNetHariç)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Birim Maliyet</span>
                    <span className="text-gray-800">{tl(birimMaliyetKurus)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Toplam Ciro</span>
                    <span className="text-gray-800">{tl(hesap.toplamCiroKurus)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>KDV Tutarı</span>
                    <span className="text-[var(--leaf)]">+{tl(hesap.toplamKdvKurus)}</span>
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-2 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-gray-500">Kasaya Giren</p>
                    <p className="text-base font-bold text-[#22c55e]">{tl(hesap.kasaGirisKurus)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500">Brüt Kâr</p>
                    <p className="text-base font-bold" style={{ color: hesap.brutKarKurus >= 0 ? "#22c55e" : "#ef4444" }}>
                      {hesap.brutKarKurus >= 0 ? "+" : ""}{tl(hesap.brutKarKurus)}
                      <span className="text-[10px] text-gray-500 ml-1">%{Math.abs(hesap.brutMarj).toFixed(1)}</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Stok uyarısı */}
            {!stokYeterli && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)]">
                <AlertTriangle className="w-4 h-4 text-[#ef4444] shrink-0" />
                <p className="text-xs text-[#ef4444]">
                  Yetersiz stok! Mevcut: {urun.mevcutAdet} {urun.birim}
                </p>
              </div>
            )}

            {/* İşlem hatası */}
            {hata && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)]">
                <AlertTriangle className="w-4 h-4 text-[#ef4444] shrink-0" />
                <p className="text-xs text-[#ef4444]">{hata}</p>
              </div>
            )}

            {/* Butonlar */}
            <div className="flex gap-3">
              <button type="button" onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-400 text-sm font-medium hover:bg-gray-50 transition-colors">
                İptal
              </button>
              <button
                type="submit"
                disabled={!stokYeterli || yukleniyor || Number(adet) <= 0 || Number(fiyat) <= 0}
                className="flex-1 py-3 rounded-xl bg-[#22c55e] text-gray-800 text-sm font-bold hover:bg-[#16a34a] transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                {yukleniyor ? "Kaydediliyor..." : "Satışı Onayla"}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
