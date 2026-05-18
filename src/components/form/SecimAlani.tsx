"use client";

import type { SelectHTMLAttributes } from "react";

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label?:   string;
  hata?:    string;
  secenekler: { value: string; label: string }[];
}

export default function SecimAlani({ label, hata, secenekler, className = "", ...props }: Props) {
  return (
    <div className="w-full">
      {label && <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">{label}</label>}
      <select
        className={`w-full min-h-12 px-4 rounded-xl text-base text-white bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] focus:outline-none focus:border-[rgba(251,192,36,0.5)] transition-colors disabled:opacity-50 ${className}`}
        {...props}
      >
        {secenekler.map(({ value, label: lab }) => (
          <option key={value} value={value} className="bg-[#0e172a]">{lab}</option>
        ))}
      </select>
      {hata && <p className="mt-1 text-xs text-[#ef4444]">{hata}</p>}
    </div>
  );
}
