"use client";

import { useState } from "react";
import { MOCK_URUNLER, type Urun } from "@/lib/kar-zarar-data";
import KarZararOzet from "@/components/kar-zarar/KarZararOzet";
import MarjGrafik from "@/components/kar-zarar/MarjGrafik";
import PLTablosu from "@/components/kar-zarar/PLTablosu";
import UrunMarjTablosu from "@/components/kar-zarar/UrunMarjTablosu";

export default function KarZararPage() {
  const [urunler, setUrunler] = useState<Urun[]>(MOCK_URUNLER);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Başlık */}
      <div>
        <h1 className="text-2xl font-bold text-white">Kar - Zarar Analizi</h1>
        <p className="text-sm text-[#94a3b8] mt-1">
          Ürün bazlı marj takibi ve aylık kar-zarar tablosu
        </p>
      </div>

      {/* Özet kartlar */}
      <KarZararOzet urunler={urunler} />

      {/* Grafik + P&L yan yana */}
      <div className="flex flex-col lg:flex-row gap-6">
        <MarjGrafik urunler={urunler} />
        <PLTablosu urunler={urunler} />
      </div>

      {/* Ürün marj tablosu */}
      <div>
        <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-widest mb-4">
          Ürün Kataloğu
        </h2>
        <UrunMarjTablosu urunler={urunler} setUrunler={setUrunler} />
      </div>
    </div>
  );
}
