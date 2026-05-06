"use client";

import { useSearchParams } from "next/navigation";
import StokOzet from "@/components/stok/StokOzet";
import StokTablosu from "@/components/stok/StokTablosu";

export default function StokContent() {
  const params     = useSearchParams();
  const modalParam = params.get("modal");

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Stok Yönetimi</h1>
          <p className="text-sm text-[#94a3b8] mt-1">
            Ürün envanterini takip et, kritik seviyeleri yönet
          </p>
        </div>
      </div>

      <StokOzet />
      <StokTablosu otomatikAcilModal={modalParam === "urun-ekle"} />
    </div>
  );
}
