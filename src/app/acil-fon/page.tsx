"use client";

import { useState } from "react";
import { Plus, Settings2, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAcilFon }  from "@/store/acilFon";
import { mevcutBirikim, type FonHedef } from "@/lib/acil-fon-data";
import FonGauge        from "@/components/acil-fon/FonGauge";
import RiskPanel       from "@/components/acil-fon/RiskPanel";
import BirikimPanel    from "@/components/acil-fon/BirikimPanel";
import IslemGecmisi    from "@/components/acil-fon/IslemGecmisi";
import HedefModal      from "@/components/acil-fon/HedefModal";

export default function AcilFonPage() {
  const { hedefler, islemler, aktifHedefId, setAktifHedef, hedefEkle, hedefGuncelle, hedefSil } = useAcilFon();

  const [hedefModalAcik, setHedefModalAcik] = useState(false);
  const [duzenleHedef,   setDuzenleHedef]   = useState<FonHedef | null>(null);
  const [silHedef,       setSilHedef]        = useState<FonHedef | null>(null);

  // Aktif hedefe göre hesapla
  const aktifHedef = aktifHedefId ? hedefler.find(h => h.id === aktifHedefId) ?? null : null;

  const filtreIslemler = aktifHedefId
    ? islemler.filter(i => i.hedefId === aktifHedefId)
    : islemler;

  const mevcut      = mevcutBirikim(filtreIslemler);
  const toplamHedef = aktifHedef
    ? aktifHedef.toplamHedef
    : hedefler.reduce((s, h) => s + h.toplamHedef, 0);
  const aylikOdeme  = aktifHedef?.aylikOdeme ?? 0;
  const gaugeAd     = aktifHedef?.ad ?? (hedefler.length > 0 ? "Tüm Hedefler" : "Hedef Yok");

  const handleHedefKaydet = (h: Omit<FonHedef, "id" | "olusturmaTarih">) => {
    if (duzenleHedef) { hedefGuncelle(duzenleHedef.id, h); setDuzenleHedef(null); }
    else              { hedefEkle(h); }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* Başlık */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Acil Durum Fonu</h1>
          <p className="text-sm text-[#94a3b8] mt-1">İşletmeni beklenmedik durumlara karşı koru</p>
        </div>
        <button
          onClick={() => { setDuzenleHedef(null); setHedefModalAcik(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#fbc024] text-[#0e172a] text-sm font-bold hover:bg-[#d9a61f] transition-colors"
        >
          <Plus className="w-4 h-4" /> Yeni Hedef
        </button>
      </div>

      {/* Hedef seçici sekmeleri */}
      {hedefler.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 flex-wrap">
          {/* Tümü */}
          <button
            onClick={() => setAktifHedef(null)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border shrink-0"
            style={{
              borderColor:     aktifHedefId === null ? "#fbc024" : "rgba(255,255,255,0.1)",
              backgroundColor: aktifHedefId === null ? "rgba(251,192,36,0.15)" : "rgba(255,255,255,0.03)",
              color:           aktifHedefId === null ? "#fbc024" : "#94a3b8",
            }}
          >
            <Settings2 className="w-3.5 h-3.5" />
            Tüm Hedefler
          </button>

          {/* Her hedef */}
          {hedefler.map(h => {
            const hMevcut = mevcutBirikim(islemler, h.id);
            const hOran   = h.toplamHedef > 0 ? Math.min(hMevcut / h.toplamHedef, 1) : 0;
            const hRenk   = hOran >= 0.75 ? "#22c55e" : hOran >= 0.5 ? "#fbc024" : "#ef4444";
            const aktif   = aktifHedefId === h.id;
            return (
              <div key={h.id} className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setAktifHedef(h.id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border"
                  style={{
                    borderColor:     aktif ? hRenk : "rgba(255,255,255,0.1)",
                    backgroundColor: aktif ? `${hRenk}20` : "rgba(255,255,255,0.03)",
                    color:           aktif ? hRenk : "#94a3b8",
                  }}
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: hRenk }} />
                  {h.ad}
                  <span className="text-[10px] opacity-70">%{Math.round(hOran * 100)}</span>
                </button>
                {/* Düzenle / Sil butonları — her zaman görünür */}
                <button
                  onClick={() => { setDuzenleHedef(h); setHedefModalAcik(true); }}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-[#94a3b8] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(251,192,36,0.4)] hover:text-[#fbc024] transition-all"
                >
                  <Pencil className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setSilHedef(h)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-[#94a3b8] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(239,68,68,0.4)] hover:text-[#ef4444] transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Boş durum — henüz hedef yok */}
      {hedefler.length === 0 && (
        <div className="glass-card rounded-2xl p-8 text-center">
          <p className="text-[#94a3b8] text-sm mb-3">Henüz bir tasarruf hedefi eklenmedi.</p>
          <button
            onClick={() => setHedefModalAcik(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#fbc024] text-[#0e172a] text-sm font-bold hover:bg-[#d9a61f] transition-colors"
          >
            <Plus className="w-4 h-4" /> İlk Hedefi Ekle
          </button>
        </div>
      )}

      {/* Gauge + Risk */}
      {hedefler.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          <FonGauge ad={gaugeAd} mevcut={mevcut} toplamHedef={toplamHedef} aylikOdeme={aylikOdeme} />
          <RiskPanel islemler={filtreIslemler} hedef={aktifHedef} mevcut={mevcut} toplamHedef={toplamHedef} />
        </div>
      )}

      {/* Birikim paneli */}
      {hedefler.length > 0 && <BirikimPanel />}

      {/* İşlem geçmişi */}
      {hedefler.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-widest mb-4">İşlem Geçmişi</h2>
          <IslemGecmisi />
        </div>
      )}

      {/* Hedef Modal */}
      <HedefModal
        open={hedefModalAcik}
        onClose={() => { setHedefModalAcik(false); setDuzenleHedef(null); }}
        mevcutHedef={duzenleHedef ?? undefined}
        onKaydet={handleHedefKaydet}
      />

      {/* Hedef Silme Onayı */}
      <AnimatePresence>
        {silHedef && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setSilHedef(null)}
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
              <h3 className="text-base font-bold text-white mb-1">Hedefi Sil</h3>
              <p className="text-sm text-[#94a3b8] mb-6">
                <span className="text-white font-semibold">"{silHedef.ad}"</span> hedefi ve bu hedefe bağlı tüm veriler silinecek. Emin misiniz?
              </p>
              <div className="flex gap-3">
                <button onClick={() => setSilHedef(null)}
                  className="flex-1 py-2.5 rounded-xl border border-[rgba(255,255,255,0.1)] text-[#94a3b8] text-sm font-medium hover:bg-[rgba(255,255,255,0.05)] transition-colors">
                  İptal
                </button>
                <button onClick={() => { hedefSil(silHedef.id); setSilHedef(null); }}
                  className="flex-1 py-2.5 rounded-xl bg-[#ef4444] text-white text-sm font-bold hover:bg-[#dc2626] transition-colors">
                  Evet, Sil
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
