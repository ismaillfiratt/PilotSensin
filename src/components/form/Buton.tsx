"use client";

import type { ButtonHTMLAttributes } from "react";

type Varyant = "primary" | "secondary" | "danger" | "ikon";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  varyant?: Varyant;
  yukleniyor?: boolean;
}

const STILLER: Record<Varyant, string> = {
  primary:
    "min-h-12 px-6 rounded-xl text-sm font-semibold bg-[#fbc024] text-[#0e172a] " +
    "active:scale-[0.97] hover:bg-[#d9a61f] transition-all disabled:opacity-60 disabled:cursor-not-allowed",
  secondary:
    "min-h-12 px-6 rounded-xl text-sm font-medium text-[#94a3b8] " +
    "bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.10)] " +
    "active:bg-white/10 hover:bg-white/10 transition-colors disabled:opacity-60",
  danger:
    "min-h-12 px-6 rounded-xl text-sm font-semibold bg-[#ef4444] text-white " +
    "active:scale-[0.97] hover:bg-[#dc2626] transition-all disabled:opacity-60",
  ikon:
    "min-h-11 min-w-11 flex items-center justify-center rounded-xl text-[#94a3b8] " +
    "active:bg-white/5 hover:bg-white/5 transition-colors disabled:opacity-50",
};

export default function Buton({
  varyant = "primary",
  yukleniyor = false,
  children,
  className = "",
  disabled,
  ...props
}: Props) {
  return (
    <button
      disabled={disabled || yukleniyor}
      className={`${STILLER[varyant]} ${className}`}
      {...props}
    >
      {yukleniyor ? (
        <span className="flex items-center justify-center gap-2">
          <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
          {children}
        </span>
      ) : children}
    </button>
  );
}
