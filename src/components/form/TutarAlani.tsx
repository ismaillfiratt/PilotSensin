"use client";

import { useState } from "react";
import type { Kurus } from "@/lib/para";

interface Props {
  label?:     string;
  value:      Kurus;        // kuruş
  onChange:   (k: Kurus) => void;
  required?:  boolean;
  disabled?:  boolean;
  placeholder?: string;
  hata?:      string;
  id?:        string;
}

/** TL olarak gösterir, kuruş olarak saklar. Boş bırakılırsa 0. */
export default function TutarAlani({
  label, value, onChange, required, disabled, placeholder = "0,00", hata, id,
}: Props) {
  const [yazilan, setYazilan] = useState<string>(
    value > 0 ? (value / 100).toLocaleString("tr-TR", { minimumFractionDigits: 2 }) : ""
  );

  const handleBlur = () => {
    const temiz = yazilan.replace(/\./g, "").replace(",", ".");
    const sayi  = parseFloat(temiz);
    if (!isNaN(sayi) && sayi >= 0) {
      const yeniKurus = Math.round(sayi * 100);
      onChange(yeniKurus);
      setYazilan(yeniKurus > 0 ? (yeniKurus / 100).toLocaleString("tr-TR", { minimumFractionDigits: 2 }) : "");
    } else {
      onChange(0);
      setYazilan("");
    }
  };

  return (
    <div className="w-full">
      {label && <label className="block text-xs font-medium text-gray-400 mb-1.5" htmlFor={id}>{label}</label>}
      <div className="relative">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          required={required}
          disabled={disabled}
          value={yazilan}
          placeholder={placeholder}
          onChange={(e) => setYazilan(e.target.value)}
          onBlur={handleBlur}
          className="w-full min-h-12 pl-4 pr-10 rounded-xl text-base text-gray-800 font-semibold bg-gray-50 border border-gray-200 placeholder-gray-400 focus:outline-none focus:border-[var(--mint)] focus:ring-1 focus:ring-[var(--forest-100, #D9F2E4)] transition-colors disabled:opacity-50"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500 pointer-events-none">₺</span>
      </div>
      {hata && <p className="mt-1 text-xs text-[#ef4444]">{hata}</p>}
    </div>
  );
}
