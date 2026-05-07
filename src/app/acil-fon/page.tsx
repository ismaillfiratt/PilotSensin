"use client";

import { useState } from "react";
import { Settings2 } from "lucide-react";
import { mevcutBirikim, type FonIslem, type FonAyar } from "@/lib/acil-fon-data";
import FonGauge from "@/components/acil-fon/FonGauge";
import RiskPanel from "@/components/acil-fon/RiskPanel";
import FonGrafik from "@/components/acil-fon/FonGrafik";
import IslemGecmisi from "@/components/acil-fon/IslemGecmisi";
import HedefModal from "@/components/acil-fon/HedefModal";

export default function AcilFonPage() {
  const [islemler, setIslemler] = useState<FonIslem[]>([]);
  const [ayar, setAyar]         = useState<FonAyar>({ hedef: 30000, aylikHedef: 3000, aylarSayisi: 3 });
  const [hedefModalAcik, setHedefModalAcik] = useState(false);

  const mevcut = mevcutBirikim(islemler);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Başlık */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Acil Durum Fonu</h1>
          <p className="text-sm text-[#94a3b8] mt-1">
            İşletmeni beklenmedik durumlara karşı koru
          </p>
        </div>
        <button
          onClick={() => setHedefModalAcik(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[rgba(251,192,36,0.3)] text-[#fbc024] text-sm font-medium hover:bg-[rgba(251,192,36,0.08)] transition-colors"
        >
          <Settings2 className="w-4 h-4" />
          Hedef Ayarla
        </button>
      </div>

      {/* Üst bölüm: Gauge + Risk paneli */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        <FonGauge mevcut={mevcut} ayar={ayar} />
        <RiskPanel islemler={islemler} mevcut={mevcut} ayar={ayar} />
      </div>

      {/* Grafik */}
      <FonGrafik islemler={islemler} ayar={ayar} />

      {/* İşlem geçmişi */}
      <div>
        <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-widest mb-4">
          İşlem Geçmişi
        </h2>
        <IslemGecmisi islemler={islemler} setIslemler={setIslemler} />
      </div>

      {/* Hedef modalı */}
      <HedefModal
        open={hedefModalAcik}
        onClose={() => setHedefModalAcik(false)}
        ayar={ayar}
        onKaydet={setAyar}
      />
    </div>
  );
}
