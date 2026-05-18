"use client";

import type { InputHTMLAttributes, ReactNode } from "react";

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  label?:      string;
  hata?:       string;
  suffix?:     ReactNode;
  prefix?:     ReactNode;
}

const BASE =
  "w-full min-h-12 px-4 rounded-xl text-base text-white bg-[rgba(255,255,255,0.05)] " +
  "border border-[rgba(255,255,255,0.08)] placeholder-[#64748b] " +
  "focus:outline-none focus:border-[rgba(251,192,36,0.5)] focus:ring-1 focus:ring-[rgba(251,192,36,0.2)] " +
  "transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

export default function GirisAlani({ label, hata, suffix, prefix, className = "", ...props }: Props) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">{label}</label>
      )}
      <div className="relative">
        {prefix && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none">
            {prefix}
          </div>
        )}
        <input
          className={`${BASE} ${prefix ? "pl-10" : ""} ${suffix ? "pr-10" : ""} ${className}`}
          {...props}
        />
        {suffix && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b]">
            {suffix}
          </div>
        )}
      </div>
      {hata && <p className="mt-1 text-xs text-[#ef4444]">{hata}</p>}
    </div>
  );
}
