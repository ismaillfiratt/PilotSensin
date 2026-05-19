"use client";

import type { SelectHTMLAttributes } from "react";

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label?:     string;
  hata?:      string;
  secenekler: { value: string; label: string }[];
}

export default function SecimAlani({ label, hata, secenekler, className = "", ...props }: Props) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
      )}
      <select
        className={`w-full min-h-12 px-4 rounded-xl text-sm text-gray-800 bg-white border border-gray-200 focus:outline-none focus:border-(--leaf) focus:ring-1 focus:ring-(--leaf)/20 transition-colors disabled:opacity-50 disabled:bg-gray-50 ${className}`}
        {...props}
      >
        {secenekler.map(({ value, label: lab }) => (
          <option key={value} value={value}>{lab}</option>
        ))}
      </select>
      {hata && <p className="mt-1 text-xs text-red-500">{hata}</p>}
    </div>
  );
}
