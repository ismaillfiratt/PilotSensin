"use client";

import { useState } from "react";
import { Plus, Settings2, Pencil, Trash2 } from "lucide-react";
import { useAcilFon }  from "@/store/acilFon";
import { onaylaSil } from "@/lib/onay";
import { useGeriAl } from "@/store/geriAl";
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

  const handleHedefSil = async (h: FonHedef) => {
    const { onaylandi } = await onaylaSil({ tip: "acilFonHedef", isim: h.ad });
    if (!onaylandi) return;
    await hedefSil(h.id);
    useGeriAl.getState().goster({
      mesaj: `"${h.ad}" hedefi silindi.`,
      sureMs: 10000,
      geriAlFn: async () => useAcilFon.getState().hedefGeriAl(h.id),
    });
  };

  // Aktif hedefe göre hesapla
  const aktifHedef = aktifHedefId ? hedefler.find(h => h.id === aktifHedefId) ?? null : null;

  const filtreIslemler = aktifHedefId
    ? islemler.filter(i => i.hedefId === aktifHedefId)
    : islemler;

  const mevcut      = mevcutBirikim(filtreIslemler);
  const toplamHedefKurus = aktifHedef
    ? aktifHedef.toplamHedefKurus
    : hedefler.reduce((s, h) => s + h.toplamHedefKurus, 0);
  const aylikOdemeKurus  = aktifHedef?.aylikOdemeKurus ?? 0;
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
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">Acil Durum Fonu</h1>
          <p className="text-xs md:text-sm text-gray-400 mt-1">İşletmeni beklenmedik durumlara karşı koru</p>
        </div>
        <button
          onClick={() => { setDuzenleHedef(null); setHedefModalAcik(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--forest)] text-gray-800 text-sm font-bold hover:opacity-90 transition-colors"
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
              borderColor:     aktifHedefId === null ? "var(--leaf)" : "rgba(255,255,255,0.1)",
              backgroundColor: aktifHedefId === null ? "var(--mint)" : "rgba(255,255,255,0.03)",
              color:           aktifHedefId === null ? "var(--leaf)" : "#94a3b8",
            }}
          >
            <Settings2 className="w-3.5 h-3.5" />
            Tüm Hedefler
          </button>

          {/* Her hedef */}
          {hedefler.map(h => {
            const hMevcut = mevcutBirikim(islemler, h.id);
            const hOran   = h.toplamHedefKurus > 0 ? Math.min(hMevcut / h.toplamHedefKurus, 1) : 0;
            const hRenk   = hOran >= 0.75 ? "#22c55e" : hOran >= 0.5 ? "var(--leaf)" : "#ef4444";
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
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 border border-gray-200 hover:border-[var(--forest-300, #7DD0A0)] hover:text-[var(--leaf)] transition-all"
                >
                  <Pencil className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleHedefSil(h)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 border border-gray-200 hover:border-[rgba(239,68,68,0.4)] hover:text-[#ef4444] transition-all"
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
        <div className="card rounded-2xl p-8 text-center">
          <p className="text-gray-400 text-sm mb-3">Henüz bir tasarruf hedefi eklenmedi.</p>
          <button
            onClick={() => setHedefModalAcik(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--forest)] text-gray-800 text-sm font-bold hover:opacity-90 transition-colors"
          >
            <Plus className="w-4 h-4" /> İlk Hedefi Ekle
          </button>
        </div>
      )}

      {/* Gauge + Risk */}
      {hedefler.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          <FonGauge ad={gaugeAd} mevcut={mevcut} toplamHedefKurus={toplamHedefKurus} aylikOdemeKurus={aylikOdemeKurus} />
          <RiskPanel islemler={filtreIslemler} hedef={aktifHedef} mevcut={mevcut} toplamHedefKurus={toplamHedefKurus} />
        </div>
      )}

      {/* Birikim paneli */}
      {hedefler.length > 0 && <BirikimPanel />}

      {/* İşlem geçmişi */}
      {hedefler.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">İşlem Geçmişi</h2>
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

    </div>
  );
}
