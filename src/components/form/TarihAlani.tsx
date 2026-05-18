"use client";

import type { InputHTMLAttributes } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hata?:  string;
}

export default function TarihAlani({ label, hata, className = "", ...props }: Props) {
  return (
    <div className="w-full">
      {label && <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">{label}</label>}
      <input
        type="date"
        className={`w-full min-h-12 px-4 rounded-xl text-base text-white bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] focus:outline-none focus:border-[rgba(251,192,36,0.5)] transition-colors scheme-dark disabled:opacity-50 ${className}`}
        {...props}
      />
      {hata && <p className="mt-1 text-xs text-[#ef4444]">{hata}</p>}
    </div>
  );
}
