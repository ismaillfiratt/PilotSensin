"use client";

import { useSearchParams } from "next/navigation";
import StokOzet          from "@/components/stok/StokOzet";
import StokTablosu       from "@/components/stok/StokTablosu";
import StokDegerTablosu  from "@/components/stok/StokDegerTablosu";
import KdvYonetimBolumu  from "@/components/stok/KdvYonetimBolumu";

export default function StokContent() {
  const params     = useSearchParams();
  const modalParam = params.get("modal");

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">Stok Yönetimi</h1>
        <p className="text-xs md:text-sm text-gray-400 mt-1">
          Ürün envanterini takip et, kritik seviyeleri yönet
        </p>
      </div>

      <StokOzet />
      <StokTablosu otomatikAcilModal={modalParam === "urun-ekle"} />
      <StokDegerTablosu />
      <KdvYonetimBolumu />
    </div>
  );
}
