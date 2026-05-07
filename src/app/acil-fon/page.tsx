"use client";

import { useState } from "react";
import { Settings2 } from "lucide-react";
import { useAcilFon } from "@/store/acilFon";
import FonGauge      from "@/components/acil-fon/FonGauge";
import RiskPanel     from "@/components/acil-fon/RiskPanel";
import FonGrafik     from "@/components/acil-fon/FonGrafik";
import IslemGecmisi  from "@/components/acil-fon/IslemGecmisi";
import HedefModal    from "@/components/acil-fon/HedefModal";

export default function AcilFonPage() {
  const { islemler, ayar, mevcut, islemEkle, ayarGuncelle } = useAcilFon();
  const [hedefModalAcik, setHedefModalAcik] = useState(false);

  // IslemGecmisi bileşeni setIslemler bekliyor — store wrapper
  const setIslemler = (fn: any) => {
    const yeni = typeof fn === "function" ? fn(islemler) : fn;
    const eklenenler = yeni.filter((x: any) => !islemler.find((i) => i.id === x.id));
    eklenenler.forEach((x: any) => {
      const { id, ...rest } = x;
      islemEkle(rest);
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Acil Durum Fonu</h1>
          <p className="text-sm text-[#94a3b8] mt-1">İşletmeni beklenmedik durumlara karşı koru</p>
        </div>
        <button
          onClick={() => setHedefModalAcik(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[rgba(251,192,36,0.3)] text-[#fbc024] text-sm font-medium hover:bg-[rgba(251,192,36,0.08)] transition-colors"
        >
          <Settings2 className="w-4 h-4" />
          Hedef Ayarla
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        <FonGauge mevcut={mevcut()} ayar={ayar} />
        <RiskPanel islemler={islemler} mevcut={mevcut()} ayar={ayar} />
      </div>

      <FonGrafik islemler={islemler} ayar={ayar} />

      <div>
        <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-widest mb-4">İşlem Geçmişi</h2>
        <IslemGecmisi islemler={islemler} setIslemler={setIslemler} />
      </div>

      <HedefModal
        open={hedefModalAcik}
        onClose={() => setHedefModalAcik(false)}
        ayar={ayar}
        onKaydet={ayarGuncelle}
      />
    </div>
  );
}
