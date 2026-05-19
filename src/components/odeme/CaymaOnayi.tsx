"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";

interface Props {
  onChange?: (gecerli: boolean) => void;
}

/**
 * Ödeme akışına bağlanmak üzere hazır cayma hakkı onay bileşeni.
 * Mesafeli Sözleşmeler Yönetmeliği md. 15/1-h gereği ödeme öncesi gösterilir.
 * Her iki checkbox da zorunludur; her ikisi işaretlendiğinde onChange(true) çağrılır.
 */
export default function CaymaOnayi({ onChange }: Props) {
  const [caymaFeragat,  setCaymaFeragat]  = useState(false);
  const [sozlesmeKabul, setSozlesmeKabul] = useState(false);

  const toggle = (alan: "cayma" | "sozlesme") => {
    const yeniCayma     = alan === "cayma"    ? !caymaFeragat  : caymaFeragat;
    const yeniSozlesme  = alan === "sozlesme" ? !sozlesmeKabul : sozlesmeKabul;
    if (alan === "cayma")    setCaymaFeragat(!caymaFeragat);
    if (alan === "sozlesme") setSozlesmeKabul(!sozlesmeKabul);
    onChange?.(yeniCayma && yeniSozlesme);
  };

  return (
    <div className="space-y-3">
      {/* Checkbox 1 — Cayma hakkı feragati */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => toggle("cayma")}
        onKeyDown={e => e.key === " " && toggle("cayma")}
        className="flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none"
        style={{
          borderColor:     caymaFeragat ? "var(--forest-300, #7DD0A0)" : "rgba(255,255,255,0.1)",
          backgroundColor: caymaFeragat ? "var(--mint)" : "rgba(255,255,255,0.02)",
        }}
      >
        <div
          className="w-4 h-4 rounded flex items-center justify-center shrink-0 mt-0.5 transition-colors"
          style={{
            backgroundColor: caymaFeragat ? "var(--leaf)" : "transparent",
            border: caymaFeragat ? "1.5px solid var(--leaf)" : "1.5px solid rgba(255,255,255,0.25)",
          }}
        >
          {caymaFeragat && <Check className="w-3 h-3 text-gray-900" />}
        </div>
        <p className="text-xs text-gray-400 leading-relaxed">
          Mesafeli Sözleşmeler Yönetmeliği madde 15/1-h gereği dijital içerik hizmetinde
          cayma hakkım bulunmadığını ve hizmet kullanımı başladığı anda cayma hakkımdan{" "}
          <span className="text-white font-semibold">FERAGAT</span> ettiğimi kabul ediyorum.
        </p>
      </div>

      {/* Checkbox 2 — Sözleşme kabulü */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => toggle("sozlesme")}
        onKeyDown={e => e.key === " " && toggle("sozlesme")}
        className="flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none"
        style={{
          borderColor:     sozlesmeKabul ? "var(--forest-300, #7DD0A0)" : "rgba(255,255,255,0.1)",
          backgroundColor: sozlesmeKabul ? "var(--mint)" : "rgba(255,255,255,0.02)",
        }}
      >
        <div
          className="w-4 h-4 rounded flex items-center justify-center shrink-0 mt-0.5 transition-colors"
          style={{
            backgroundColor: sozlesmeKabul ? "var(--leaf)" : "transparent",
            border: sozlesmeKabul ? "1.5px solid var(--leaf)" : "1.5px solid rgba(255,255,255,0.25)",
          }}
        >
          {sozlesmeKabul && <Check className="w-3 h-3 text-gray-900" />}
        </div>
        <p className="text-xs text-gray-400 leading-relaxed">
          <Link href="/politikalar/mesafeli-satis" target="_blank" onClick={e => e.stopPropagation()} className="text-[var(--leaf)] hover:underline">
            Mesafeli Satış Sözleşmesi
          </Link>
          {" ve "}
          <Link href="/politikalar/on-bilgilendirme" target="_blank" onClick={e => e.stopPropagation()} className="text-[var(--leaf)] hover:underline">
            Ön Bilgilendirme Formu
          </Link>
          {"'nu okudum, elektronik kopyalarını aldım, kabul ediyorum."}
        </p>
      </div>
    </div>
  );
}
