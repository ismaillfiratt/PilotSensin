"use client";

import type { InputHTMLAttributes } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hata?:  string;
}

export default function TarihAlani({ label, hata, className = "", ...props }: Props) {
  return (
    <div className="w-full">
      {label && <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>}
      <input
        type="date"
        className={`w-full min-h-12 px-4 rounded-xl text-base text-gray-800 bg-gray-50 border border-gray-200 focus:outline-none focus:border-[var(--mint)] transition-colors scheme-dark disabled:opacity-50 ${className}`}
        {...props}
      />
      {hata && <p className="mt-1 text-xs text-[#ef4444]">{hata}</p>}
    </div>
  );
}
