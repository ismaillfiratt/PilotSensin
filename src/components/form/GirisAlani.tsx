"use client";

import type { InputHTMLAttributes, ReactNode } from "react";

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  label?:  string;
  hata?:   string;
  suffix?: ReactNode;
  prefix?: ReactNode;
}

const BASE =
  "w-full min-h-12 px-4 rounded-xl text-sm text-gray-800 bg-white " +
  "border border-gray-200 placeholder-gray-400 " +
  "focus:outline-none focus:border-[var(--leaf)] focus:ring-1 focus:ring-[var(--leaf)]/20 " +
  "transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50";

export default function GirisAlani({ label, hata, suffix, prefix, className = "", ...props }: Props) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
      )}
      <div className="relative">
        {prefix && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            {prefix}
          </div>
        )}
        <input
          className={`${BASE} ${prefix ? "pl-10" : ""} ${suffix ? "pr-10" : ""} ${className}`}
          {...props}
        />
        {suffix && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            {suffix}
          </div>
        )}
      </div>
      {hata && <p className="mt-1 text-xs text-red-500">{hata}</p>}
    </div>
  );
}
