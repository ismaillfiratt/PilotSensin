"use client";

import type { ButtonHTMLAttributes } from "react";

type Varyant = "primary" | "secondary" | "danger" | "ikon";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  varyant?: Varyant;
  yukleniyor?: boolean;
}

const STILLER: Record<Varyant, string> = {
  primary:
    "min-h-12 px-6 rounded-xl text-sm font-semibold text-white " +
    "active:scale-[0.97] transition-all disabled:opacity-50 disabled:cursor-not-allowed",
  secondary:
    "min-h-12 px-6 rounded-xl text-sm font-medium text-gray-600 " +
    "bg-white border border-gray-200 " +
    "active:bg-gray-50 hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-50",
  danger:
    "min-h-12 px-6 rounded-xl text-sm font-semibold bg-red-500 text-white " +
    "active:scale-[0.97] hover:bg-red-600 transition-all disabled:opacity-50",
  ikon:
    "min-h-11 min-w-11 flex items-center justify-center rounded-xl text-gray-400 " +
    "active:bg-gray-100 hover:bg-gray-100 hover:text-gray-600 transition-colors disabled:opacity-50",
};

export default function Buton({
  varyant = "primary",
  yukleniyor = false,
  children,
  className = "",
  disabled,
  style,
  ...props
}: Props) {
  const primaryStyle =
    varyant === "primary"
      ? { background: "var(--forest)", ...style }
      : style;

  return (
    <button
      disabled={disabled || yukleniyor}
      className={`${STILLER[varyant]} ${className}`}
      style={primaryStyle}
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
